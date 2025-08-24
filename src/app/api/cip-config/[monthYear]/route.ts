import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const cipTierSchema = z.object({
  minKwh: z.number().min(0),
  maxKwh: z.number().min(0).nullable(),
  percentage: z.number().min(0).max(100),
})

const cipConfigUpdateSchema = z.object({
  baseCalculationValue: z.number().positive().optional(),
  tiers: z.array(cipTierSchema).min(1).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ monthYear: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = cipConfigUpdateSchema.parse(body)

    // Update the configuration
    const updateData: { baseCalculationValue?: number } = {}
    if (validatedData.baseCalculationValue !== undefined) {
      updateData.baseCalculationValue = validatedData.baseCalculationValue
    }

    const { monthYear } = await params

    const config = await prisma.cipConfiguration.update({
      where: { monthYear },
      data: updateData,
      include: {
        tiers: {
          orderBy: { minKwh: "asc" },
        },
      },
    })

    // If tiers are provided, replace them
    if (validatedData.tiers) {
      // Delete existing tiers
      await prisma.cipTier.deleteMany({
        where: { configurationId: config.id },
      })

      // Create new tiers
      await prisma.cipTier.createMany({
        data: validatedData.tiers.map((tier) => ({
          ...tier,
          configurationId: config.id,
        })),
      })
    }

    // Fetch updated config with tiers
    const updatedConfig = await prisma.cipConfiguration.findUnique({
      where: { monthYear },
      include: {
        tiers: {
          orderBy: { minKwh: "asc" },
        },
      },
    })

    return NextResponse.json(updatedConfig)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Error updating CIP config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}