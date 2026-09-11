import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"
import { handleApiError, AuthenticationError } from "@/lib/errors"
import { getBillingCycleStartDay } from "@/lib/billing-cycle-settings"
import {
  getBillingCycleStartDate,
  getCurrentBillingMonthYear,
  shiftMonthYear,
} from "@/lib/billing-cycle"

const copyExpensesSchema = z.object({
  expenseIds: z.array(z.string().min(1).max(100)).min(1).max(100),
  targetMonthYear: z.string().regex(/^\d{4}-\d{2}$/),
})

// GET: Fetch expenses from the previous month
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const requestedMonth = searchParams.get("monthYear")
    const currentMonthYear = requestedMonth || getCurrentBillingMonthYear(
      await getBillingCycleStartDay()
    )
    const prevMonthYear = shiftMonthYear(currentMonthYear, -1)

    const expenses = await prisma.expense.findMany({
      where: { monthYear: prevMonthYear },
      include: {
        category: true,
        paidBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    })

    return NextResponse.json({
      previousMonth: prevMonthYear,
      expenses: expenses.map(expense => ({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        type: expense.type || 'EXPENSE',
        categoryId: expense.categoryId,
        categoryName: expense.category.name,
        paidById: expense.paidById,
        paidByName: expense.paidBy.name,
      }))
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST: Copy selected expenses to the current month
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    const { expenseIds, targetMonthYear } = copyExpensesSchema.parse(body)

    // Fetch the original expenses
    const originalExpenses = await prisma.expense.findMany({
      where: {
        id: { in: expenseIds }
      }
    })

    const startDay = await getBillingCycleStartDay()
    const targetDate = getBillingCycleStartDate(targetMonthYear, startDay)

    // Create copies of the expenses
    const createdExpenses = await Promise.all(
      originalExpenses.map(expense =>
        prisma.expense.create({
          data: {
            date: targetDate,
            amount: expense.amount,
            description: expense.description,
            categoryId: expense.categoryId,
            paidById: expense.paidById,
            monthYear: targetMonthYear,
            type: expense.type || 'EXPENSE',
          },
          include: {
            category: true,
            paidBy: { select: { id: true, name: true } },
          },
        })
      )
    )

    return NextResponse.json({
      message: `${createdExpenses.length} expense(s) copied successfully`,
      expenses: createdExpenses
    })
  } catch (error) {
    return handleApiError(error)
  }
}
