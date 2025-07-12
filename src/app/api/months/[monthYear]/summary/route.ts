import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { monthYear: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { monthYear } = params

    // Get all expenses for the month
    const expenses = await prisma.expense.findMany({
      where: { monthYear },
      include: {
        category: true,
        paidBy: { select: { id: true, name: true } },
      },
    })

    // Get air conditioning data
    let airConditioningData = null
    try {
      airConditioningData = await prisma.airConditioningUsage.findFirst({
        where: { monthYear },
      })
    } catch (error) {
      // Table might not exist yet
    }

    // Get settlement data
    let settlement = null
    try {
      settlement = await prisma.monthlySettlement.findUnique({
        where: { monthYear },
        include: {
          settlements: true,
        },
      })
    } catch (error) {
      // Table might not exist yet
    }

    // Calculate totals and splits
    const calculateSplit = () => {
      let user1Total = 0
      let user2Total = 0 
      let user3Total = 0

      expenses.forEach((expense) => {
        const { category, amount } = expense
        
        if (category.splitType === 'DEFAULT') {
          // Default: 2/3 for user1+user2, 1/3 for user3
          const user1user2Share = amount * (2/3)
          const user3Share = amount * (1/3)
          
          user1Total += user1user2Share / 2
          user2Total += user1user2Share / 2
          user3Total += user3Share
        } else if (category.splitType === 'CUSTOM') {
          // Custom percentages
          const user1user2Percent = (category.user1user2 || 0) / 100
          const user3Percent = (category.user3 || 0) / 100
          
          const user1user2Share = amount * user1user2Percent
          const user3Share = amount * user3Percent
          
          user1Total += user1user2Share / 2
          user2Total += user1user2Share / 2
          user3Total += user3Share
        }
      })

      // Add air conditioning cost to user1
      if (airConditioningData) {
        user1Total += airConditioningData.calculatedAmount
      }

      return { user1Total, user2Total, user3Total }
    }

    const { user1Total, user2Total, user3Total } = calculateSplit()

    // Calculate who paid what
    const paidByUser = expenses.reduce((acc, expense) => {
      const userId = expense.paidBy.id
      acc[userId] = (acc[userId] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Calculate balances (what each person owes or is owed)
    const calculateBalances = async () => {
      const users = await prisma.user.findMany({
        select: { id: true, name: true },
      })

      const balances = users.map(user => {
        const paid = paidByUser[user.id] || 0
        let owes = 0

        if (user.name === 'user1') {
          owes = user1Total
        } else if (user.name === 'user2') {
          owes = user2Total
        } else if (user.name === 'user3') {
          owes = user3Total
        }

        return {
          userId: user.id,
          userName: user.name,
          paid,
          owes,
          balance: paid - owes, // positive = is owed money, negative = owes money
        }
      })

      return balances
    }

    const balances = await calculateBalances()

    const summary = {
      monthYear,
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      expenseCount: expenses.length,
      airConditioningAmount: airConditioningData?.calculatedAmount || 0,
      splits: {
        user1: user1Total,
        user2: user2Total,
        user3: user3Total,
      },
      balances,
      settlement,
      status: settlement?.status || 'OPEN',
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error fetching month summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}