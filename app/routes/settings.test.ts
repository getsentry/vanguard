import { expectRequiresUser } from "~/lib/test/expects";
import { action, loader } from "./settings";

describe("GET /settings", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: new Request(`http://localhost/settings`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});

describe("POST /settings", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      action({
        request: new Request(`http://localhost/settings`, {
          method: "POST",
        }),
        params: {},
        context: {},
      })
    );
  });
});
