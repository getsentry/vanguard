import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { loader, action } from ".";

describe("GET /p/$postId/edit", () => {
  it("requires user", async () => {
    const post = await Fixtures.Post();
    await expectRequiresUser(
      loader({
        request: new Request(`http://localhost/p/${post.id}/edit`, {
          method: "GET",
        }),
        params: { postId: post.id },
        context: {},
      })
    );
  });
});

describe("POST /p/$postId/edit", () => {
  it("requires user", async () => {
    const post = await Fixtures.Post();
    await expectRequiresUser(
      action({
        request: new Request(`http://localhost/p/${post.id}/edit`, {
          method: "POST",
        }),
        params: { postId: post.id },
        context: {},
      })
    );
  });
});
