import { installGlobals } from "@remix-run/node";
import "@testing-library/jest-dom/extend-expect";
import { prisma } from "~/db.server";

installGlobals();

const clearDatabase = async () => {
  await prisma.$transaction([
    prisma.postMeta.deleteMany(),
    prisma.postRevision.deleteMany(),
    prisma.post.deleteMany(),
    prisma.categoryMeta.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

global.beforeAll(async () => {
  await clearDatabase();
});

global.afterEach(async () => {
  await clearDatabase();
});

global.afterAll(async () => {
  await prisma.$disconnect();
});
