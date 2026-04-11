import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/errors"
import { headers } from "next/headers"

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  splitType: z.enum(["EQUAL", "CUSTOM"]).default("EQUAL"),
  splits: z
    .array(
      z.object({
        userId: z.string().min(1).max(100),
        percentage: z.number().min(0).max(100),
      })
    )
    .max(20)
    .optional(),
})

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new AuthenticationError()
    }

    const categories = await prisma.category.findMany({
      include: {
        splits: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(categories)
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
    const data = categorySchema.parse(body)

    if (data.splitType === "CUSTOM" && data.splits) {
      const total = data.splits.reduce((sum, split) => sum + split.percentage, 0)
      if (Math.abs(total - 100) > 0.01) {
        throw new ValidationError("Os percentuais devem somar 100%")
      }
    }

    const category = await prisma.$transaction(async (tx) => {
      const newCategory = await tx.category.create({
        data: {
          name: data.name,
          splitType: data.splitType,
        },
      })

      if (data.splitType === "CUSTOM" && data.splits && data.splits.length > 0) {
        await tx.categorySplit.createMany({
          data: data.splits.map((split) => ({
            categoryId: newCategory.id,
            userId: split.userId,
            percentage: split.percentage,
          })),
        })
      }

      return await tx.category.findUnique({
        where: { id: newCategory.id },
        include: {
          splits: {
            include: {
              user: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
