import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { headers } from "next/headers"
import { handleApiError, AuthenticationError } from "@/lib/errors"

const cipTierSchema = z.object({
  minKwh: z.number().min(0).max(100_000),
  maxKwh: z.number().min(0).max(100_000).nullable(),
  percentage: z.number().min(0).max(100),
})

const cipConfigUpdateSchema = z.object({
  baseCalculationValue: z.number().positive().max(1_000_000).optional(),
  tiers: z.array(cipTierSchema).min(1).max(50).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ monthYear: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    const validatedData = cipConfigUpdateSchema.parse(body)

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

    if (validatedData.tiers) {
      await prisma.cipTier.deleteMany({
        where: { configurationId: config.id },
      })

      await prisma.cipTier.createMany({
        data: validatedData.tiers.map((tier) => ({
          ...tier,
          configurationId: config.id,
        })),
      })
    }

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
    return handleApiError(error)
  }
}
