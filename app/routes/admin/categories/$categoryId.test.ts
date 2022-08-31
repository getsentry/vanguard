import { expectRequiresAdmin } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";

import { action, loader } from "./$categoryId";

describe("GET /admin/categories/$categoryId", () => {
  it("requires admin", async () => {
    const category = await Fixtures.Category();

    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          `http://localhost/admin/categories/${category.id}`,
          {
            method: "GET",
          },
          { user: DefaultFixtures.DEFAULT_USER }
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

    await expectRequiresAdmin(
      action({
        request: await buildRequest(
          `http://localhost/admin/categories/${category.id}`,
          {
            method: "POST",
          },
          { user: DefaultFixtures.DEFAULT_USER }
        ),
        params: { categoryId: category.id },
        context: {},
      })
    );
  });
});
