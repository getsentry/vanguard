import { error } from "./logging";
import type { SlackEmojiEntry } from "~/models/emoji.server";
import { replaceSlackEmojis } from "~/models/emoji.server";

const SLACK_EMOJI_LIST_URL = "https://slack.com/api/emoji.list";

const ALIAS_PREFIX = "alias:";

// Mirrors the `name` column width and Slack's own naming rules. Anything else
// is dropped rather than truncated, because a truncated name would resolve to
// the wrong image.
const VALID_NAME = /^[a-z0-9_+'-]{1,100}$/i;

/** Slack emoji sync needs a bot token with the `emoji:read` scope. */
export function hasSlackEmojiSupport(): boolean {
  return !!process.env.SLACK_API_TOKEN;
}

type EmojiListResponse = {
  ok: boolean;
  error?: string;
  emoji?: Record<string, string>;
};

/** Raw `emoji.list` payload: name → image URL, or `alias:<other name>`. */
export async function fetchSlackEmojiList(): Promise<Record<string, string>> {
  const token = process.env.SLACK_API_TOKEN;
  if (!token) throw new Error("SLACK_API_TOKEN is not configured");

  const res = await fetch(SLACK_EMOJI_LIST_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`slack emoji.list returned HTTP ${res.status}`);
  }

  const body = (await res.json()) as EmojiListResponse;
  if (!body.ok) {
    throw new Error(`slack emoji.list failed: ${body.error ?? "unknown error"}`);
  }

  return body.emoji ?? {};
}

export function toEmojiEntries(list: Record<string, string>): SlackEmojiEntry[] {
  const entries: SlackEmojiEntry[] = [];

  Object.entries(list).forEach(([rawName, value]) => {
    const name = rawName.toLowerCase();
    if (!VALID_NAME.test(name)) {
      console.warn(`[slack-emoji] skipping unusable emoji name "${rawName}"`);
      return;
    }

    if (value.startsWith(ALIAS_PREFIX)) {
      const aliasFor = value.slice(ALIAS_PREFIX.length).toLowerCase();
      if (!VALID_NAME.test(aliasFor)) return;
      entries.push({ name, url: null, aliasFor });
      return;
    }

    entries.push({ name, url: value, aliasFor: null });
  });

  return entries;
}

/** Pull the workspace's emoji and replace the local mirror. */
export async function syncSlackEmojis(): Promise<{ total: number }> {
  const list = await fetchSlackEmojiList();
  const entries = toEmojiEntries(list);
  const result = await replaceSlackEmojis(entries);
  console.log(`[slack-emoji] synced ${result.total} emoji`);
  return result;
}

/** Sync without letting a Slack outage surface as a 500. */
export async function trySyncSlackEmojis(): Promise<{ total: number } | null> {
  try {
    return await syncSlackEmojis();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[slack-emoji] sync failed: ${message}`);
    error(err instanceof Error ? err : new Error(message), {
      context: { source: "slack-emoji.sync" },
      tags: {},
    });
    return null;
  }
}
