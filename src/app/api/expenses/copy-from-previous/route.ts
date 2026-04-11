import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"
import { handleApiError, AuthenticationError } from "@/lib/errors"

const copyExpensesSchema = z.object({
  expenseIds: z.array(z.string().min(1)).min(1),
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
    const currentMonthYear = searchParams.get("monthYear") || new Date().toISOString().slice(0, 7)

    // Calculate previous month
    const [year, month] = currentMonthYear.split("-").map(Number)
    const prevDate = new Date(year, month - 2, 1) // month - 2 because JS months are 0-indexed
    const prevMonthYear = prevDate.toISOString().slice(0, 7)

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

    // Calculate the target date (first day of target month)
    const [year, month] = targetMonthYear.split("-").map(Number)
    const targetDate = new Date(year, month - 1, 1, 12, 0, 0)

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
