import { expectRequiresAdmin } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";
import { prisma } from "~/services/db.server";

import { action, loader } from "./admin.categories.$categoryId";

const EMOJI = "🦰";

describe("GET /admin/categories/$categoryId", () => {
  it("requires admin", async () => {
    const category = await Fixtures.Category();

    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          `http://localhost/admin/categories/${category.id}`,
          {
            method: "GET",
          },
        ),
        params: { categoryId: category.id },
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });
});

describe("POST /admin/categories/$categoryId", () => {
  it("requires admin", async () => {
    const category = await Fixtures.Category();

    await expectRequiresAdmin(
      action({
        request: await buildRequest(
          `http://localhost/admin/categories/${category.id}`,
          {
            method: "POST",
          },
        ),
        params: { categoryId: category.id },
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });

  it("validates defaultEmojis", async () => {
    const category = await Fixtures.Category();
    const user = await Fixtures.User({ admin: true });

    const formData = new FormData();
    formData.append("name", category.name);
    formData.append("slug", category.slug);
    formData.append("colorHex", category.colorHex);
    formData.append("defaultEmojis", "abc");

    const response: Response = await action({
      request: await buildRequest(
        `http://localhost/admin/categories/${category.id}`,
        {
          method: "POST",
          body: formData,
        },
      ),
      params: { categoryId: category.id },
      context: { user },
    });

    expect(response.status).toBe(400);
    const rdata = await response.json();
    expect(rdata.errors.defaultEmojis).toBeDefined();
  });

  it("persists defaultEmojis", async () => {
    const category = await Fixtures.Category();
    const user = await Fixtures.User({ admin: true });

    const formData = new FormData();
    formData.append("name", category.name);
    formData.append("slug", category.slug);
    formData.append("colorHex", category.colorHex);
    formData.append("defaultEmojis", EMOJI);

    const response: Response = await action({
      request: await buildRequest(
        `http://localhost/admin/categories/${category.id}`,
        {
          method: "POST",
          body: formData,
        },
      ),
      params: { categoryId: category.id },
      context: { user },
    });

    expect(response.status).toBe(302);

    const newCat = await prisma.category.findUnique({
      where: {
        slug: category.slug,
      },
    });
    expect(newCat?.defaultEmojis).toEqual([EMOJI]);
  });
});
