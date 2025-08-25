-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "splitType" "SplitType" NOT NULL DEFAULT 'EQUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "paidById" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CipConfiguration" (
    "id" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "baseCalculationValue" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CipConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CipTier" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "minKwh" DOUBLE PRECISION NOT NULL,
    "maxKwh" DOUBLE PRECISION,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CipTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirConditioningUsage" (
    "id" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "airConsumptionKwh" DOUBLE PRECISION NOT NULL,
    "totalConsumptionKwh" DOUBLE PRECISION NOT NULL,
    "totalBillAmount" DOUBLE PRECISION NOT NULL,
    "kwhUnitPrice" DOUBLE PRECISION NOT NULL,
    "totalCipAmount" DOUBLE PRECISION NOT NULL,
    "calculatedAmount" DOUBLE PRECISION NOT NULL,
    "cipTierWithoutAir" DOUBLE PRECISION NOT NULL,
    "cipTierWithAir" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AirConditioningUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlySettlement" (
    "id" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "status" "SettlementStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlySettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settlement" (
    "id" TEXT NOT NULL,
    "monthlySettlementId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Settlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategorySplit" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "CategorySplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseSplit" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ExpenseSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_name_idx" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Expense_monthYear_idx" ON "Expense"("monthYear");

-- CreateIndex
CREATE INDEX "Expense_categoryId_idx" ON "Expense"("categoryId");

-- CreateIndex
CREATE INDEX "Expense_paidById_idx" ON "Expense"("paidById");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Expense_monthYear_categoryId_idx" ON "Expense"("monthYear", "categoryId");

-- CreateIndex
CREATE INDEX "Expense_monthYear_paidById_idx" ON "Expense"("monthYear", "paidById");

-- CreateIndex
CREATE UNIQUE INDEX "CipConfiguration_monthYear_key" ON "CipConfiguration"("monthYear");

-- CreateIndex
CREATE INDEX "CipConfiguration_monthYear_idx" ON "CipConfiguration"("monthYear");

-- CreateIndex
CREATE INDEX "CipTier_configurationId_idx" ON "CipTier"("configurationId");

-- CreateIndex
CREATE INDEX "AirConditioningUsage_monthYear_idx" ON "AirConditioningUsage"("monthYear");

-- CreateIndex
CREATE INDEX "AirConditioningUsage_userId_idx" ON "AirConditioningUsage"("userId");

-- CreateIndex
CREATE INDEX "AirConditioningUsage_monthYear_userId_idx" ON "AirConditioningUsage"("monthYear", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlySettlement_monthYear_key" ON "MonthlySettlement"("monthYear");

-- CreateIndex
CREATE INDEX "MonthlySettlement_monthYear_idx" ON "MonthlySettlement"("monthYear");

-- CreateIndex
CREATE INDEX "MonthlySettlement_status_idx" ON "MonthlySettlement"("status");

-- CreateIndex
CREATE INDEX "Settlement_monthlySettlementId_idx" ON "Settlement"("monthlySettlementId");

-- CreateIndex
CREATE INDEX "CategorySplit_categoryId_idx" ON "CategorySplit"("categoryId");

-- CreateIndex
CREATE INDEX "CategorySplit_userId_idx" ON "CategorySplit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CategorySplit_categoryId_userId_key" ON "CategorySplit"("categoryId", "userId");

-- CreateIndex
CREATE INDEX "ExpenseSplit_expenseId_idx" ON "ExpenseSplit"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseSplit_userId_idx" ON "ExpenseSplit"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseSplit_expenseId_userId_key" ON "ExpenseSplit"("expenseId", "userId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CipTier" ADD CONSTRAINT "CipTier_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "CipConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirConditioningUsage" ADD CONSTRAINT "AirConditioningUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_monthlySettlementId_fkey" FOREIGN KEY ("monthlySettlementId") REFERENCES "MonthlySettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorySplit" ADD CONSTRAINT "CategorySplit_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategorySplit" ADD CONSTRAINT "CategorySplit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseSplit" ADD CONSTRAINT "ExpenseSplit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
