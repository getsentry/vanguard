import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
