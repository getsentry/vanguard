import { expectRequiresUser } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { action, loader } from "./welcome";

describe("GET /welcome", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: await buildRequest(`http://localhost/welcome`, {
          method: "GET",
        }),
        params: {},
        context: {},
      }),
    );
  });
});

describe("POST /welcome", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      action({
        request: await buildRequest(`http://localhost/welcome`, {
          method: "POST",
        }),
        params: {},
        context: {},
      }),
    );
  });
});
