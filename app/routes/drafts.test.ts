import { expectRequiresUser } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./drafts";

describe("GET /drafts", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: await buildRequest(`http://localhost/drafts`, {
          method: "GET",
        }),
        params: {},
        context: {},
      }),
    );
  });
});
