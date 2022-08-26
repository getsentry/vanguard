import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultTestIdentity } from "~/lib/__mocks__/iap";
import * as Fixtures from "~/lib/test/fixtures";

import { action, loader } from "./$feedId";

describe("GET /admin/feeds/$feedId", () => {
  it("requires admin", async () => {
    const feed = await Fixtures.Feed();
    setDefaultTestIdentity();

    await expectRequiresAdmin(
      loader({
        request: new Request(`http://localhost/admin/feeds/${feed.id}`, {
          method: "GET",
        }),
        params: { feedId: feed.id },
        context: {},
      })
    );
  });
});

describe("POST /admin/feeds/$feedId", () => {
  it("requires admin", async () => {
    const feed = await Fixtures.Feed();
    setDefaultTestIdentity();

    await expectRequiresAdmin(
      action({
        request: new Request(`http://localhost/admin/feeds/${feed.id}`, {
          method: "POST",
        }),
        params: { feedId: feed.id },
        context: {},
      })
    );
  });
});
