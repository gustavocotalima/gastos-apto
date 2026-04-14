import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { headers } from "next/headers"
import {
  handleApiError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "@/lib/errors"

const airConditioningSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  airConsumptionKwh: z.number().min(0).max(100_000),
  totalConsumptionKwh: z.number().positive().max(100_000),
  totalBillAmount: z.number().positive().max(1_000_000),
  kwhUnitPrice: z.number().positive().max(100),
  totalCipAmount: z.number().min(0).max(1_000_000),
  paidById: z.string().min(1).max(100),
})

function findCipTierPercentage(
  tiers: Array<{ minKwh: number; maxKwh: number | null; percentage: number }>,
  consumption: number
): number {
  const rounded = Math.round(consumption)
  for (const tier of tiers) {
    if (tier.maxKwh === null) {
      if (rounded >= tier.minKwh) return tier.percentage
    } else {
      if (rounded >= tier.minKwh && rounded <= tier.maxKwh) return tier.percentage
    }
  }
  return 0
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get("monthYear") || new Date().toISOString().slice(0, 7)

    const usage = await prisma.airConditioningUsage.findFirst({
      where: { monthYear, userId: session.user.id },
      include: {
        paidBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(usage)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    const validatedData = airConditioningSchema.parse(body)

    if (validatedData.airConsumptionKwh > validatedData.totalConsumptionKwh) {
      throw new ValidationError(
        "Consumo do ar condicionado não pode ser maior que o consumo total"
      )
    }

    const cipConfig = await prisma.cipConfiguration.findUnique({
      where: { monthYear: validatedData.monthYear },
      include: { tiers: { orderBy: { minKwh: "asc" } } },
    })

    if (!cipConfig) {
      throw new NotFoundError("Configuração CIP para este mês")
    }

    const consumptionWithoutAir =
      validatedData.totalConsumptionKwh - validatedData.airConsumptionKwh

    const cipTierWithoutAir = findCipTierPercentage(cipConfig.tiers, consumptionWithoutAir)
    const cipTierWithAir = findCipTierPercentage(cipConfig.tiers, validatedData.totalConsumptionKwh)
    const cipWithoutAirAmount = (cipTierWithoutAir / 100) * cipConfig.baseCalculationValue
    const cipDifference = Math.max(validatedData.totalCipAmount - cipWithoutAirAmount, 0)

    const acEnergyCost = validatedData.airConsumptionKwh * validatedData.kwhUnitPrice
    const acExtraCost = acEnergyCost + cipDifference
    const calculatedAmount = acExtraCost

    if (acExtraCost > validatedData.totalBillAmount) {
      throw new ValidationError(
        "Custo calculado do ar condicionado excede o valor total da conta"
      )
    }

    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    })

    const nonAcPortion = validatedData.totalBillAmount - acExtraCost
    const perUserShare = nonAcPortion / activeUsers.length

    let electricityCategory = await prisma.category.findFirst({
      where: { name: { in: ["Electricity", "Energia Elétrica", "Energia"] } },
    })
    if (!electricityCategory) {
      electricityCategory = await prisma.category.create({
        data: { name: "Energia Elétrica", splitType: "CUSTOM" },
      })
    }

    const existingUsage = await prisma.airConditioningUsage.findFirst({
      where: { monthYear: validatedData.monthYear, userId: session.user.id },
    })

    const result = await prisma.$transaction(async (tx) => {
      const customSplits = activeUsers.map((user) => ({
        userId: user.id,
        amount:
          user.id === session.user.id
            ? perUserShare + acExtraCost
            : perUserShare,
      }))

      const expenseData = {
        date: new Date(validatedData.monthYear + "-01"),
        amount: validatedData.totalBillAmount,
        description: "Conta de Energia",
        categoryId: electricityCategory.id,
        paidById: validatedData.paidById,
        monthYear: validatedData.monthYear,
        type: "EXPENSE" as const,
      }

      let expense
      if (existingUsage?.expenseId) {
        await tx.expenseSplit.deleteMany({
          where: { expenseId: existingUsage.expenseId },
        })
        expense = await tx.expense.update({
          where: { id: existingUsage.expenseId },
          data: {
            ...expenseData,
            customSplits: { create: customSplits },
          },
        })
      } else {
        expense = await tx.expense.create({
          data: {
            ...expenseData,
            customSplits: { create: customSplits },
          },
        })
      }

      const acData = {
        ...validatedData,
        calculatedAmount,
        cipTierWithoutAir,
        cipTierWithAir,
        cipWithoutAirAmount,
        acExtraCost,
        userId: session.user.id,
        expenseId: expense.id,
      }

      let usage
      if (existingUsage) {
        usage = await tx.airConditioningUsage.update({
          where: { id: existingUsage.id },
          data: acData,
          include: { paidBy: { select: { id: true, name: true } } },
        })
      } else {
        usage = await tx.airConditioningUsage.create({
          data: acData,
          include: { paidBy: { select: { id: true, name: true } } },
        })
      }

      return usage
    })

    return NextResponse.json(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const monthYear =
      searchParams.get("monthYear") || new Date().toISOString().slice(0, 7)

    const usage = await prisma.airConditioningUsage.findFirst({
      where: { monthYear, userId: session.user.id },
    })

    if (!usage) {
      throw new NotFoundError("Registro de ar condicionado")
    }

    await prisma.$transaction(async (tx) => {
      if (usage.expenseId) {
        await tx.expense.delete({ where: { id: usage.expenseId } })
      }
      await tx.airConditioningUsage.delete({ where: { id: usage.id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
