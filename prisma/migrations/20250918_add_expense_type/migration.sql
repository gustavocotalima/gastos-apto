-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('EXPENSE', 'CREDIT');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN "type" "ExpenseType" NOT NULL DEFAULT 'EXPENSE';

-- Update existing credit entries (if any)
UPDATE "Expense"
SET "type" = 'CREDIT'
WHERE "description" ILIKE '%credit%' OR "description" ILIKE '%crédito%';