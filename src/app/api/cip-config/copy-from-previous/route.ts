import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { z } from "zod"
import { handleApiError, AuthenticationError, ValidationError, NotFoundError, ConflictError } from "@/lib/errors"

const copyCipSchema = z.object({
  targetMonthYear: z.string().regex(/^\d{4}-\d{2}$/),
})

function getPreviousMonth(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number)
  const date = new Date(year, month - 2) // month - 1 for 0-indexed, then -1 for previous
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get("monthYear")

    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      throw new ValidationError("monthYear is required and must be YYYY-MM")
    }

    const previousMonth = getPreviousMonth(monthYear)

    const previousConfig = await prisma.cipConfiguration.findUnique({
      where: { monthYear: previousMonth },
      include: {
        tiers: {
          orderBy: { minKwh: "asc" },
        },
      },
    })

    if (!previousConfig) {
      return NextResponse.json({
        previousMonth,
        config: null,
      })
    }

    return NextResponse.json({
      previousMonth,
      config: {
        baseCalculationValue: previousConfig.baseCalculationValue,
        tiers: previousConfig.tiers.map((tier) => ({
          minKwh: tier.minKwh,
          maxKwh: tier.maxKwh,
          percentage: tier.percentage,
        })),
      },
    })
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
    const { targetMonthYear } = copyCipSchema.parse(body)

    const previousMonth = getPreviousMonth(targetMonthYear)

    const existingConfig = await prisma.cipConfiguration.findUnique({
      where: { monthYear: targetMonthYear },
    })

    if (existingConfig) {
      throw new ConflictError(
        "Configuração para este mês já existe. Delete a configuração atual antes de copiar."
      )
    }

    const previousConfig = await prisma.cipConfiguration.findUnique({
      where: { monthYear: previousMonth },
      include: {
        tiers: {
          orderBy: { minKwh: "asc" },
        },
      },
    })

    if (!previousConfig) {
      throw new NotFoundError("Nenhuma configuração encontrada no mês anterior")
    }

    const newConfig = await prisma.cipConfiguration.create({
      data: {
        monthYear: targetMonthYear,
        baseCalculationValue: previousConfig.baseCalculationValue,
        tiers: {
          create: previousConfig.tiers.map((tier) => ({
            minKwh: tier.minKwh,
            maxKwh: tier.maxKwh,
            percentage: tier.percentage,
          })),
        },
      },
      include: {
        tiers: {
          orderBy: { minKwh: "asc" },
        },
      },
    })

    return NextResponse.json(newConfig)
  } catch (error) {
    return handleApiError(error)
  }
}
