import { expectRequiresUser } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { action, loader } from "./new-post";

describe("GET /new-post", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: await buildRequest(`http://localhost/new-post`, {
          method: "GET",
        }),
        params: {},
        context: {},
      })
    );
  });
});

describe("POST /new-post", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      action({
        request: await buildRequest(`http://localhost/new-post`, {
          method: "POST",
        }),
        params: {},
        context: {},
      })
    );
  });
});
