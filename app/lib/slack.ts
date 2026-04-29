import { error } from "./logging";
import type { PostQueryType } from "~/models/post.server";
import summarize from "./summarize";
import { getDisplayName } from "./user";

import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(advancedFormat);

export type SlackConfig = {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconUrl?: string;
};

export const notify = async ({ post, config }: { post: PostQueryType; config: SlackConfig }) => {
  const { author, category } = post;
  console.log(
    `[slack.notify] start — post=${post.id} category=${category.name} webhookHost=${(() => {
      try {
        return new URL(config.webhookUrl).host;
      } catch {
        return "<invalid-url>";
      }
    })()}`,
  );

  if (!process.env.BASE_URL) {
    error("BASE_URL is not configured");
    console.error(`[slack.notify] aborting — BASE_URL is not configured (post ${post.id})`);
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
              text: `*Written by*\n${getDisplayName(author)}`,
            },
            {
              type: "mrkdwn",
              text: `*Published*\n${dayjs(post.publishedAt).format("MMM Do")}`,
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
    } catch {
      data = res.body;
    }
    console.error(
      `[slack.notify] webhook returned non-200 — post=${post.id} status=${res.status}`,
      data,
    );
    error("slack webhook failed", {
      context: { webhook: data },
      tags: { statusCode: res.status },
    });
  } else {
    console.log(`[slack.notify] success — post=${post.id} status=${res.status}`);
  }
};
