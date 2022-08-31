import { expectRequiresAdmin } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";

import { loader, action } from "./new";

describe("GET /admin/categories/new", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          `http://localhost/admin/categories/new`,
          {
            method: "GET",
          },
          { user: DefaultFixtures.DEFAULT_USER }
        ),
        params: {},
        context: {},
      })
    );
  });
});

describe("POST /admin/categories/new", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      action({
        request: await buildRequest(
          `http://localhost/admin/categories/new`,
          {
            method: "POST",
          },
          { user: DefaultFixtures.DEFAULT_USER }
        ),
        params: {},
        context: {},
      })
    );
  });
});
