import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultIdentity } from "~/lib/__mocks__/iap";
import { loader } from ".";

describe("/admin/categories/", () => {
  it("requires admin", async () => {
    setDefaultIdentity();

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
