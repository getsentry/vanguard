import { installGlobals } from "@remix-run/node/globals";
import "@testing-library/jest-dom/extend-expect";
import { prisma } from "~/db.server";

installGlobals();

const clearDatabase = async () => {
  await prisma.$transaction([
    prisma.postRevision.deleteMany(),
    prisma.post.deleteMany(),
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
