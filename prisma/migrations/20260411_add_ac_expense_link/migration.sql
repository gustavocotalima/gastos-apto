-- AlterTable
ALTER TABLE "AirConditioningUsage" ADD COLUMN "acExtraCost" DOUBLE PRECISION,
ADD COLUMN "cipWithoutAirAmount" DOUBLE PRECISION,
ADD COLUMN "expenseId" TEXT,
ADD COLUMN "paidById" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AirConditioningUsage_expenseId_key" ON "AirConditioningUsage"("expenseId");

-- AddForeignKey
ALTER TABLE "AirConditioningUsage" ADD CONSTRAINT "AirConditioningUsage_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirConditioningUsage" ADD CONSTRAINT "AirConditioningUsage_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
