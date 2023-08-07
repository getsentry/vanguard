import { expectRequiresAdmin } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from ".";

describe("GET /admin/feeds/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          `http://localhost/admin/feeds/`,
          {
            method: "GET",
          },
          { user: DefaultFixtures.DEFAULT_USER },
        ),
        params: {},
        context: {},
      }),
    );
  });
});
