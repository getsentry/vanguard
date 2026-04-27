// @ts-nocheck
import { expectRequiresAdmin } from "~/lib/test/expects";
import * as Fixtures from "~/lib/test/fixtures";
import { buildRequest } from "~/lib/test/request";
import { eq } from "drizzle-orm";
import { db } from "~/db/client";
import { categories } from "~/db/schema";

import { action, loader } from "./admin.categories.$categoryId";

const EMOJI = "🦰";

describe("GET /admin/categories/$categoryId", () => {
  it("requires admin", async () => {
    const category = await Fixtures.Category();

    await expectRequiresAdmin(
      loader({
        request: await buildRequest(
          `http://localhost/admin/categories/${category.id}`,
          { method: "GET" },
          { user: DefaultFixtures.DEFAULT_USER },
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
          { method: "POST" },
          { user: DefaultFixtures.DEFAULT_USER },
        ),
        params: { categoryId: category.id },
        context: { user: DefaultFixtures.DEFAULT_USER },
      }),
    );
  });

  it("validates defaultEmojis", async () => {
    const category = await Fixtures.Category();
    const user = await Fixtures.User({ admin: true });

    const body = new URLSearchParams({
      name: category.name,
      slug: category.slug,
      colorHex: category.colorHex,
      defaultEmojis: "abc",
    });

    const response: Response = await action({
      request: await buildRequest(
        `http://localhost/admin/categories/${category.id}`,
        { method: "POST", body },

        { user },
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

    const body = new URLSearchParams({
      name: category.name,
      slug: category.slug,
      colorHex: category.colorHex,
      defaultEmojis: EMOJI,
    });

    const response: Response = await action({
      request: await buildRequest(
        `http://localhost/admin/categories/${category.id}`,
        { method: "POST", body },

        { user },
      ),
      params: { categoryId: category.id },
      context: { user },
    });

    expect(response.status).toBe(302);

    const newCat = await db.query.categories.findFirst({
      where: eq(categories.slug, category.slug),
    });
    expect(newCat?.defaultEmojis).toEqual([EMOJI]);
  });
});
