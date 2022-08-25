-- CreateTable
CREATE TABLE "Feed" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Feed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FeedToPost" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Feed_name_key" ON "Feed"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_FeedToPost_AB_unique" ON "_FeedToPost"("A", "B");

-- CreateIndex
CREATE INDEX "_FeedToPost_B_index" ON "_FeedToPost"("B");

-- AddForeignKey
ALTER TABLE "_FeedToPost" ADD CONSTRAINT "_FeedToPost_A_fkey" FOREIGN KEY ("A") REFERENCES "Feed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeedToPost" ADD CONSTRAINT "_FeedToPost_B_fkey" FOREIGN KEY ("B") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
