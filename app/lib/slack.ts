import { error } from "./logging";
import type { PostQueryType } from "~/models/post.server";

export type SlackConfig = {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconUrl?: string;
};

export const notify = async (post: PostQueryType, config: SlackConfig) => {
  const { author, category } = post;
  console.log(`Sending Slack notification for post ${post.id}`);
  const res = await fetch(config.webhookUrl, {
    method: "POST",
    body: JSON.stringify({
      channel: config.channel || process.env.SLACK_CHANNEL,
      username: config.username || process.env.SLACK_USERNAME,
      icon_url: config.iconUrl || process.env.SLACK_ICON_URL,
      text: `A new post was published in *${category.name}*`,
      attachments: [
        {
          text: `<https://${process.env.BASE_URL}/p/${post.id}|${post.title}> by ${author.name}`,
          fallback: `[${category.name}] ${post.title} - https://${process.env.BASE_URL}/p/${post.id}`,
          color: category.colorHex,
        },
      ],
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (res.status !== 200) {
    const data = await res.json();
    error("slack webhook failed", {
      context: { webhook: data },
      tags: { statusCode: res.status },
    });
  }
};
