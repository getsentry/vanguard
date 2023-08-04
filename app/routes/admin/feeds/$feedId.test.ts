import { expectRequiresAdmin } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";

import { action, loader } from "./$feedId";

describe("GET /admin/feeds/$feedId", () => {
  it("requires admin", async () => {
    const feed = await Fixtures.Feed();

    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          `http://localhost/admin/feeds/${feed.id}`,
          {
            method: "GET",
          },
          { user: DefaultFixtures.DEFAULT_USER },
        ),
        params: { feedId: feed.id },
        context: {},
      }),
    );
  });
});

describe("POST /admin/feeds/$feedId", () => {
  it("requires admin", async () => {
    const feed = await Fixtures.Feed();

    await expectRequiresAdmin(
      action({
        request: await buildRequest(
          `http://localhost/admin/feeds/${feed.id}`,
          {
            method: "POST",
          },
          { user: DefaultFixtures.DEFAULT_USER },
        ),
        params: { feedId: feed.id },
        context: {},
      }),
    );
  });
});
