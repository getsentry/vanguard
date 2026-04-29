import { error } from "./logging";
import { marked } from "marked";
import { createTransport } from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { PostQueryType } from "~/models/post.server";
import type { PostCommentWithAuthor } from "~/models/post-comments.server";
import { getSubscriptions } from "~/models/post-subscription.server";
import summarize from "./summarize";
import { inlinePrivateImages } from "./email-images";
import { lightTheme } from "~/styles/theme";
import { escapeHtml } from "./html";
import { getDisplayName } from "./user";
import { getUserById } from "~/models/user.server";
import type { User } from "~/models/user.server";

export type EmailConfig = {
  to: string;
  subjectPrefix?: string;
};

const renderer = new marked.Renderer();

renderer.image = function (href, title, text) {
  const baseUrl = process.env.BASE_URL || "";
  const src = href?.startsWith("http") ? href : `${baseUrl}${href}`;
  return `<img src="${src}" title="${title}" alt="${text}" style="max-width:100%;"/>`;
};

let mailTransport: Transporter<SMTPTransport.SentMessageInfo>;

// XXX(dcramer): futuer proof for optional email support
const hasEmailSupport = () => {
  if (!process.env.BASE_URL) {
    console.error("[email] hasEmailSupport=false — BASE_URL is not configured");
    error("BASE_URL is not configured");
    return false;
  }

  if (!process.env.SMTP_FROM) {
    console.error("[email] hasEmailSupport=false — SMTP_FROM is not configured");
    error("SMTP_FROM is not configured");
    return false;
  }

  return true;
};

const createMailTransport = () => {
  const user = process.env.SMTP_USER;
  const auth = user
    ? {
        user,
        pass: process.env.SMTP_PASS,
      }
    : undefined;

  return createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth,
  } as any);
};

export const notify = async ({
  post,
  config,
  transport = mailTransport,
}: {
  post: PostQueryType;
  config: EmailConfig;
  transport?: Transporter<SMTPTransport.SentMessageInfo>;
}) => {
  if (!hasEmailSupport()) {
    console.error(
      `[email.notify] aborted — hasEmailSupport returned false (post ${post.id} to ${config.to})`,
    );
    return;
  }

  console.log(
    `[email.notify] start — post=${post.id} to=${config.to} smtpHost=${process.env.SMTP_HOST ?? "<unset>"}`,
  );

  if (!transport) {
    if (!mailTransport) mailTransport = createMailTransport();
    transport = mailTransport;
  }

  const postUrl = `${process.env.BASE_URL}/p/${post.id}`;
  const sender = `"${getDisplayName(post.author)}" <${post.author.email}>`;
  const subject = config.subjectPrefix ? `${config.subjectPrefix} ${post.title}` : post.title;

  try {
    const rawHtml = buildPostEmail(post);
    const { html, attachments } = await inlinePrivateImages(rawHtml);
    await transport.sendMail({
      from: `"Sentry Vanguard" <${process.env.SMTP_FROM}>`,
      to: config.to,
      subject,
      replyTo: config.to,
      cc: [sender],
      sender,
      text: `View this post on Vanguard: ${postUrl}\n\n${post.content}`,
      html,
      attachments,
    });
    console.log(`[email.notify] success — post=${post.id} to=${config.to}`);
  } catch (err) {
    console.error(
      `[email.notify] sendMail threw — post=${post.id} to=${config.to}`,
      err instanceof Error ? err.message : err,
    );
    error("email notification failed");
  }
};

const resolveAvatarUrl = (picture: string | null | undefined): string => {
  if (!picture) return `${process.env.BASE_URL}/img/placeholder-avatar.png`;
  if (picture.startsWith("http://") || picture.startsWith("https://")) return picture;
  return `${process.env.BASE_URL}${picture}`;
};

const buildPostEmail = (post: PostQueryType): string => {
  const postUrl = `${process.env.BASE_URL}/p/${post.id}`;
  const html = marked.parse(post.content as string, {
    renderer,
    breaks: true,
    baseUrl: process.env.BASE_URL,
  });

  return `
    <h2 style="margin-top:0;margin-bottom:15px;color:${
      lightTheme.textColor
    };">${escapeHtml(post.title)}</h2>
    <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:top"><img src="${resolveAvatarUrl(post.author.picture)}" width="36" height="36" style="border-radius:36px;display:block;" /></td>
        <td style="padding-left:15px">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
              <b style="color:${lightTheme.textColor};">${escapeHtml(
                getDisplayName(post.author),
              )}</b>
            </td>
          </tr>
          <tr>
            <td><a href="${postUrl}" style="color:${lightTheme.linkColor};">View this Post</a></td>
          </tr>
        </td>
      </tr>
    </table>
    <div style="margin-top:15px;">${html}</td>
    `;
};

