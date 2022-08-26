import type { Post, User } from "@prisma/client";
import { setDefaultTestIdentity, setTestIdentity } from "~/lib/__mocks__/iap";
import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";

import { action } from "./reactions";

describe("POST /api/posts/$postId/subscription", () => {
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
    setTestIdentity(null);
    await expectRequiresUser(
      action({
        request: new Request(
          `http://localhost/api/posts/${post.id}/subscription`,
          {
            method: "POST",
          }
        ),
        params: { postId: post.id },
        context: {},
      })
    );
  });
});
