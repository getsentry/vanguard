import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { loader } from "./$categorySlug";

describe("GET /c/$categorySlug", () => {
  it("requires user", async () => {
    const category = await Fixtures.Category();
    await expectRequiresUser(
      loader({
        request: new Request(`http://localhost/c/${category.slug}`, {
          method: "GET",
        }),
        params: { categorySlug: category.slug },
        context: {},
      })
    );
  });
});
