import { expectRequiresAdmin } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from ".";

describe("GET /admin/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          `http://localhost/admin/`,
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
