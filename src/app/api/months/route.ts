import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get distinct month-year combinations from expenses
    const monthsWithExpenses = await prisma.expense.findMany({
      select: {
        monthYear: true,
      },
      distinct: ['monthYear'],
      orderBy: {
        monthYear: 'desc',
      },
    })

    // Get summary data for each month
    const monthsSummary = await Promise.all(
      monthsWithExpenses.map(async ({ monthYear }) => {
        // Get total expenses for the month
        const totalExpenses = await prisma.expense.aggregate({
          where: { monthYear },
          _sum: { amount: true },
          _count: { id: true },
        })

        // Get air conditioning data for the month (if exists)
        let airConditioningData = null
        try {
          airConditioningData = await prisma.airConditioningUsage.findFirst({
            where: { monthYear },
            select: {
              calculatedAmount: true,
              airConsumptionKwh: true,
            },
          })
        } catch {
          // Table might not exist yet
        }

        // Check if month is closed (has settlement)
        let settlement = null
        try {
          settlement = await prisma.monthlySettlement.findUnique({
            where: { monthYear },
            select: { status: true, closedAt: true },
          })
        } catch {
          // Table might not exist yet
        }

        return {
          monthYear,
          totalAmount: totalExpenses._sum.amount || 0,
          expenseCount: totalExpenses._count || 0,
          airConditioningAmount: airConditioningData?.calculatedAmount || 0,
          airConsumption: airConditioningData?.airConsumptionKwh || 0,
          status: settlement?.status || 'OPEN',
          closedAt: settlement?.closedAt,
        }
      })
    )

    return NextResponse.json(monthsSummary)
  } catch (error) {
    console.error("Error fetching months:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}