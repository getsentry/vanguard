import { installGlobals } from "@remix-run/node";
import "@testing-library/jest-dom/extend-expect";
import { prisma } from "~/db.server";
import { DefaultTestIdentity, setTestIdentity } from "~/lib/__mocks__/iap";

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

const createDummyUser = async () => {
  return await prisma.user.create({
    data: {
      id: "cl6vih0pm16012nklaetl2tvze",
      email: DefaultTestIdentity.email,
      externalId: DefaultTestIdentity.id,
    },
  });
};

// global.beforeAll(async () => {});

global.beforeEach(async () => {
  await clearDatabase();

  global.DefaultFixtures = {};

  global.DefaultFixtures.DUMMY_USER = await createDummyUser();

  setTestIdentity(null);
});

global.afterEach(async () => {
  vi.clearAllMocks();
});

global.afterAll(async () => {
  await prisma.$disconnect();
});

vi.mock("~/lib/iap");
