// @ts-nocheck
import { expectRequiresAdmin } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";

import { action, loader } from "./admin.emoji";

describe("GET /admin/emoji", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          "http://localhost/admin/emoji",
          { method: "GET" },
          { user: DefaultFixtures.DEFAULT_USER },
        ),
        params: {},
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });
});

describe("POST /admin/emoji", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      action({
        request: await buildRequest(
          "http://localhost/admin/emoji",
          { method: "POST" },
          { user: DefaultFixtures.DEFAULT_USER },
        ),
        params: {},
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });
});
