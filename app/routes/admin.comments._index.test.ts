// @ts-nocheck
import { expectRequiresAdmin } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./admin.comments._index";

describe("GET /admin/comments/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          `http://localhost/admin/comments/`,
          { method: "GET" },
          { user: DefaultFixtures.DEFAULT_USER },
        ),
        params: {},
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });
});
