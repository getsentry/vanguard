// @ts-nocheck
import os from "os";
import fs from "fs/promises";
import path from "path";
import type { Transporter } from "nodemailer";
import { createTransport } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { db } from "~/db/client";
import { postSubscriptions } from "~/db/schema";
import * as Fixtures from "~/lib/test/fixtures";
import type { Post } from "~/models/post.server";
import type { PostComment } from "~/models/post-comments.server";
import type { User } from "~/models/user.server";

import { notify, notifyComment } from "./email";

const PNG_1x1 = Buffer.from(
  "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C6300010000000500010D0A2DB40000000049454E44AE426082",
  "hex",
);

const writeTmpFile = async (pathname: string, bytes: Buffer) => {
  const fp = path.join(os.tmpdir(), pathname);
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, bytes);
  return fp;
};

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
      content: "**An Essay** on _life_\n\n[Hello World](/foo/bar)\n\n![An Image](/foo.jpg)",
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

    const pictureUrl = message.html.match(/http:\/\/localhost\/img\/placeholder-avatar.png/);
    expect(pictureUrl[0]).toBeDefined();

    const linkUrl = message.html.match(/http:\/\/localhost\/foo\/bar/);
    expect(linkUrl[0]).toBeDefined();

    const imgUrl = message.html.match(/http:\/\/localhost\/foo.jpg/);
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

    await db.insert(postSubscriptions).values({ userId: author.id, postId: post.id });
  });

  test("doesnt notify author", async () => {
    await notifyComment({ post, comment, config: mailConfig, transport });
    expect(outbox.length).toBe(0);
  });

  test("constructs appropriate email", async () => {
    const otherAuthor = await Fixtures.User();
    await db.insert(postSubscriptions).values({ userId: otherAuthor.id, postId: post.id });
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
      const otherAuthor = await Fixtures.User();
      const childComment = await Fixtures.PostComment({
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

describe("notify with images", () => {
  let author: User;
  let post: Post;

  beforeEach(async () => {
    author = await Fixtures.User({
      name: "Joe Doe",
      email: "joe@example.com",
    });
  });

  test("single uploaded image is inlined as CID attachment", async () => {
    await writeTmpFile("test/foo.png", PNG_1x1);
    post = await Fixtures.Post({
      content: "![alt](/image-uploads/test/foo.png)",
      authorId: author.id,
    });
    await notify({ post, config: { to: "test@example.com" }, transport });
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.attachments).toHaveLength(1);
    const att = msg.attachments[0];
    expect(msg.html).toContain(`src="cid:${att.cid}"`);
    expect(msg.html).not.toContain("/image-uploads/test/foo.png");
    expect(att.contentType).toBe("image/png");
    expect(att.contentDisposition).toBe("inline");
  });

  test("two distinct uploaded images produce 2 attachments with distinct CIDs", async () => {
    await writeTmpFile("test/img1.png", PNG_1x1);
    await writeTmpFile("test/img2.png", PNG_1x1);
    post = await Fixtures.Post({
      content: "![a](/image-uploads/test/img1.png) ![b](/image-uploads/test/img2.png)",
      authorId: author.id,
    });
    await notify({ post, config: { to: "test@example.com" }, transport });
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.attachments).toHaveLength(2);
    const cids = msg.attachments.map((a) => a.cid);
    expect(cids[0]).not.toBe(cids[1]);
  });

  test("same image referenced twice produces 1 attachment and both tags share the CID", async () => {
    await writeTmpFile("test/shared.png", PNG_1x1);
    post = await Fixtures.Post({
      content: "![a](/image-uploads/test/shared.png) and ![b](/image-uploads/test/shared.png)",
      authorId: author.id,
    });
    await notify({ post, config: { to: "test@example.com" }, transport });
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.attachments).toHaveLength(1);
    const cid = msg.attachments[0].cid;
    const matches = [...msg.html.matchAll(new RegExp(`cid:${cid}`, "g"))];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  test("external image is left untouched with no attachment", async () => {
    post = await Fixtures.Post({
      content: "![ext](https://example.com/x.png)",
      authorId: author.id,
    });
    await notify({ post, config: { to: "test@example.com" }, transport });
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.attachments ?? []).toHaveLength(0);
    expect(msg.html).toContain("https://example.com/x.png");
  });

  test("missing tmp file fails soft — no attachment, src untouched, no throw", async () => {
    post = await Fixtures.Post({
      content: "![missing](/image-uploads/test/missing.png)",
      authorId: author.id,
    });
    await notify({ post, config: { to: "test@example.com" }, transport });
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.attachments ?? []).toHaveLength(0);
    expect(msg.html).toContain("/image-uploads/test/missing.png");
  });

  test("custom avatar (/image-uploads/...) is inlined as CID attachment", async () => {
    await writeTmpFile("test/avatar.png", PNG_1x1);
    const authorWithAvatar = await Fixtures.User({
      picture: "/image-uploads/test/avatar.png",
    });
    post = await Fixtures.Post({
      content: "Hello world",
      authorId: authorWithAvatar.id,
    });
    await notify({ post, config: { to: "test@example.com" }, transport });
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.attachments).toHaveLength(1);
    const att = msg.attachments[0];
    expect(msg.html).toContain(`src="cid:${att.cid}"`);
    expect(msg.html).not.toContain("/image-uploads/test/avatar.png");
  });

  test("Google CDN avatar renders with bare URL, no BASE_URL prefix, no attachment", async () => {
    const googleAuthor = await Fixtures.User({
      picture: "https://lh3.googleusercontent.com/abc",
    });
    post = await Fixtures.Post({
      content: "Hello world",
      authorId: googleAuthor.id,
    });
    await notify({ post, config: { to: "test@example.com" }, transport });
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.attachments ?? []).toHaveLength(0);
    expect(msg.html).toContain('src="https://lh3.googleusercontent.com/abc"');
    expect(msg.html).not.toContain("http://localhosthttps://");
  });

  test("notifyComment with /image-uploads/ author picture inlines the avatar", async () => {
    await writeTmpFile("test/comment-avatar.png", PNG_1x1);
    const commentAuthor = await Fixtures.User({
      picture: "/image-uploads/test/comment-avatar.png",
    });
    const subscriber = await Fixtures.User();
    post = await Fixtures.Post({ authorId: author.id });
    const comment = await Fixtures.PostComment({
      authorId: commentAuthor.id,
    });
    comment.author = commentAuthor;
    await db.insert(postSubscriptions).values({ userId: subscriber.id, postId: post.id });
    await notifyComment({ post, comment, config: { to: "test@example.com" }, transport });
    expect(outbox.length).toBe(1);
    const msg = outbox[0];
    expect(msg.attachments).toHaveLength(1);
    const att = msg.attachments[0];
    expect(msg.html).toContain(`src="cid:${att.cid}"`);
    expect(msg.html).not.toContain("/image-uploads/test/comment-avatar.png");
  });
});
