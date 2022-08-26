import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultIdentity } from "~/lib/__mocks__/iap";
import { loader } from ".";

describe("/admin/posts/", () => {
  it("requires admin", async () => {
    setDefaultIdentity();

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
