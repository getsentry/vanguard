import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultTestIdentity } from "~/lib/__mocks__/iap";
import * as Fixtures from "~/lib/test/fixtures";

import { loader, action } from "./new";

describe("GET /admin/categories/new", () => {
  it("requires admin", async () => {
    const category = Fixtures.Category();
    setDefaultTestIdentity();

    await expectRequiresAdmin(
      loader({
        request: new Request(`http://localhost/admin/categories/new`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});

describe("POST /admin/categories/new", () => {
  it("requires admin", async () => {
    const category = Fixtures.Category();
    setDefaultTestIdentity();

    await expectRequiresAdmin(
      action({
        request: new Request(`http://localhost/admin/categories/new`, {
          method: "POST",
        }),
        params: {},
        context: {},
      })
    );
  });
});
