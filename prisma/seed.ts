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
        admin: true,
      },
      create: {
        email,
        name,
        canPostRestricted: true,
        admin: true,
      },
    });
  });

  await prisma.category.upsert({
    where: { name: "Shipped" },
    update: {
      restricted: false,
      slug: "shipped",
      colorHex: "#7854f6",
    },
    create: {
      name: "Shipped",
      slug: "shipped",
      restricted: false,
      colorHex: "#7854f6",
    },
  });

  await prisma.category.upsert({
    where: { name: "Strategy" },
    update: {
      restricted: true,
      slug: "strategy",
      colorHex: "#ffca00",
    },
    create: {
      name: "Strategy",
      slug: "strategy",
      restricted: true,
      colorHex: "#ffca00",
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
