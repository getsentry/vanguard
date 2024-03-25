import { expectRequiresUser } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";
import { loader } from "./c.$categorySlug._index";

describe("GET /c/$categorySlug", () => {
  it("requires user", async () => {
    const category = await Fixtures.Category();
    await expectRequiresUser(
      loader({
        request: await buildRequest(`http://localhost/c/${category.slug}`, {
          method: "GET",
        }),
        params: { categorySlug: category.slug },
        context: {},
      }),
    );
  });
});
