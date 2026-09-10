// @ts-nocheck
import { db } from "~/db/client";
import { slackEmojis } from "~/db/schema";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";

import { loader } from "./api.cron.emoji-sync";

const SECRET = "test-cron-secret";

const request = (headers = {}) =>
  buildRequest("http://localhost/api/cron/emoji-sync", { method: "GET", headers });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("GET /api/cron/emoji-sync", () => {
  it("rejects a request with no authorization header", async () => {
    vi.stubEnv("CRON_SECRET", SECRET);

    const response: Response = await loader({
      request: await request(),
      params: {},
      context: {},
    });

    expect(response.status).toBe(401);
  });

  it("rejects the wrong secret", async () => {
    vi.stubEnv("CRON_SECRET", SECRET);

    const response: Response = await loader({
      request: await request({ Authorization: "Bearer nope" }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(401);
  });

  it("fails closed when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", "");

    const response: Response = await loader({
      request: await request({ Authorization: "Bearer " }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(401);
  });

  it("reports a missing Slack token rather than syncing", async () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    vi.stubEnv("SLACK_API_TOKEN", "");

    const response: Response = await loader({
      request: await request({ Authorization: `Bearer ${SECRET}` }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(400);
  });

  it("replaces the mirror with what Slack returns", async () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    vi.stubEnv("SLACK_API_TOKEN", "xoxb-test");
    await Fixtures.SlackEmoji({ name: "stale" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          ok: true,
          emoji: {
            shipit: "https://emoji.slack-edge.com/T0/shipit/a.png",
            "ship-it": "alias:shipit",
          },
        }),
      ),
    );

    const response: Response = await loader({
      request: await request({ Authorization: `Bearer ${SECRET}` }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ total: 2 });

    const rows = await db.select().from(slackEmojis);
    expect(rows.map((r) => r.name).sort()).toEqual(["ship-it", "shipit"]);
  });

  it("502s when Slack rejects the token", async () => {
    vi.stubEnv("CRON_SECRET", SECRET);
    vi.stubEnv("SLACK_API_TOKEN", "xoxb-test");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ ok: false, error: "invalid_auth" })),
    );

    const response: Response = await loader({
      request: await request({ Authorization: `Bearer ${SECRET}` }),
      params: {},
      context: {},
    });

    expect(response.status).toBe(502);
  });
});
