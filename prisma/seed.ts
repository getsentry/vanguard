import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMINS = [
  ["david@sentry.io", "David Cramer"],
  ["chris@sentry.io", "Chris Jennings"],
];

async function main() {
  let adminsByEmail: { [email: string]: any } = {};

  ADMINS.forEach(async ([email, name]) => {
    adminsByEmail[email] = await prisma.user.upsert({
      where: { email },
      update: {
        canPostRestricted: true,
      },
      create: {
        email,
        name,
        canPostRestricted: true,
      },
    });
  });

  await prisma.category.upsert({
    where: { name: "Shipped" },
    update: {
      restricted: false,
    },
    create: {
      name: "Shipped",
      restricted: false,
    },
  });

  await prisma.category.upsert({
    where: { name: "Strategy" },
    update: {
      restricted: true,
    },
    create: {
      name: "Strategy",
      restricted: true,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
