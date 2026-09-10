import { db } from "~/db/client";
import { slackEmojis } from "~/db/schema";
import * as Fixtures from "~/lib/test/fixtures";

import {
  getSlackEmojiStats,
  getSlackEmojiUrl,
  isKnownEmoji,
  listSlackEmojis,
  replaceSlackEmojis,
} from "./emoji.server";

describe("getSlackEmojiUrl", () => {
  it("returns the url of a custom emoji", async () => {
    const emoji = await Fixtures.SlackEmoji({ name: "shipit" });
    expect(await getSlackEmojiUrl("shipit")).toBe(emoji.url);
  });

  it("is case insensitive", async () => {
    const emoji = await Fixtures.SlackEmoji({ name: "shipit" });
    expect(await getSlackEmojiUrl("ShipIt")).toBe(emoji.url);
  });

  it("follows an alias chain", async () => {
    const target = await Fixtures.SlackEmoji({ name: "squirrel" });
    await Fixtures.SlackEmoji({ name: "shipit", aliasFor: "squirrel" });
    await Fixtures.SlackEmoji({ name: "ship-it", aliasFor: "shipit" });

    expect(await getSlackEmojiUrl("ship-it")).toBe(target.url);
  });

  it("returns null for an alias to a standard unicode name", async () => {
    await Fixtures.SlackEmoji({ name: "yes", aliasFor: "thumbsup" });
    expect(await getSlackEmojiUrl("yes")).toBe(null);
  });

  it("returns null rather than looping on a cyclic alias", async () => {
    await Fixtures.SlackEmoji({ name: "ping", aliasFor: "pong" });
    await Fixtures.SlackEmoji({ name: "pong", aliasFor: "ping" });

    expect(await getSlackEmojiUrl("ping")).toBe(null);
  });

  it("returns null for an unknown name", async () => {
    expect(await getSlackEmojiUrl("nope")).toBe(null);
  });
});

describe("listSlackEmojis", () => {
  it("returns resolvable emoji sorted by name", async () => {
    await Fixtures.SlackEmoji({ name: "zebra" });
    await Fixtures.SlackEmoji({ name: "aardvark" });
    await Fixtures.SlackEmoji({ name: "unresolvable", aliasFor: "thumbsup" });

    const emojis = await listSlackEmojis();
    expect(emojis.map((e) => e.name)).toEqual(["aardvark", "zebra"]);
  });
});

describe("isKnownEmoji", () => {
  it("accepts a unicode emoji without touching the index", async () => {
    expect(await isKnownEmoji("❤️")).toBe(true);
  });

  it("accepts a shortcode the workspace has", async () => {
    await Fixtures.SlackEmoji({ name: "shipit" });
    expect(await isKnownEmoji(":shipit:")).toBe(true);
  });

  it("rejects a shortcode the workspace does not have", async () => {
    expect(await isKnownEmoji(":nope:")).toBe(false);
  });

  it("rejects plain text", async () => {
    expect(await isKnownEmoji("hello")).toBe(false);
  });
});

describe("replaceSlackEmojis", () => {
  it("drops emoji that are no longer in the workspace", async () => {
    await Fixtures.SlackEmoji({ name: "gone" });

    await replaceSlackEmojis([
      { name: "kept", url: "https://emoji.slack-edge.com/T0/kept/a.png", aliasFor: null },
    ]);

    const rows = await db.select().from(slackEmojis);
    expect(rows.map((r) => r.name)).toEqual(["kept"]);
  });

  it("invalidates the cached index", async () => {
    await Fixtures.SlackEmoji({ name: "before" });
    expect(await getSlackEmojiUrl("before")).not.toBe(null);

    await replaceSlackEmojis([
      { name: "after", url: "https://emoji.slack-edge.com/T0/after/a.png", aliasFor: null },
    ]);

    expect(await getSlackEmojiUrl("before")).toBe(null);
    expect(await getSlackEmojiUrl("after")).not.toBe(null);
  });
});

describe("getSlackEmojiStats", () => {
  it("counts every mirrored row", async () => {
    await Fixtures.SlackEmoji();
    await Fixtures.SlackEmoji();

    const stats = await getSlackEmojiStats();
    expect(stats.total).toBe(2);
    expect(stats.lastSyncedAt).toBeTruthy();
  });

  it("reports an empty mirror", async () => {
    expect(await getSlackEmojiStats()).toEqual({ total: 0, lastSyncedAt: null });
  });
});
