import { expectRequiresAdmin } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./admin.comments._index";

describe("GET /admin/comments/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: await buildRequest(`http://localhost/admin/comments/`, {
          method: "GET",
        }),
        params: {},
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });
});
