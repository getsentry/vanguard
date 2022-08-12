import { createTransport, Transporter } from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { notify } from "./email";

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
        outbox.push(mail.data);
      });
    },
  };

  return {
    transport: createTransport(testTransport),
    outbox: outbox,
  };
};

describe("notify", () => {
  const post = {
    id: "cl6po7ehs82560ks6yffffben",
    createdAt: new Date(),
    publishedAt: new Date(),
    updatedAt: new Date(),
    title: "An Essay",
    content: "**An Essay** on _life_",
    published: true,
    deleted: false,
    authorId: "cl6pgiylv20600ks6b2937yfu",
    author: {
      id: "cl6pgiylv20600ks6b2937yfu",
      name: "Jane Doe",
      email: "jane@example.com",
      admin: false,
      externalId: "jane.doe",
      picture: null,
      canPostRestricted: false,
    },
    categoryId: "cl6pem4fj293610ks6w9sb8ea4",
    category: {
      id: "cl6pem4fj293610ks6w9sb8ea4",
      name: "Shipped",
      slug: "shipped",
      deleted: false,
      restricted: false,
      colorHex: "#000000",
    },
  };

  let transport: Transporter<SMTPTransport.SentMessageInfo>;
  let outbox: Mail.Options[];

  beforeEach(() => {
    process.env.BASE_URL = "http://localhost";
    process.env.SMTP_FROM = "vanguard@example.com";

    const harness = createEmailTestHarness();
    transport = harness.transport;
    outbox = harness.outbox;
  });

  test("adds author to cc", async () => {
    await notify(post, mailConfig, transport);
    expect(outbox.length).toBe(1);
    const message = outbox[0];
    expect(message.cc.length).toBe(1);
    expect(message.cc[0]).toBe('"Jane Doe" <jane@example.com>');
  });
});
