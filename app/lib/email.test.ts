import { User, Post, PostComment } from "@prisma/client";
import { createTransport, Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import * as Fixtures from "~/lib/test/fixtures";
import { prisma } from "~/db.server";

import { notify, notifyComment } from "./email";

let transport: Transporter<SMTPTransport.SentMessageInfo>;
let outbox: Mail.Options[];

const mailConfig = {
  to: "test@example.com",
};

const createEmailTestHarness = () => {
  const outbox: Mail.Options[] = [];
  const testTransport = {
    name: "test",
    version: "0.1.0",
    send: (mail, callback) => {
      const input = mail.message.createReadStream();
      const envelope = mail.message.getEnvelope();
      const messageId = mail.message.messageId();

      input.on("readable", () => {
        input.read();
      });
      input.on("end", function () {
        const info = {
          envelope,
          messageId,
          accepted: [],
          rejected: [],
          pending: [],
          response: "ok",
        };
        callback(null, info);
      });

      outbox.push(mail.data);
    },
  };

  return {
    transport: createTransport(testTransport),
    outbox: outbox,
  };
};

beforeEach(async () => {
  process.env.BASE_URL = "http://localhost";
  process.env.SMTP_FROM = "vanguard@example.com";

  const harness = createEmailTestHarness();
  transport = harness.transport;
  outbox = harness.outbox;
});

describe("notify", () => {
  let author: User;
  let post: Post;

  beforeEach(async () => {
    author = await Fixtures.User({
      name: "Joe Doe",
      email: "joe@example.com",
    });
    post = await Fixtures.Post({
      title: "An Essay",
      content: "**An Essay** on _life_",
      authorId: author.id,
    });
  });

  test("adds author to cc", async () => {
    await notify(post, mailConfig, transport);
    expect(outbox.length).toBe(1);
    const message = outbox[0];
    expect(message.cc.length).toBe(1);
    expect(message.cc[0]).toBe('"Joe Doe" <joe@example.com>');
  });
});

describe("notifyComment", () => {
  let author: User;
  let post: Post;
  let comment: PostComment;

  beforeEach(async () => {
    author = await Fixtures.User({
      name: "Joe Doe",
      email: "joe@example.com",
    });
    post = await Fixtures.Post({
      title: "An Essay",
      authorId: author.id,
    });
    comment = await Fixtures.PostComment({
      content: "**An Comment** on _life_",
      authorId: author.id,
    });

    await prisma.postSubscription.create({
      data: {
        userId: author.id,
        postId: post.id,
      },
    });
  });

  test("doesnt notify author", async () => {
    await notifyComment(post, comment, mailConfig, transport);
    expect(outbox.length).toBe(0);
  });

  test("constructs appropriate email", async () => {
    const otherAuthor = await Fixtures.User();
    await prisma.postSubscription.create({
      data: {
        userId: otherAuthor.id,
        postId: post.id,
      },
    });
    await notifyComment(post, comment, mailConfig, transport);
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.to).toBe(otherAuthor.email);
    expect(msg.subject).toBe("Re: An Essay");
  });
});
