import { error } from "./logging";
import type { PostQueryType } from "~/models/post.server";

export type EmailConfig = {
  to: string;
};

export const notify = async (post: PostQueryType, config: EmailConfig) => {
  console.log(`Sending email notification for post ${post.id} to ${config.to}`);
};
