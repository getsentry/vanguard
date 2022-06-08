import { error } from "./logging";
import type { PostQueryType } from "~/models/post.server";
import moment from "moment";
import { marked } from "marked";

export type SlackConfig = {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconUrl?: string;
};

export const notify = async (post: PostQueryType, config: SlackConfig) => {
  const { author, category } = post;
  console.log(`Sending Slack notification for post ${post.id}`);

  const content =
    DOMPurify.sanitize(
      marked.parse(post.content, { breaks: true }).split("</p>")[0] + "</p>",
      { ALLOWED_TAGS: [] }
    ).substring(0, 256) + "...";

  const res = await fetch(config.webhookUrl, {
    method: "POST",
    body: JSON.stringify({
      channel: config.channel || process.env.SLACK_CHANNEL,
      username: config.username || process.env.SLACK_USERNAME,
      icon_url: config.iconUrl || process.env.SLACK_ICON_URL,
      text: `A new post was published in *${category.name}*`,
      blocks: [
        {
          type: "section",
          block_id: "title",
          text: {
            type: "mrkdwn",
            text: `*${category.name}:* <https://${process.env.BASE_URL}/p/${post.id}|${post.title}>`,
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
