import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultIdentity } from "~/lib/__mocks__/iap";
import { loader } from ".";

describe("/admin/", () => {
  it("requires admin", async () => {
    setDefaultIdentity();

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
