import { expectRequiresUser } from "~/lib/test/expects";
import { loader } from "./search";

describe("GET /search", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: new Request(`http://localhost/search`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});
