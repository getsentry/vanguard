import { expectRequiresUser } from "~/lib/test/expects";
import { action } from "./upload-image";

describe("POST /upload-image", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      action({
        request: new Request(`http://localhost/upload-image`, {
          method: "POST",
        }),
        params: {},
        context: {},
      })
    );
  });
});
