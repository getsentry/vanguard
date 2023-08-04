import { expectRequiresUser } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./search";

describe("GET /search", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: await buildRequest(`http://localhost/search`, {
          method: "GET",
        }),
        params: {},
        context: {},
      }),
    );
  });
});
