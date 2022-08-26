import { expectRequiresAdmin } from "~/lib/test/expects";
import { setDefaultTestIdentity } from "~/lib/__mocks__/iap";
import { loader } from ".";

describe("GET /admin/users/", () => {
  it("requires admin", async () => {
    setDefaultTestIdentity();

    await expectRequiresAdmin(
      loader({
        request: new Request(`http://localhost/admin/users/`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});
