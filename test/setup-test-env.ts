import { installGlobals } from "@remix-run/node";
import "@testing-library/jest-dom/extend-expect";
import { prisma } from "~/services/db.server";

installGlobals();

global.DefaultFixtures = {};

const clearDatabase = async () => {
  // TODO: good idea, but too slow
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;
  const tableNames = tablenames
    .filter(({ tablename }) => tablename !== "_prisma_migrations")
    .map(({ tablename }) => `"public"."${tablename}"`)
    .join(", ");
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
  // await prisma.$transaction([
  //   prisma.postSubscription.deleteMany(),
  //   prisma.postComment.deleteMany(),
  //   prisma.postReaction.deleteMany(),
  //   prisma.postMeta.deleteMany(),
  //   prisma.postRevision.deleteMany(),
  //   prisma.post.deleteMany(),
  //   prisma.feed.deleteMany(),
  //   prisma.categoryMeta.deleteMany(),
  //   prisma.category.deleteMany(),
  //   prisma.user.deleteMany(),
  // ]);
};

const createDefaultUser = async () => {
  return await prisma.user.create({
    data: {
      id: "cl6vih0pm16012nklaetl2tvze",
      email: "test-iap-user@example.com",
      externalId: "test-iap-user",
    },
  });
};

// global.beforeAll(async () => {});

beforeEach(async () => {
  await clearDatabase();

  global.DefaultFixtures = {};

  global.DefaultFixtures.DEFAULT_USER = await createDefaultUser();
});

afterEach(async () => {
  vi.clearAllMocks();
});

afterAll(async () => {
  await prisma.$disconnect();
});
