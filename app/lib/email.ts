import { error } from "./logging";
import { marked } from "marked";
import { createTransport } from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { PostQueryType } from "~/models/post.server";
import type { PostComment } from "~/models/post-comments.server";
import { getSubscriptions } from "~/models/post-subscription.server";

export type EmailConfig = {
  to: string;
};

let mailTransport: Transporter<SMTPTransport.SentMessageInfo>;

// XXX(dcramer): futuer proof for optional email support
const hasEmailSupport = () => {
  if (!process.env.BASE_URL) {
    error("BASE_URL is not configured");
    return false;
  }

  if (!process.env.SMTP_FROM) {
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
  });
};

export const notify = async (
  post: PostQueryType,
  config: EmailConfig,
  transport: Transporter<SMTPTransport.SentMessageInfo> = mailTransport
) => {
  if (!hasEmailSupport()) return;

  console.log(`Sending email notification for post ${post.id} to ${config.to}`);

  if (!transport) {
    if (!mailTransport) mailTransport = createMailTransport();
    transport = mailTransport;
  }

  const authorUrl = `${process.env.BASE_URL}/u/${post.author.email}`;
  const postUrl = `${process.env.BASE_URL}/p/${post.id}`;
  const html = marked.parse(post.content as string, { breaks: true });
  const sender = `"${post.author.name}" <${post.author.email}>`;

  try {
    await transport.sendMail({
      from: `"Vanguard" <${process.env.SMTP_FROM}>`,
      to: config.to,
      subject: post.title,
      replyTo: config.to,
      cc: [sender],
      sender,
      text: `View this post on Vanguard: ${postUrl}\n\n${post.content}`,
      html: `
      <div style="padding:5px;border:1px solid #ccc;margin-bottom:10px">
      <h1 style="margin:0">${post.title}</h1>
      <div>Published by <a href="${authorUrl}">${post.author.name}</a></div>
      <div><a href="${postUrl}">View this post on Vanguard</a></div>
      </div>
      ${html}
      `,
    });
  } catch (err) {
    error("email notification failed");
  }
};

export const notifyComment = async (
  post: PostQueryType,
  comment: PostComment,
  config: EmailConfig,
  transport: Transporter<SMTPTransport.SentMessageInfo> = mailTransport
) => {
  if (!hasEmailSupport()) return;

  if (!transport) {
    if (!mailTransport) mailTransport = createMailTransport();
    transport = mailTransport;
  }

  const authorUrl = `${process.env.BASE_URL}/u/${comment.author.email}`;
  const commentUrl = `${process.env.BASE_URL}/p/${post.id}#c_${comment.id}`;
  const html = marked.parse(comment.content as string, { breaks: true });
  const sender = `"${comment.author.name}" <${comment.author.email}>`;

  (await getSubscriptions({ postId: post.id }))
    .filter((user) => user.id !== comment.authorId)
    .forEach(async (user) => {
      console.log(
        `Sending email notification for comment ${comment.id} to ${user.email}`
      );

      try {
        await transport.sendMail({
          from: `"Vanguard" <${process.env.SMTP_FROM}>`,
          to: user.email,
          subject: `Re: ${post.title}`,
          sender,
          text: `View this comment on Vanguard: ${commentUrl}\n\n${comment.content}`,
          html: `
          <div style="padding:5px;border:1px solid #ccc;margin-bottom:10px">
          A new comment was posted by <a href="${authorUrl}">${comment.author.name}</a></div>
          <div><a href="${commentUrl}">View this comment on Vanguard</a></div>
          </div>
          ${html}
          `,
        });
      } catch (err) {
        error("email notification failed");
      }
    });
};
