import { expectRequiresAdmin } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";

import { action, loader } from "./admin.feeds.new";

describe("GET /admin/feeds/$feedId", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: await buildRequest(`http://localhost/admin/feeds/new`, {
          method: "GET",
        }),
        params: {},
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });
});

describe("POST /admin/feeds/$feedId", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      action({
        request: await buildRequest(`http://localhost/admin/feeds/new`, {
          method: "POST",
        }),
        params: {},
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });
});
