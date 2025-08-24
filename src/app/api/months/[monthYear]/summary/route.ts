import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ monthYear: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { monthYear } = await params

    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
    })

    // Get all expenses for the month
    const expenses = await prisma.expense.findMany({
      where: { monthYear },
      include: {
        category: {
          include: {
            splits: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
        paidBy: { select: { id: true, name: true } },
        customSplits: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    })

    // Get air conditioning data
    let airConditioningData = null
    try {
      airConditioningData = await prisma.airConditioningUsage.findMany({
        where: { monthYear },
        include: {
          user: { select: { id: true, name: true } },
        },
      })
    } catch {
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
    } catch {
      // Table might not exist yet
    }

    // Calculate totals and splits per user
    const calculateSplits = () => {
      const userTotals: Record<string, number> = {}
      
      // Initialize all users with 0
      users.forEach(user => {
        userTotals[user.id] = 0
      })

      expenses.forEach((expense) => {
        const { category, amount, customSplits } = expense
        
        // Check if expense has custom splits
        if (customSplits && customSplits.length > 0) {
          customSplits.forEach(split => {
            userTotals[split.userId] = (userTotals[split.userId] || 0) + split.amount
          })
        } else if (category.splitType === 'EQUAL') {
          // Equal split among all active users
          const activeUserCount = users.length
          const equalShare = amount / activeUserCount
          users.forEach(user => {
            userTotals[user.id] += equalShare
          })
        } else if (category.splitType === 'CUSTOM' && category.splits.length > 0) {
          // Custom percentages from category
          category.splits.forEach(split => {
            const userShare = amount * (split.percentage / 100)
            userTotals[split.userId] = (userTotals[split.userId] || 0) + userShare
          })
        } else {
          // Fallback to equal split if no configuration
          const activeUserCount = users.length
          const equalShare = amount / activeUserCount
          users.forEach(user => {
            userTotals[user.id] += equalShare
          })
        }
      })

      // Add air conditioning costs if applicable
      if (airConditioningData && airConditioningData.length > 0) {
        airConditioningData.forEach(acUsage => {
          userTotals[acUsage.userId] = (userTotals[acUsage.userId] || 0) + acUsage.calculatedAmount
        })
      }

      return userTotals
    }

    const userTotals = calculateSplits()

    // Calculate who paid what
    const paidByUser = expenses.reduce((acc, expense) => {
      const userId = expense.paidBy.id
      acc[userId] = (acc[userId] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)

    // Calculate balances (what each person owes or is owed)
    const balances = users.map(user => {
      const paid = paidByUser[user.id] || 0
      const owes = userTotals[user.id] || 0

      return {
        userId: user.id,
        userName: user.name,
        paid,
        owes,
        balance: paid - owes, // positive = is owed money, negative = owes money
      }
    })

    // Calculate total splits for summary
    const splits = users.reduce((acc, user) => {
      acc[user.name] = userTotals[user.id] || 0
      return acc
    }, {} as Record<string, number>)

    const summary = {
      monthYear,
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      expenseCount: expenses.length,
      airConditioningAmount: airConditioningData?.reduce((sum, ac) => sum + ac.calculatedAmount, 0) || 0,
      splits,
      balances,
      settlement,
      status: settlement?.status || 'OPEN',
      activeUsers: users,
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error fetching month summary:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}