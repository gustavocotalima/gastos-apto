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
})

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get("monthYear") || new Date().toISOString().slice(0, 7)

    const usage = await prisma.airConditioningUsage.findFirst({
      where: {
        monthYear,
        userId: session.user.id,
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
      include: {
        tiers: {
          orderBy: { minKwh: "asc" },
        },
      },
    })

    if (!cipConfig) {
      throw new NotFoundError("Configuração CIP para este mês")
    }

    // Calculate consumption without air conditioning
    const consumptionWithoutAir = validatedData.totalConsumptionKwh - validatedData.airConsumptionKwh

    // Find CIP tiers for both scenarios
    const findCipTier = (consumption: number) => {
      for (const tier of cipConfig.tiers) {
        if (tier.maxKwh === null) {
          // Last tier (above X kWh)
          if (consumption >= tier.minKwh) {
            return tier.percentage
          }
        } else {
          // Regular tier (between min and max)
          if (consumption >= tier.minKwh && consumption <= tier.maxKwh) {
            return tier.percentage
          }
        }
      }
      return 0 // Should not happen if tiers are configured correctly
    }

    const cipTierWithoutAir = findCipTier(consumptionWithoutAir)
    const cipTierWithAir = findCipTier(validatedData.totalConsumptionKwh)

    // Calculate how much the current user should pay
    let calculatedAmount = 0

    // 1. Pay for the proportional air conditioning consumption
    const airCost = validatedData.airConsumptionKwh * validatedData.kwhUnitPrice
    calculatedAmount += airCost

    // 2. If CIP tier changed, pay the difference
    if (cipTierWithAir > cipTierWithoutAir) {
      const cipDifference = (cipTierWithAir - cipTierWithoutAir) / 100
      const cipIncrease = cipDifference * cipConfig.baseCalculationValue
      calculatedAmount += cipIncrease
    }

    // Check if usage already exists for this month
    const existingUsage = await prisma.airConditioningUsage.findFirst({
      where: { 
        monthYear: validatedData.monthYear,
        userId: session.user.id,
      },
    })

    let usage
    if (existingUsage) {
      // Update existing usage
      usage = await prisma.airConditioningUsage.update({
        where: { id: existingUsage.id },
        data: {
          ...validatedData,
          calculatedAmount,
          cipTierWithoutAir,
          cipTierWithAir,
          userId: session.user.id,
        },
      })
    } else {
      // Create new usage
      usage = await prisma.airConditioningUsage.create({
        data: {
          ...validatedData,
          calculatedAmount,
          cipTierWithoutAir,
          cipTierWithAir,
          userId: session.user.id,
        },
      })
    }

    return NextResponse.json(usage)
  } catch (error) {
    return handleApiError(error)
  }
}