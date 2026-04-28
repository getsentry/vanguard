import invariant from "tiny-invariant";
import { and, eq, inArray, or, sql } from "drizzle-orm";

import * as email from "../lib/email";
import * as slack from "../lib/slack";
import { db } from "~/db/client";
import {
  categories,
  categoryEmails,
  categorySlacks,
  feedToPost,
  feeds,
  postMetas,
  postRevisions,
  postSubscriptions,
  posts,
  users,
} from "~/db/schema";
import type { PublicCurrentUser } from "~/models/user.server";
import { PUBLIC_USER_COLUMNS } from "~/models/user.server";
import { error } from "~/lib/logging";
import { waitUntil } from "~/lib/wait-until";

export type Post = typeof posts.$inferSelect;
export type PostMeta = typeof postMetas.$inferSelect;
export type PostRevision = typeof postRevisions.$inferSelect;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Feed = typeof feeds.$inferSelect;

/** Public feed shape — excludes webhookUrl which is server-only. */
export type PublicFeed = Omit<Feed, "webhookUrl">;

/** Public author shape embedded in loader-facing post/feed responses. */
export type PostAuthor = Pick<User, "id" | "email" | "name" | "picture">;

export interface PostQueryType extends Post {
  author: PostAuthor;
  category: Category;
  meta: PostMeta[];
  feeds: PublicFeed[];
}

const PUBLIC_FEED_COLUMNS = {
  id: true,
  name: true,
  restricted: true,
  deleted: true,
  url: true,
} as const;

export function announcePost(post: PostQueryType): void {
  // Verbose logging while we debug a production miss where notifications
  // didn't fan out. Every line is prefixed `[announcePost]` so it's easy to
  // grep in `vercel logs --since=…`. Remove once root-caused.
  console.log(
    `[announcePost] entry — post=${post.id} category=${post.categoryId} VERCEL_ENV=${process.env.VERCEL_ENV ?? "<unset>"} BASE_URL=${process.env.BASE_URL ?? "<unset>"} SMTP_FROM=${process.env.SMTP_FROM ? "set" : "<unset>"} SLACK_WEBHOOK_URL=${process.env.SLACK_WEBHOOK_URL ? "set" : "<unset>"}`,
  );

  // On Vercel, fan-out notifications fire ONLY in production. Preview /
  // development deployments could be pointed at a Neon branch with real
  // per-category webhook + email rows (especially after Todo 14's data
  // cutover), and we don't want test posts spamming real Slack channels or
  // mailing real recipients. Local dev (VERCEL_ENV unset) is unaffected —
  // the absence of SMTP / Slack creds in `.env` already gates that path.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    console.log(
      `[announcePost] skipping notifications for post ${post.id} — VERCEL_ENV=${process.env.VERCEL_ENV}`,
    );
    return;
  }

  console.log(`[announcePost] gate passed — scheduling waitUntil for post ${post.id}`);

  waitUntil(
    (async () => {
      console.log(`[announcePost] waitUntil started — post ${post.id}`);
      try {
        const emailConfig = await db.query.categoryEmails.findMany({
          where: eq(categoryEmails.categoryId, post.categoryId),
        });
        console.log(
          `[announcePost] categoryEmails lookup — post=${post.id} category=${post.categoryId} count=${emailConfig.length}`,
        );
        await Promise.all(
          emailConfig.map((config) => email.notify({ post, config: config as email.EmailConfig })),
        );

        let slackConfig: slack.SlackConfig[] = await db.query.categorySlacks.findMany({
          where: eq(categorySlacks.categoryId, post.categoryId),
        });
        console.log(
          `[announcePost] categorySlacks lookup — post=${post.id} category=${post.categoryId} count=${slackConfig.length}`,
        );
        if (!slackConfig.length && process.env.SLACK_WEBHOOK_URL) {
          console.log(
            `[announcePost] no per-category Slack rows — falling back to SLACK_WEBHOOK_URL env var`,
          );
          slackConfig = [{ webhookUrl: process.env.SLACK_WEBHOOK_URL }];
        } else if (!slackConfig.length) {
          console.log(
            `[announcePost] no per-category Slack rows AND no SLACK_WEBHOOK_URL — Slack fanout will be a no-op`,
          );
        }
        await Promise.all(
          slackConfig.map((config) => slack.notify({ post, config: config as slack.SlackConfig })),
        );
        console.log(`[announcePost] waitUntil finished — post ${post.id}`);
      } catch (err) {
        // Don't log `err` directly: Undici's URL-parse errors include the full
        // input URL in the message (e.g. `Failed to parse URL from
        // https://hooks.slack.com/services/T.../B.../...`), and dumping the raw
        // error object would leak the Slack webhook secret into Vercel logs.
        // Scrub anything URL-shaped before logging.
        const message = err instanceof Error ? err.message : String(err);
        const safeMessage = message.replace(/https?:\/\/\S+/g, "<redacted-url>");
        const name = err instanceof Error ? err.name : "unknown";
        console.error(`[announcePost] waitUntil threw — post ${post.id} — ${name}: ${safeMessage}`);
        throw err;
      }
    })(),
  );
}

