import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  splitType: z.enum(["EQUAL", "CUSTOM"]),
  splits: z.array(z.object({
    userId: z.string(),
    percentage: z.number().min(0).max(100)
  })).optional()
})

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    console.error("Error fetching categories:", error)
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
    const validatedData = createCategorySchema.parse(body)

    // Validate custom splits if provided
    if (validatedData.splitType === "CUSTOM" && validatedData.splits) {
      const total = validatedData.splits.reduce((sum, split) => sum + split.percentage, 0)
      if (Math.abs(total - 100) > 0.01) {
        return NextResponse.json(
          { error: "Os percentuais devem somar 100%" },
          { status: 400 }
        )
      }
    }

    // Create category with splits in a transaction
    const category = await prisma.$transaction(async (tx) => {
      const newCategory = await tx.category.create({
        data: {
          name: validatedData.name,
          splitType: validatedData.splitType,
        },
      })

      // Create splits if custom type
      if (validatedData.splitType === "CUSTOM" && validatedData.splits) {
        await tx.categorySplit.createMany({
          data: validatedData.splits.map(split => ({
            categoryId: newCategory.id,
            userId: split.userId,
            percentage: split.percentage
          }))
        })
      }

      return newCategory
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues?.[0]
      const message = firstError?.message || "Dados inválidos"
      return NextResponse.json(
        { error: message },
        { status: 400 }
      )
    }

    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}