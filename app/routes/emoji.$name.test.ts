// @ts-nocheck
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";

import { loader } from "./emoji.$name";

describe("GET /emoji/$name", () => {
  it("redirects to the Slack CDN", async () => {
    const emoji = await Fixtures.SlackEmoji({ name: "shipit" });

    const response: Response = await loader({
      request: await buildRequest("http://localhost/emoji/shipit", { method: "GET" }),
      params: { name: "shipit" },
      context: {},
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(emoji.url);
  });

  it("resolves an alias", async () => {
    const target = await Fixtures.SlackEmoji({ name: "squirrel" });
    await Fixtures.SlackEmoji({ name: "shipit", aliasFor: "squirrel" });

    const response: Response = await loader({
      request: await buildRequest("http://localhost/emoji/shipit", { method: "GET" }),
      params: { name: "shipit" },
      context: {},
    });

    expect(response.headers.get("location")).toBe(target.url);
  });

  it("404s an unknown emoji so the renderer can fall back to text", async () => {
    const response: Response = await loader({
      request: await buildRequest("http://localhost/emoji/nope", { method: "GET" }),
      params: { name: "nope" },
      context: {},
    });

    expect(response.status).toBe(404);
  });

  it("serves without a session so email and feeds can embed it", async () => {
    await Fixtures.SlackEmoji({ name: "shipit" });

    const response: Response = await loader({
      request: await buildRequest("http://localhost/emoji/shipit", { method: "GET" }),
      params: { name: "shipit" },
      context: {},
    });

    expect(response.status).toBe(302);
  });
});
