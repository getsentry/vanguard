import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { action } from ".";

describe("POST /api/posts/$postId/comments", () => {
  it("requires user", async () => {
    const post = await Fixtures.Post();
    await expectRequiresUser(
      action({
        request: new Request(`http://localhost/api/posts/${post.id}/comments`, {
          method: "POST",
        }),
        params: { postId: post.id },
        context: {},
      })
    );
  });
});
