import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"

function getPreviousMonth(monthYear: string): string {
  const [year, month] = monthYear.split("-").map(Number)
  const date = new Date(year, month - 2) // month - 1 for 0-indexed, then -1 for previous
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get("monthYear")

    if (!monthYear) {
      return NextResponse.json({ error: "monthYear is required" }, { status: 400 })
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
    console.error("Error fetching previous CIP config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { targetMonthYear } = body as { targetMonthYear: string }

    if (!targetMonthYear) {
      return NextResponse.json({ error: "targetMonthYear is required" }, { status: 400 })
    }

    const previousMonth = getPreviousMonth(targetMonthYear)

    // Check if config already exists for target month
    const existingConfig = await prisma.cipConfiguration.findUnique({
      where: { monthYear: targetMonthYear },
    })

    if (existingConfig) {
      return NextResponse.json(
        { error: "Configuração para este mês já existe. Delete a configuração atual antes de copiar." },
        { status: 400 }
      )
    }

    // Get previous month config
    const previousConfig = await prisma.cipConfiguration.findUnique({
      where: { monthYear: previousMonth },
      include: {
        tiers: {
          orderBy: { minKwh: "asc" },
        },
      },
    })

    if (!previousConfig) {
      return NextResponse.json(
        { error: "Nenhuma configuração encontrada no mês anterior" },
        { status: 404 }
      )
    }

    // Create new config with copied data
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
    console.error("Error copying CIP config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
