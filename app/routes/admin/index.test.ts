import { expectRequiresAdmin } from "~/lib/test/expects";
import { loader } from ".";

describe("/admin/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: new Request(`http://localhost/admin/`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});
