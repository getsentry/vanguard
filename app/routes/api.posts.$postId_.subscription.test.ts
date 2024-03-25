import type { Post, User } from "@prisma/client";
import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";

import { action } from "./api.posts.$postId_.reactions";

describe("POST /api/posts/$postId/subscription", () => {
  let author: User;
  let post: Post;

  beforeEach(async () => {
    author = await Fixtures.User();
    post = await Fixtures.Post({
      authorId: author.id,
    });
  });

  it("requires user", async () => {
    await expectRequiresUser(
      action({
        request: await buildRequest(
          `http://localhost/api/posts/${post.id}/subscription`,
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
