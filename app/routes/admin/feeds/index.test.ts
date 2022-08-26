import { expectRequiresAdmin } from "~/lib/test/expects";
import { loader } from ".";

describe("/admin/feeds/", () => {
  it("requires admin", async () => {
    await expectRequiresAdmin(
      loader({
        request: new Request(`http://localhost/admin/feeds/`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});
