import { expectRequiresAdmin } from "~/lib/test/expects";
import { loader } from ".";

describe("/admin/posts/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: new Request(`http://localhost/admin/posts/`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});
