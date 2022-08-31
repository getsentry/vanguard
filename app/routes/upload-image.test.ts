import { expectRequiresUser } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { action } from "./upload-image";

describe("POST /upload-image", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      action({
        request: await buildRequest(`http://localhost/upload-image`, {
          method: "POST",
        }),
        params: {},
        context: {},
      })
    );
  });
});
