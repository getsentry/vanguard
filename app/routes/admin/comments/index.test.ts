import { expectRequiresAdmin } from "~/lib/test/expects";
import { loader } from ".";

describe("/admin/comments/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: new Request(`http://localhost/admin/comments/`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});
