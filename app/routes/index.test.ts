import { expectRequiresUser } from "~/lib/test/expects";
import { loader } from "./";

describe("GET /", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: new Request(`http://localhost/`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});
