import { prisma } from "@/lib/prisma"
import {
  DEFAULT_BILLING_CYCLE_START_DAY,
  getBillingMonthYear,
} from "@/lib/billing-cycle"

const SETTINGS_ID = "default"

export async function getBillingCycleStartDay() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_ID },
    select: { billingCycleStartDay: true },
  })

  return settings?.billingCycleStartDay ?? DEFAULT_BILLING_CYCLE_START_DAY
}

export async function setBillingCycleStartDay(billingCycleStartDay: number) {
  return prisma.$transaction(async (tx) => {
    const settings = await tx.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: { billingCycleStartDay },
      create: { id: SETTINGS_ID, billingCycleStartDay },
      select: { billingCycleStartDay: true },
    })

    const expenses = await tx.expense.findMany({
      select: {
        id: true,
        date: true,
        monthYear: true,
      },
    })

    const expenseIdsByMonth = new Map<string, string[]>()

    for (const expense of expenses) {
      const monthYear = getBillingMonthYear(
        expense.date,
        billingCycleStartDay
      )

      if (monthYear === expense.monthYear) continue

      const expenseIds = expenseIdsByMonth.get(monthYear) ?? []
      expenseIds.push(expense.id)
      expenseIdsByMonth.set(monthYear, expenseIds)
    }

    for (const [monthYear, expenseIds] of expenseIdsByMonth) {
      await tx.expense.updateMany({
        where: { id: { in: expenseIds } },
        data: { monthYear },
      })

      await tx.airConditioningUsage.updateMany({
        where: { expenseId: { in: expenseIds } },
        data: { monthYear },
      })
    }

    return settings
  })
}