export async function syndicatePost(post: PostQueryType): Promise<void> {
  if (!post.feeds.length) return;
  const feedIds = post.feeds.map((f) => f.id);
  const feedsWithWebhooks = await db
    .select({ id: feeds.id, webhookUrl: feeds.webhookUrl })
    .from(feeds)
    .where(inArray(feeds.id, feedIds));

  for (const feed of feedsWithWebhooks) {
    if (!feed.webhookUrl) continue;
    const res = await fetch(feed.webhookUrl, { method: "POST" });
    if (res.status !== 200) {
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = res.body;
      }
      error("feed webhook failed", {
        context: { webhook: data },
        tags: { statusCode: res.status },
      });
    }
  }
}

export async function getPost({
  id,
  user,
  onlyPublished = false,
}: Pick<Post, "id"> & {
  user: PublicCurrentUser;
  onlyPublished?: boolean;
}): Promise<PostQueryType | null> {
  let whereCondition;
  if (onlyPublished) {
    if (user.admin) {
      whereCondition = eq(posts.id, id);
    } else {
      whereCondition = and(
        eq(posts.id, id),
        or(
          and(eq(posts.authorId, user.id), eq(posts.deleted, false)),
          and(eq(posts.published, true), eq(posts.deleted, false)),
        ),
      );
    }
  } else {
    if (user.admin) {
      whereCondition = eq(posts.id, id);
    } else {
      whereCondition = and(eq(posts.id, id), eq(posts.deleted, false));
    }
  }

  const result = await db.query.posts.findFirst({
    where: whereCondition,
    with: {
      author: { columns: PUBLIC_USER_COLUMNS },
      category: true,
      meta: true,
      feedToPost: {
        with: { feed: { columns: PUBLIC_FEED_COLUMNS } },
      },
    },
  });

  if (!result) return null;
  return {
    ...result,
    feeds: result.feedToPost.map((ftp: any) => ftp.feed),
  } as PostQueryType;
}

export async function getPostList({
  user,
  published,
  authorId,
  categoryId,
  categoryIds,
  feedId,
  query,
  offset = 0,
  limit = 50,
}: {
  user?: PublicCurrentUser | null;
  published?: boolean | null;
  authorId?: User["id"];
  categoryId?: Category["id"];
  categoryIds?: Category["id"][];
  feedId?: Feed["id"];
  query?: string;
  offset?: number;
  limit?: number;
}): Promise<PostQueryType[]> {
  if (!user && !feedId) {
    throw new Error("Cannot query posts without either user or feedId");
  }

  const conditions = [eq(posts.deleted, false)];

  if (published !== undefined && published !== null) {
    conditions.push(eq(posts.published, published));
  }

  if (published !== true && !user?.admin) {
    conditions.push(eq(posts.authorId, user!.id));
  }

  if (authorId) {
    conditions.push(eq(posts.authorId, authorId));
  }

  if (categoryId) {
    conditions.push(eq(posts.categoryId, categoryId));
  } else if (categoryIds && categoryIds.length > 0) {
    conditions.push(inArray(posts.categoryId, categoryIds));
  }

  if (feedId) {
    // Filter posts that belong to this feed via the junction table
    const postIdsInFeed = db
      .select({ postId: feedToPost.B })
      .from(feedToPost)
      .where(eq(feedToPost.A, feedId));
    conditions.push(inArray(posts.id, postIdsInFeed));
  }

  if (query !== undefined && query !== "") {
    conditions.push(
      sql`(
        to_tsvector('english', ${posts.title}) @@ plainto_tsquery('english', ${query})
        OR to_tsvector('english', coalesce(${posts.content}, '')) @@ plainto_tsquery('english', ${query})
      )`,
    );
  }

  const results = await db.query.posts.findMany({
    where: and(...conditions),
    with: {
      author: { columns: PUBLIC_USER_COLUMNS },
      category: true,
      meta: true,
      feedToPost: {
        with: { feed: { columns: PUBLIC_FEED_COLUMNS } },
      },
    },
    limit,
    offset,
    orderBy: (p, { desc }) => desc(p.publishedAt),
  });

  return results.map((r) => ({
    ...r,
    feeds: r.feedToPost.map((ftp: any) => ftp.feed),
  })) as PostQueryType[];
}

