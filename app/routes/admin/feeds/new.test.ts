import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultTestIdentity } from "~/lib/__mocks__/iap";

import { action, loader } from "./new";

describe("GET /admin/feeds/$feedId", () => {
  it("requires admin", async () => {
    setDefaultTestIdentity();

    await expectRequiresAdmin(
      loader({
        request: new Request(`http://localhost/admin/feeds/new`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});

describe("POST /admin/feeds/$feedId", () => {
  it("requires admin", async () => {
    setDefaultTestIdentity();

    await expectRequiresAdmin(
      action({
        request: new Request(`http://localhost/admin/feeds/new`, {
          method: "POST",
        }),
        params: {},
        context: {},
      })
    );
  });
});
