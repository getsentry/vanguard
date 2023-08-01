import type { User, Post, PostComment } from "@prisma/client";
import type { Transporter } from "nodemailer";
import { createTransport } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import * as Fixtures from "~/lib/test/fixtures";
import { prisma } from "~/services/db.server";

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
      content:
        "**An Essay** on _life_\n\n[Hello World](/foo/bar)\n\n![An Image](/foo.jpg)",
      authorId: author.id,
    });
  });

  test("adds author to cc", async () => {
    await notify({
      post,
      config: mailConfig,
      transport,
    });
    expect(outbox.length).toBe(1);
    const message = outbox[0];
    expect(message.cc.length).toBe(1);
    expect(message.cc[0]).toBe('"Joe Doe" <joe@example.com>');
  });

  test("uses subjectPrefix", async () => {
    await notify({
      post,
      config: {
        ...mailConfig,
        subjectPrefix: "[test]",
      },
      transport,
    });
    expect(outbox.length).toBe(1);
    const message = outbox[0];
    expect(message.subject).toBe("[test] An Essay");
  });

  test("uses absolute urls", async () => {
    await notify({
      post,
      config: {
        ...mailConfig,
        subjectPrefix: "[test]",
      },
      transport,
    });
    expect(outbox.length).toBe(1);
    const message = outbox[0];

    const pictureUrl = message.html.match(
      /http\:\/\/localhost\/img\/placeholder-avatar.png/,
    );
    expect(pictureUrl[0]).toBeDefined();

    const linkUrl = message.html.match(/http\:\/\/localhost\/foo\/bar/);
    expect(linkUrl[0]).toBeDefined();

    const imgUrl = message.html.match(/http\:\/\/localhost\/foo.jpg/);
    expect(imgUrl[0]).toBeDefined();
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
    await notifyComment({ post, comment, config: mailConfig, transport });
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
    await notifyComment({
      post,
      comment,
      config: mailConfig,
      transport,
    });
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.to).toBe(otherAuthor.email);
    expect(msg.subject).toBe("Re: An Essay");
  });

  describe("with parent", () => {
    test("notifies comment author on reply", async () => {
      let otherAuthor = await Fixtures.User();
      let childComment = await Fixtures.PostComment({
        parentId: comment.id,
        authorId: otherAuthor.id,
      });
      childComment.author = otherAuthor;

      await notifyComment({
        post,
        comment: childComment,
        parent: comment,
        config: mailConfig,
        transport,
      });
      expect(outbox.length).toBe(1);
      const msg = outbox[0];
      expect(msg.to).toBe(author.email);
      expect(msg.subject).toBe("Re: An Essay");
    });
  });
});
