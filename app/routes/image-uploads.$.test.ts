// @ts-nocheck
import { expectRequiresUser } from "~/lib/test/expects";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./image-uploads.$";

describe("GET /image-uploads/*", () => {
  it("requires user", async () => {
    await expectRequiresUser(
      loader({
        request: await buildRequest("http://localhost/image-uploads/post-images/anything.png"),
        params: { "*": "post-images/anything.png" },
        context: {},
      }),
    );
  });
});
