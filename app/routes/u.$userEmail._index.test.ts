import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./u.$userEmail._index";

describe("GET /u/$userEmail", () => {
  it("requires user", async () => {
    const user = await Fixtures.User();
    await expectRequiresUser(
      loader({
        request: await buildRequest(`http://localhost/u/${user.email}`, {
          method: "GET",
        }),
        params: { userEmail: user.email },
        context: {},
      }),
    );
  });
});
