-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "allowComments" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "allowComments" BOOLEAN DEFAULT true;
