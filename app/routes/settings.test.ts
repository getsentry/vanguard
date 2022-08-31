import { expectRequiresUser } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { action, loader } from "./settings";

describe("GET /settings", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: await buildRequest(`http://localhost/settings`, {
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
        request: await buildRequest(`http://localhost/settings`, {
          method: "POST",
        }),
        params: {},
        context: {},
      })
    );
  });
});
