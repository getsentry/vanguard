import { error } from "./logging";
import type { PostQueryType } from "~/models/post.server";
import moment from "moment";
import { marked } from "marked";
import { sanitize } from "isomorphic-dompurify";
import { App, ExpressReceiver } from "@slack/bolt";
import { createHmac } from "crypto";
import { deleteConfig, getConfig, setConfig } from "~/models/config.server";

export type SlackConfig = {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconUrl?: string;
};

const buildApp = () => {
  const receiver = new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET || "",
    endpoints: "/",
  });

  const app = new App({
    receiver,
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    clientId: process.env.SLACK_CLIENT_ID,
    clientSecret: process.env.SLACK_CLIENT_SECRET,
    stateSecret: createHmac("sha256", process.env.SESSION_SECRET || "insecure")
      .update("slack")
      .digest("hex"),
    scopes: ["chat:write", "commands"],
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    installationStore: {
      storeInstallation: async (installation) => {
        return await setConfig("slack.install", installation);
        // Bolt will pass your handler an installation object
        // Change the lines below so they save to your database
        // if (
        //   installation.isEnterpriseInstall &&
        //   installation.enterprise !== undefined
        // ) {
        //   // handle storing org-wide app installation
        //   return await database.set(installation.enterprise.id, installation);
        // }
        // if (installation.team !== undefined) {
        //   // single team app installation
        //   return await database.set(installation.team.id, installation);
        // }
        // throw new Error("Failed saving installation data to installationStore");
      },
      fetchInstallation: async (installQuery) => {
        const installation = await getConfig("slack.install");
        if (
          installQuery.isEnterpriseInstall &&
          installQuery.enterpriseId === installation.enterprise?.id
        ) {
          // handle org wide app installation lookup
          return installation;
        } else if (installQuery.teamId === installation.team?.id) {
          // single team app installation lookup
          return installation;
        }
        throw new Error("Failed fetching installation");
      },
      deleteInstallation: async (installQuery) => {
        const installation = await getConfig("slack.install");
        if (
          installQuery.isEnterpriseInstall &&
          installQuery.enterpriseId === installation.enterprise?.id
        ) {
          // org wide app installation deletion
          return await deleteConfig("slack.install");
        } else if (installQuery.teamId === installation.team?.id) {
          // single team app installation deletion
          return await deleteConfig("slack.install");
        }
        throw new Error("Failed to delete installation");
      },
    },
  });

  app.command("/vanguard", async ({ command, ack, respond }) => {
    // Acknowledge command request
    await ack();

    await respond(`${command.text}`);
  });

  return app;
};

export const boltApp = buildApp();

export const summarize = (content: string, maxLength = 256): string => {
  // first remove elements we wouldn't want as a summary
  const contentBlocks = sanitize(marked.parse(content, { breaks: true }), {
    ALLOWED_TAGS: ["p", "blockquote", "#text"],
    KEEP_CONTENT: false,
  });
  const sum = sanitize(contentBlocks, {
    ALLOWED_TAGS: [],
  }).replace(/^[\s\n]+|[\s\n]+$/g, "");
  if (sum.length > maxLength)
    return sum.substring(0, maxLength - 3).split("\n")[0] + "...";
  return sum;
};

export const notify = async (post: PostQueryType, config: SlackConfig) => {
  const { author, category } = post;
  console.log(`Sending Slack notification for post ${post.id}`);

  if (!process.env.BASE_URL) {
    error("BASE_URL is not configured");
    return;
  }

  const content = summarize(post.content);

  const res = await fetch(config.webhookUrl, {
    method: "POST",
    body: JSON.stringify({
      channel: config.channel || process.env.SLACK_CHANNEL,
      username: config.username || process.env.SLACK_USERNAME || "Vanguard",
      icon_url: config.iconUrl || process.env.SLACK_ICON_URL,
      text: `A new post was published in *${category.name}*`,
      blocks: [
        {
          type: "section",
          block_id: "title",
          text: {
            type: "mrkdwn",
            text: `*${category.name}:* <${process.env.BASE_URL}/p/${post.id}|${post.title}>`,
          },
        },
        {
          type: "section",
          block_id: "content",
          text: {
            type: "mrkdwn",
            text: content,
          },
        },
        {
          type: "section",
          block_id: "meta",
          fields: [
            {
              type: "mrkdwn",
              text: `*Written by*\n${author.name}`,
            },
            {
              type: "mrkdwn",
              text: `*Published*\n${moment(post.publishedAt).format("MMM Do")}`,
            },
          ],
        },
      ],
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (res.status !== 200) {
    let data: any;
    try {
      data = await res.json();
    } catch (err) {
      data = res.body;
    }
    error("slack webhook failed", {
      context: { webhook: data },
      tags: { statusCode: res.status },
    });
  }
};
