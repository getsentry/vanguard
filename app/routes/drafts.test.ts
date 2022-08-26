import { expectRequiresUser } from "~/lib/test/expects";
import { loader } from "./drafts";

describe("GET /drafts", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: new Request(`http://localhost/drafts`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});