export const notifyComment = async ({
  post,
  comment,
  parent,
  config: _config,
  transport = mailTransport,
}: {
  post: PostQueryType;
  comment: PostCommentWithAuthor;
  parent?: PostCommentWithAuthor | null;
  config: EmailConfig;
  transport?: Transporter<SMTPTransport.SentMessageInfo>;
}) => {
  if (!hasEmailSupport()) return;

  if (!transport) {
    if (!mailTransport) mailTransport = createMailTransport();
    transport = mailTransport;
  }

  const commentUrl = `${process.env.BASE_URL}/p/${post.id}#c_${comment.id}`;
  const sender = `"${getDisplayName(comment.author)}" <${comment.author.email}>`;
  const subject = `Re: ${post.title}`;

  const subscriptions: User[] = await getSubscriptions({ postId: post.id });
  if (parent && !subscriptions.find((u) => u.id === parent.authorId)) {
    const parentAuthor = await getUserById(parent.authorId);
    if (parentAuthor?.notifyReplies) {
      subscriptions.push(parentAuthor);
    }
  }

  await Promise.all(
    subscriptions
      .filter((user) => user.id !== comment.authorId)
      .map(async (user) => {
        console.log(`Sending email notification for comment ${comment.id} to ${user.email}`);

        const rawCommentHtml = buildCommentHtml(user, post, comment, parent);
        const { html: commentHtml, attachments: commentAttachments } =
          await inlinePrivateImages(rawCommentHtml);

        try {
          await transport.sendMail({
            from: `"Vanguard" <${process.env.SMTP_FROM}>`,
            to: user.email,
            subject: subject,
            replyTo: comment.author.email,
            sender,
            text: `View this comment on Vanguard: ${commentUrl}\n\n${comment.content}`,
            html: commentHtml,
            attachments: commentAttachments,
          });
        } catch {
          error("email notification failed");
        }
      }),
  );
};

const buildCommentHtml = (
  toUser: User,
  post: PostQueryType,
  comment: PostCommentWithAuthor,
  parent?: PostCommentWithAuthor | null,
): string => {
  const postUrl = `${process.env.BASE_URL}/p/${post.id}`;
  const commentUrl = `${process.env.BASE_URL}/p/${post.id}#c_${comment.id}`;
  const settingsUrl = `${process.env.BASE_URL}/settings`;

  const isInReplyTo = parent && parent.authorId === toUser.id;
  const titleLine = isInReplyTo
    ? `${escapeHtml(getDisplayName(comment.author))} just replied to your comment`
    : `${escapeHtml(getDisplayName(comment.author))} left a new comment`;
  const reasonLine = isInReplyTo
    ? `You are being notified because you have notification replies enabled. <a href="${settingsUrl}">Account Settings</a>`
    : `You are being notified because you are subscribed to this post. <a href="${postUrl}">Post Settings</a>`;

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <title>New Comment</title>
      <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    </head>
    <body>
      <h2 style="margin-top:0;margin-bottom:15px;color:${lightTheme.textColor};">${titleLine}</h2>
      ${
        isInReplyTo
          ? `<p style="margin-top:0;margin-bottom:15px;color:${
              lightTheme.textColor
            };">&quot;${escapeHtml(summarize(parent.content))}&quot;</p>`
          : ""
      }
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="vertical-align:top"><img src="${resolveAvatarUrl(comment.author.picture)}" width="36" height="36" style="border-radius:36px;display:block;" /></td>
          <td style="padding-left:15px">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td><b style="color:${lightTheme.textColor};">${escapeHtml(
                  getDisplayName(comment.author),
                )}</b></td>
              </tr>
              <tr>
              <td style="color:${lightTheme.textColorSecondary};">${escapeHtml(
                summarize(comment.content),
              )}</td>
            </tr>
            <tr>
              <td style="padding-top:15px;"><a href="${commentUrl}" style="color:${
                lightTheme.linkColor
              };">View this Comment</a></td>
            </tr>
            </table>
        </tr>
      </table>
      <p style="color:${lightTheme.textColorSecondary};margin:15px 0 0;">${reasonLine}</p>
    </body>
  </html>
  `;
};
