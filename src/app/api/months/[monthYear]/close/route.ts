import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ monthYear: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { monthYear } = await params

    // Check if month is already closed
    const existingSettlement = await prisma.monthlySettlement.findUnique({
      where: { monthYear },
    })

    if (existingSettlement?.status === "CLOSED") {
      return NextResponse.json(
        { error: "Este mês já foi fechado" },
        { status: 400 }
      )
    }

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

    // Get all active users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    })

    // Calculate splits using the new dynamic system
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

    // Generate settlements (who owes money to whom)
    const settlements = []
    const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance)
    const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance)

    let creditorIndex = 0
    let debtorIndex = 0

    while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
      const creditor = creditors[creditorIndex]
      const debtor = debtors[debtorIndex]

      const amountToSettle = Math.min(creditor.balance, Math.abs(debtor.balance))

      if (amountToSettle > 0.01) { // Only create settlement if amount is significant
        settlements.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amount: amountToSettle,
        })
      }

      creditor.balance -= amountToSettle
      debtor.balance += amountToSettle

      if (creditor.balance <= 0.01) creditorIndex++
      if (debtor.balance >= -0.01) debtorIndex++
    }

    // Create or update settlement
    const settlement = await prisma.monthlySettlement.upsert({
      where: { monthYear },
      update: {
        status: "CLOSED",
        closedAt: new Date(),
        settlements: {
          deleteMany: {},
          create: settlements,
        },
      },
      create: {
        monthYear,
        status: "CLOSED",
        closedAt: new Date(),
        settlements: {
          create: settlements,
        },
      },
      include: {
        settlements: true,
      },
    })

    // Calculate total splits for summary
    const splits = users.reduce((acc, user) => {
      acc[user.name] = userTotals[user.id] || 0
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      settlement,
      balances,
      totals: {
        expenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        airConditioning: airConditioningData?.reduce((sum, ac) => sum + ac.calculatedAmount, 0) || 0,
        splits,
      },
    })
  } catch (error) {
    console.error("Error closing month:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}