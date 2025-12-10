/*
  Warnings:

  - You are about to drop the `Credit` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('EXPENSE', 'CREDIT');

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_fromUserId_fkey";

-- DropForeignKey
ALTER TABLE "Credit" DROP CONSTRAINT "Credit_toUserId_fkey";

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "type" "ExpenseType" NOT NULL DEFAULT 'EXPENSE';

-- DropTable
DROP TABLE "Credit";
