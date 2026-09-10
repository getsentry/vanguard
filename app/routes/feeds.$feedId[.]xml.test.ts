// @ts-nocheck
import { db } from "~/db/client";
import { feedToPost } from "~/db/schema";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./feeds.$feedId[.]xml";

describe("GET /feeds/$feedId.xml", () => {
  it("renders xml", async () => {
    const feed = await Fixtures.Feed();
    const response = await loader({
      request: await buildRequest(`http://localhost/feeds/${feed.id}.xml`, {
        method: "GET",
        headers: {
          host: "localhost",
        },
      }),
      params: { feedId: feed.id },
      context: {},
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/xml");
  });

  it("renders known shortcodes as absolute images and leaves unknown ones as text", async () => {
    await Fixtures.SlackEmoji({ name: "shipit" });
    const feed = await Fixtures.Feed();
    const post = await Fixtures.Post({
      content: "shipping :shipit: with :tada: energy",
    });
    await db.insert(feedToPost).values({ A: feed.id, B: post.id });

    const response = await loader({
      request: await buildRequest(`http://localhost/feeds/${feed.id}.xml`, {
        method: "GET",
        headers: { host: "localhost" },
      }),
      params: { feedId: feed.id },
      context: {},
    });

    const xml = await response.text();
    expect(xml).toContain("http://localhost/emoji/shipit");
    // Feed readers can't fall back either.
    expect(xml).toContain(":tada:");
    expect(xml).not.toContain("/emoji/tada");
  });
});
