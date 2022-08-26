import type { Post, User } from "@prisma/client";
import { setDefaultTestIdentity, setTestIdentity } from "~/lib/__mocks__/iap";
import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";

import { action } from "./$commentId";

describe("DELETE /api/posts/$postId/subscription", () => {
  let author: User;
  let post: Post;

  beforeEach(async () => {
    author = await Fixtures.User();
    post = await Fixtures.Post({
      authorId: author.id,
    });
  });

  beforeEach(() => {
    setDefaultTestIdentity();
  });

  it("requires user", async () => {
    const comment = await Fixtures.PostComment();
    setTestIdentity(null);
    await expectRequiresUser(
      action({
        request: new Request(
          `http://localhost/api/posts/${post.id}/comments/${comment.id}`,
          {
            method: "DELETE",
          }
        ),
        params: { postId: post.id, commentId: comment.id },
        context: {},
      })
    );
  });
});
