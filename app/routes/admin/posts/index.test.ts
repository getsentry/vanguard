import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultTestIdentity } from "~/lib/__mocks__/iap";
import { loader } from ".";

describe("/admin/posts/", () => {
  it("requires admin", async () => {
    setDefaultTestIdentity();

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
