import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";
import { loader, action } from "./p.$postId._index";

describe("GET /p/$postId", () => {
  it("requires user", async () => {
    const post = await Fixtures.Post();
    await expectRequiresUser(
      loader({
        request: await buildRequest(`http://localhost/p/${post.id}`, {
          method: "GET",
        }),
        params: { postId: post.id },
        context: {},
      }),
    );
  });
});

describe("POST /p/$postId", () => {
  it("requires user", async () => {
    const post = await Fixtures.Post();
    await expectRequiresUser(
      action({
        request: await buildRequest(`http://localhost/p/${post.id}`, {
          method: "POST",
        }),
        params: { postId: post.id },
        context: {},
      }),
    );
  });
});
