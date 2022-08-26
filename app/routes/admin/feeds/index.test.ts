import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultTestIdentity } from "~/lib/__mocks__/iap";
import { loader } from ".";

describe("/admin/feeds/", () => {
  it("requires admin", async () => {
    setDefaultTestIdentity();

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
