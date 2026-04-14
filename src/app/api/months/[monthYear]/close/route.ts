import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { handleApiError, AuthenticationError, ConflictError } from "@/lib/errors"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ monthYear: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new AuthenticationError()
    }

    const { monthYear } = await params

    const result = await prisma.$transaction(
      async (tx) => {
        const existing = await tx.monthlySettlement.findUnique({
          where: { monthYear },
        })

        if (existing?.status === "CLOSED") {
          throw new ConflictError("Este mês já foi fechado")
        }

        const expenses = await tx.expense.findMany({
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

        let airConditioningData: Awaited<
          ReturnType<typeof tx.airConditioningUsage.findMany>
        > | null = null
        try {
          airConditioningData = await tx.airConditioningUsage.findMany({
            where: { monthYear },
            include: {
              user: { select: { id: true, name: true } },
            },
          })
        } catch {
          // Table might not exist yet
        }

        const users = await tx.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        })

        const userTotals: Record<string, number> = {}
        users.forEach((user) => {
          userTotals[user.id] = 0
        })

        expenses.forEach((expense) => {
          const { category, amount, customSplits } = expense

          if (customSplits && customSplits.length > 0) {
            customSplits.forEach((split) => {
              userTotals[split.userId] =
                (userTotals[split.userId] || 0) + split.amount
            })
          } else if (category.splitType === "EQUAL") {
            const activeUserCount = users.length
            const equalShare = amount / activeUserCount
            users.forEach((user) => {
              userTotals[user.id] += equalShare
            })
          } else if (
            category.splitType === "CUSTOM" &&
            category.splits.length > 0
          ) {
            category.splits.forEach((split) => {
              const userShare = amount * (split.percentage / 100)
              userTotals[split.userId] =
                (userTotals[split.userId] || 0) + userShare
            })
          } else {
            const activeUserCount = users.length
            const equalShare = amount / activeUserCount
            users.forEach((user) => {
              userTotals[user.id] += equalShare
            })
          }
        })

        const paidByUser = expenses.reduce((acc, expense) => {
          const userId = expense.paidBy.id
          acc[userId] = (acc[userId] || 0) + expense.amount
          return acc
        }, {} as Record<string, number>)

        const balances = users.map((user) => {
          const paid = paidByUser[user.id] || 0
          const owes = userTotals[user.id] || 0

          return {
            userId: user.id,
            userName: user.name,
            paid,
            owes,
            balance: paid - owes,
          }
        })

        const settlementsToCreate: Array<{
          fromUserId: string
          toUserId: string
          amount: number
        }> = []
        const creditors = balances
          .filter((b) => b.balance > 0)
          .sort((a, b) => b.balance - a.balance)
        const debtors = balances
          .filter((b) => b.balance < 0)
          .sort((a, b) => a.balance - b.balance)

        let creditorIndex = 0
        let debtorIndex = 0

        while (
          creditorIndex < creditors.length &&
          debtorIndex < debtors.length
        ) {
          const creditor = creditors[creditorIndex]
          const debtor = debtors[debtorIndex]

          const amountToSettle = Math.min(
            creditor.balance,
            Math.abs(debtor.balance)
          )

          if (amountToSettle > 0.01) {
            settlementsToCreate.push({
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

        const settlement = await tx.monthlySettlement.upsert({
          where: { monthYear },
          update: {
            status: "CLOSED",
            closedAt: new Date(),
            settlements: {
              deleteMany: {},
              create: settlementsToCreate,
            },
          },
          create: {
            monthYear,
            status: "CLOSED",
            closedAt: new Date(),
            settlements: {
              create: settlementsToCreate,
            },
          },
          include: {
            settlements: true,
          },
        })

        const splits = users.reduce((acc, user) => {
          acc[user.name] = userTotals[user.id] || 0
          return acc
        }, {} as Record<string, number>)

        const totalExpenses = expenses.reduce(
          (sum, exp) => sum + exp.amount,
          0
        )
        const totalAirConditioning =
          airConditioningData?.reduce(
            (sum, ac) => sum + ac.calculatedAmount,
            0
          ) || 0

        return {
          settlement,
          balances,
          totals: {
            expenses: totalExpenses,
            airConditioning: totalAirConditioning,
            splits,
          },
        }
      },
      { isolationLevel: "Serializable" }
    )

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}
