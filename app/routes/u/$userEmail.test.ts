import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { loader } from "./$userEmail";

describe("GET /u/$userEmail", () => {
  it("requires user", async () => {
    const user = await Fixtures.User();
    await expectRequiresUser(
      loader({
        request: new Request(`http://localhost/u/${user.email}`, {
          method: "GET",
        }),
        params: { userEmail: user.email },
        context: {},
      })
    );
  });
});
