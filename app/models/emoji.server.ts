import { sql } from "drizzle-orm";

import { db } from "~/db/client";
import { slackEmojis } from "~/db/schema";
import { isEmoji, shortcodeName } from "~/lib/emoji";

export type SlackEmoji = typeof slackEmojis.$inferSelect;

export type SlackEmojiEntry = {
  name: string;
  url: string | null;
  aliasFor: string | null;
};

/** A custom emoji with its alias chain already followed to a real image. */
export type ResolvedEmoji = {
  name: string;
  url: string;
};

// Slack aliases can chain (`a -> b -> c`). The cap stops a cycle from hanging
// the request; Slack itself never nests more than a couple of levels.
const MAX_ALIAS_DEPTH = 10;

// The index is read on nearly every rendered emoji but only changes when an
// admin syncs, so it is worth holding in memory. Each serverless instance
// keeps its own copy and lets it lapse after the TTL.
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache: { loadedAt: number; urlByName: Map<string, string> } | null = null;

export function clearEmojiCache() {
  cache = null;
}

function resolveUrl(row: SlackEmojiEntry, byName: Map<string, SlackEmojiEntry>): string | null {
  let current: SlackEmojiEntry | undefined = row;
  for (let depth = 0; depth < MAX_ALIAS_DEPTH; depth++) {
    if (!current) return null;
    if (current.url) return current.url;
    if (!current.aliasFor) return null;
    current = byName.get(current.aliasFor);
  }
  return null;
}

async function getEmojiIndex(): Promise<Map<string, string>> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.urlByName;

  const rows = await db.select().from(slackEmojis);
  const byName = new Map(rows.map((row) => [row.name, row]));

  const urlByName = new Map<string, string>();
  rows.forEach((row) => {
    const url = resolveUrl(row, byName);
    // An alias pointing at a standard unicode name (`:thumbsup:`) has nothing
    // to resolve to here, so it stays out of the index and renders as text.
    if (url) urlByName.set(row.name, url);
  });

  cache = { loadedAt: Date.now(), urlByName };
  return urlByName;
}

/** The image URL for a custom emoji name, or `null` if the workspace has none. */
export async function getSlackEmojiUrl(name: string): Promise<string | null> {
  const index = await getEmojiIndex();
  return index.get(name.toLowerCase()) ?? null;
}

/** Every custom emoji that resolves to an image, for the picker and typeahead. */
export async function listSlackEmojis(): Promise<ResolvedEmoji[]> {
  const index = await getEmojiIndex();
  return [...index.entries()]
    .map(([name, url]) => ({ name, url }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The names that resolve to an image. Renderers that cannot recover from a
 * broken `<img>` (email, RSS) filter against this before emitting one.
 */
export async function getKnownEmojiNames(): Promise<Set<string>> {
  return new Set((await getEmojiIndex()).keys());
}

/**
 * True for anything a user may store as a reaction: a unicode emoji, or a
 * shortcode this workspace actually has. Rejecting unknown shortcodes keeps
 * reaction rows from accumulating names that render as raw text forever.
 */
export async function isKnownEmoji(value: string): Promise<boolean> {
  if (isEmoji(value)) return true;
  const name = shortcodeName(value);
  if (!name) return false;
  return (await getSlackEmojiUrl(name)) !== null;
}

export async function getSlackEmojiStats(): Promise<{
  total: number;
  lastSyncedAt: Date | null;
}> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      lastSyncedAt: sql<Date | null>`max(${slackEmojis.updatedAt})`,
    })
    .from(slackEmojis);
  return { total: row?.total ?? 0, lastSyncedAt: row?.lastSyncedAt ?? null };
}

// Postgres caps a statement at 65535 bind parameters. Three columns per row
// leaves plenty of headroom at 1000 rows per insert.
const INSERT_CHUNK_SIZE = 1000;

/**
 * Replace the mirror wholesale. Slack's `emoji.list` is the complete set, so a
 * delete-then-insert inside one transaction is both simpler and more correct
 * than diffing, because it drops emoji the workspace has deleted.
 */
export async function replaceSlackEmojis(entries: SlackEmojiEntry[]): Promise<{ total: number }> {
  await db.transaction(async (tx) => {
    await tx.delete(slackEmojis);
    for (let i = 0; i < entries.length; i += INSERT_CHUNK_SIZE) {
      await tx.insert(slackEmojis).values(entries.slice(i, i + INSERT_CHUNK_SIZE));
    }
  });
  clearEmojiCache();
  return { total: entries.length };
}