export async function updatePost({
  id,
  user,
  title,
  content,
  categoryId,
  feedIds,
  published,
  deleted,
  meta = [],
}: {
  id: Post["id"];
  user: PublicCurrentUser;
  title?: Post["title"];
  content?: Post["content"];
  categoryId?: Post["categoryId"];
  feedIds?: Feed["id"][];
  published?: Post["published"];
  deleted?: Post["deleted"];
  meta?: Pick<PostMeta, "name" | "content">[];
}): Promise<PostQueryType> {
  const whereCondition = user.admin
    ? eq(posts.id, id)
    : and(eq(posts.id, id), eq(posts.authorId, user.id), eq(posts.deleted, false));

  const post = await db.query.posts.findFirst({ where: whereCondition });
  invariant(post, "post not found");

  const data: Partial<Post> = {};
  if (published !== undefined && published !== post.published) data.published = !!published;
  if (title !== undefined && title !== post.title) data.title = title;
  if (content !== undefined && content !== post.content) data.content = content;
  if (categoryId !== undefined && categoryId !== post.categoryId) data.categoryId = categoryId;
  if (data.published && !post.publishedAt) data.publishedAt = new Date();

  if (user.admin || deleted !== undefined) {
    if (deleted !== undefined && post.deleted !== deleted) data.deleted = !!deleted;
  }

  const updatedPost = await db.transaction(async (tx) => {
    // Update post fields if any changed
    let result = post;
    if (Object.keys(data).length > 0) {
      const [updated] = await tx
        .update(posts)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(posts.id, id))
        .returning();
      result = updated;
    }

    // Always create a revision
    await tx.insert(postRevisions).values({
      postId: id,
      authorId: user.id,
      title: data.title ?? post.title,
      content: data.content ?? post.content,
      categoryId: data.categoryId ?? post.categoryId,
    });

    // Update feeds M:M via junction table
    if (feedIds !== undefined) {
      await tx.delete(feedToPost).where(eq(feedToPost.B, id));
      if (feedIds.length > 0) {
        await tx.insert(feedToPost).values(feedIds.map((feedId) => ({ A: feedId, B: id })));
      }
    }

    // Replace meta
    if (meta !== undefined) {
      await tx.delete(postMetas).where(eq(postMetas.postId, id));
      if (meta.length > 0) {
        await tx
          .insert(postMetas)
          .values(meta.map((m) => ({ postId: id, name: m.name, content: m.content })));
      }
    }

    return result.id;
  });

  const fullPost = await db.query.posts.findFirst({
    where: eq(posts.id, updatedPost),
    with: {
      author: { columns: PUBLIC_USER_COLUMNS },
      category: true,
      meta: true,
      feedToPost: { with: { feed: { columns: PUBLIC_FEED_COLUMNS } } },
    },
  });
  return {
    ...fullPost!,
    feeds: fullPost!.feedToPost.map((ftp: any) => ftp.feed),
  } as PostQueryType;
}

export async function createPost({
  userId,
  content,
  title,
  categoryId,
  feedIds,
  published = false,
  meta = [],
}: Pick<Post, "content" | "title"> & {
  userId: PublicCurrentUser["id"];
  published?: Post["published"];
  feedIds?: Feed["id"][];
  categoryId: Category["id"];
  meta?: Pick<PostMeta, "name" | "content">[];
}): Promise<PostQueryType> {
  const post = await db.transaction(async (tx) => {
    const [post] = await tx
      .insert(posts)
      .values({
        title,
        content,
        published,
        publishedAt: published ? new Date() : null,
        authorId: userId,
        categoryId,
      })
      .returning();

    await tx.insert(postRevisions).values({
      postId: post.id,
      authorId: userId,
      title,
      content,
      categoryId,
    });

    if (feedIds && feedIds.length > 0) {
      await tx.insert(feedToPost).values(feedIds.map((feedId) => ({ A: feedId, B: post.id })));
    }

    await tx.insert(postSubscriptions).values({
      postId: post.id,
      userId,
    });

    if (meta.length > 0) {
      await tx.insert(postMetas).values(
        meta.map((m) => ({
          postId: post.id,
          name: m.name,
          content: m.content,
        })),
      );
    }

    return post.id;
  });
  const fullPost = await db.query.posts.findFirst({
    where: eq(posts.id, post),
    with: {
      author: { columns: PUBLIC_USER_COLUMNS },
      category: true,
      meta: true,
      feedToPost: { with: { feed: { columns: PUBLIC_FEED_COLUMNS } } },
    },
  });
  return {
    ...fullPost,
    feeds: fullPost!.feedToPost.map((ftp: any) => ftp.feed),
  } as PostQueryType;
}

export async function deletePost({ id, user }: Pick<Post, "id"> & { user: PublicCurrentUser }) {
  updatePost({
    id,
    user,
    deleted: true,
  });
}
