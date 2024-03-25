import { expectRequiresAdmin } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./admin.posts._index";

describe("GET /admin/posts/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: await buildRequest(`http://localhost/admin/posts/`, {
          method: "GET",
        }),
        params: {},
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });
});
