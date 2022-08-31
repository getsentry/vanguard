import { expectRequiresAdmin } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from ".";

describe("GET /admin/categories/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          `http://localhost/admin/categories/`,
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
