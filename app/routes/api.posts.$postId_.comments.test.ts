import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";
import { action } from "./api.posts.$postId_.comments";

describe("POST /api/posts/$postId/comments", () => {
  it("requires user", async () => {
    const post = await Fixtures.Post();
    await expectRequiresUser(
      action({
        request: await buildRequest(
          `http://localhost/api/posts/${post.id}/comments`,
          {
            method: "POST",
          },
        ),
        params: { postId: post.id },
        context: {},
      }),
    );
  });
});
