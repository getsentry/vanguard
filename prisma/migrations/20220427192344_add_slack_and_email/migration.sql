-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "colorHex" VARCHAR(7);

-- CreateTable
CREATE TABLE "CategorySlack" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "username" TEXT,
    "iconUrl" TEXT,
    "channel" TEXT,

    CONSTRAINT "CategorySlack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryEmail" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "to" TEXT NOT NULL,

    CONSTRAINT "CategoryEmail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CategorySlack" ADD CONSTRAINT "CategorySlack_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryEmail" ADD CONSTRAINT "CategoryEmail_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
