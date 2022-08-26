import { expectRequiresUser } from "~/lib/test/expects";
import { action, loader } from "./new-post";

describe("GET /new-post", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: new Request(`http://localhost/new-post`, {
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
        request: new Request(`http://localhost/new-post`, {
          method: "POST",
        }),
        params: {},
        context: {},
      })
    );
  });
});
