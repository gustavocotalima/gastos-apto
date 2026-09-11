import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { headers } from "next/headers"
import {
  handleApiError,
  AuthenticationError,
  ConflictError,
} from "@/lib/errors"
import { getBillingCycleStartDay } from "@/lib/billing-cycle-settings"
import { getCurrentBillingMonthYear } from "@/lib/billing-cycle"

const cipTierSchema = z.object({
  minKwh: z.number().min(0).max(100_000),
  maxKwh: z.number().min(0).max(100_000).nullable(),
  percentage: z.number().min(0).max(100),
})

const cipConfigSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  baseCalculationValue: z.number().positive().max(1_000_000),
  tiers: z.array(cipTierSchema).min(1).max(50),
})

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const requestedMonth = searchParams.get("monthYear")
    const monthYear = requestedMonth || getCurrentBillingMonthYear(
      await getBillingCycleStartDay()
    )

    const config = await prisma.cipConfiguration.findUnique({
      where: { monthYear },
      include: {
        tiers: {
          orderBy: { minKwh: "asc" },
        },
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    const validatedData = cipConfigSchema.parse(body)

    const existingConfig = await prisma.cipConfiguration.findUnique({
      where: { monthYear: validatedData.monthYear },
    })

    if (existingConfig) {
      throw new ConflictError("Configuração para este mês já existe")
    }

    const config = await prisma.cipConfiguration.create({
      data: {
        monthYear: validatedData.monthYear,
        baseCalculationValue: validatedData.baseCalculationValue,
        tiers: {
          create: validatedData.tiers,
        },
      },
      include: {
        tiers: {
          orderBy: { minKwh: "asc" },
        },
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    return handleApiError(error)
  }
}
