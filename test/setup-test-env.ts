import { installGlobals } from "@remix-run/node";
import "@testing-library/jest-dom/extend-expect";
import { prisma } from "~/db.server";

installGlobals();

global.DefaultFixtures = {};

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
