// @ts-nocheck
import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";

import { loader } from "./api.emoji";

describe("GET /api/emoji", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: await buildRequest("http://localhost/api/emoji", { method: "GET" }),
        params: {},
        context: {},
      }),
    );
  });

  it("lists the workspace's custom emoji", async () => {
    const emoji = await Fixtures.SlackEmoji({ name: "shipit" });

    const response: Response = await loader({
      request: await buildRequest(
        "http://localhost/api/emoji",
        { method: "GET" },
        { user: DefaultFixtures.DEFAULT_USER },
      ),
      params: {},
      context: { user: DefaultFixtures.DEFAULT_USER },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.emojis).toEqual([{ name: "shipit", url: emoji.url }]);
  });
});
