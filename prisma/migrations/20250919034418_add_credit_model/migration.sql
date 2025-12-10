/*
  Warnings:

  - You are about to drop the column `type` on the `Expense` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "type";

-- DropEnum
DROP TYPE "ExpenseType";

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Credit_monthYear_idx" ON "Credit"("monthYear");

-- CreateIndex
CREATE INDEX "Credit_fromUserId_idx" ON "Credit"("fromUserId");

-- CreateIndex
CREATE INDEX "Credit_toUserId_idx" ON "Credit"("toUserId");

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
