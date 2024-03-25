import { expectRequiresUser } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./_index";

describe("GET /", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: await buildRequest(`http://localhost/`, {
          method: "GET",
        }),
        params: {},
        context: {},
      }),
    );
  });
});
