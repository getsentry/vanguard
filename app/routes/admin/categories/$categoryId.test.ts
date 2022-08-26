import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultTestIdentity } from "~/lib/__mocks__/iap";
import * as Fixtures from "~/lib/test/fixtures";

import { action, loader } from "./$categoryId";

describe("GET /admin/categories/$categoryId", () => {
  it("requires admin", async () => {
    const category = await Fixtures.Category();
    setDefaultTestIdentity();

    await expectRequiresAdmin(
      loader({
        request: new Request(
          `http://localhost/admin/categories/${category.id}`,
          {
            method: "GET",
          }
        ),
        params: { categoryId: category.id },
        context: {},
      })
    );
  });
});

describe("POST /admin/categories/$categoryId", () => {
  it("requires admin", async () => {
    const category = await Fixtures.Category();
    setDefaultTestIdentity();

    await expectRequiresAdmin(
      action({
        request: new Request(
          `http://localhost/admin/categories/${category.id}`,
          {
            method: "POST",
          }
        ),
        params: { categoryId: category.id },
        context: {},
      })
    );
  });
});
