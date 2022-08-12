import { error } from "./logging";
import { marked } from "marked";
import { createTransport } from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { PostQueryType } from "~/models/post.server";

export type EmailConfig = {
  to: string;
};

let mailTransport: Transporter<SMTPTransport.SentMessageInfo>;

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
  console.log(`Sending email notification for post ${post.id} to ${config.to}`);

  if (!process.env.BASE_URL) {
    error("BASE_URL is not configured");
    return;
  }

  if (!process.env.SMTP_FROM) {
    error("SMTP_FROM is not configured");
    return;
  }

  if (!transport) {
    transport = mailTransport = createMailTransport();
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
