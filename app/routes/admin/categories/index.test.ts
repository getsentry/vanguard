import { expectRequiresAdmin } from "~/lib/test/expects";
import { loader } from ".";

describe("/admin/categories/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: new Request(`http://localhost/admin/categories/`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});
