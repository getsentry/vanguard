import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultTestIdentity } from "~/lib/__mocks__/iap";
import { loader } from ".";

describe("/admin/comments/", () => {
  it("requires admin", async () => {
    setDefaultTestIdentity();

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
