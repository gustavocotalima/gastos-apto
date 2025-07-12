import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const cipTierSchema = z.object({
  minKwh: z.number().min(0),
  maxKwh: z.number().min(0).nullable(),
  percentage: z.number().min(0).max(100),
})

const cipConfigSchema = z.object({
  monthYear: z.string().regex(/^\d{4}-\d{2}$/),
  baseCalculationValue: z.number().positive(),
  tiers: z.array(cipTierSchema).min(1),
})

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get("monthYear") || new Date().toISOString().slice(0, 7)

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
    console.error("Error fetching CIP config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = cipConfigSchema.parse(body)

    // Check if config for this month already exists
    const existingConfig = await prisma.cipConfiguration.findUnique({
      where: { monthYear: validatedData.monthYear },
    })

    if (existingConfig) {
      return NextResponse.json(
        { error: "Configuração para este mês já existe" },
        { status: 400 }
      )
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Error creating CIP config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}