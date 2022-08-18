import { installGlobals } from "@remix-run/node";
import "@testing-library/jest-dom/extend-expect";
import { prisma } from "~/db.server";

import { faker } from "@faker-js/faker";

installGlobals();

global.DefaultFixtures = {};

global.Fixtures = {
  User: async ({ ...data } = {}) => {
    return await prisma.user.create({
      data: {
        name: faker.name.firstName(),
        email: faker.internet.email(),
        ...data,
      },
    });
  },

  Category: async ({ ...data } = {}) => {
    return await prisma.category.create({
      data: {
        name: faker.lorem.word(),
        slug: faker.lorem.slug(),
        ...data,
      },
    });
  },

  Post: async ({ ...data } = {}) => {
    return await prisma.post.create({
      data: {
        title: faker.lorem.words(3),
        content: faker.lorem.paragraphs(),
        deleted: false,
        published: true,
        ...data,
      },
    });
  },
};

const clearDatabase = async () => {
  // TODO: good idea, but too slow
  // const tablenames = await prisma.$queryRaw<
  //   Array<{ tablename: string }>
  // >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  // for (const { tablename } of tablenames) {
  //   if (tablename !== "_prisma_migrations") {
  //     try {
  //       await prisma.$executeRawUnsafe(
  //         `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
  //       );
  //     } catch (error) {
  //       console.log({ error });
  //     }
  //   }
  // }

  await prisma.$transaction([
    prisma.postComment.deleteMany(),
    prisma.postReaction.deleteMany(),
    prisma.postMeta.deleteMany(),
    prisma.postRevision.deleteMany(),
    prisma.post.deleteMany(),
    prisma.categoryMeta.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

const createDummyUser = async () => {
  return await prisma.user.create({
    data: {
      id: "cl6vih0pm16012nklaetl2tvze",
      email: "jane.doe@example.com",
      externalId: "dummy-iap-user",
    },
  });
};

// global.beforeAll(async () => {});

global.beforeEach(async () => {
  await clearDatabase();

  global.DefaultFixtures = {};

  global.DefaultFixtures.DUMMY_USER = await createDummyUser();
});

// global.afterEach(async () => {
//   await clearDatabase();
// });

global.afterAll(async () => {
  await prisma.$disconnect();
});
