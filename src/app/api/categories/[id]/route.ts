import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  splitType: z.enum(["EQUAL", "CUSTOM"]).optional(),
  splits: z.array(z.object({
    userId: z.string(),
    percentage: z.number().min(0).max(100)
  })).optional()
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = categoryUpdateSchema.parse(body)

    // Validate that custom split percentages add up to 100
    if (validatedData.splitType === "CUSTOM" && validatedData.splits) {
      const total = validatedData.splits.reduce((sum, split) => sum + split.percentage, 0)
      if (Math.abs(total - 100) > 0.01) {
        return NextResponse.json(
          { error: "Os percentuais devem somar 100%" },
          { status: 400 }
        )
      }
    }

    // Update category and splits in a transaction
    const category = await prisma.$transaction(async (tx) => {
      // Update the category
      await tx.category.update({
        where: { id },
        data: {
          name: validatedData.name,
          splitType: validatedData.splitType,
        },
      })

      // If splits are provided, update them
      if (validatedData.splitType === "CUSTOM" && validatedData.splits) {
        // Delete existing splits
        await tx.categorySplit.deleteMany({
          where: { categoryId: id }
        })

        // Create new splits
        await tx.categorySplit.createMany({
          data: validatedData.splits.map(split => ({
            categoryId: id,
            userId: split.userId,
            percentage: split.percentage
          }))
        })
      } else if (validatedData.splitType === "EQUAL") {
        // If changing to EQUAL, remove all custom splits
        await tx.categorySplit.deleteMany({
          where: { categoryId: id }
        })
      }

      // Return category with splits
      return await tx.category.findUnique({
        where: { id },
        include: {
          splits: {
            include: {
              user: { select: { id: true, name: true } }
            }
          }
        }
      })
    })

    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Dados inválidos", 
        details: error.issues.map(e => e.message).join(", ")
      }, { status: 400 })
    }
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if category is being used by any expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    })

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir categoria que possui gastos associados" },
        { status: 400 }
      )
    }

    // Delete category and its splits in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete splits first
      await tx.categorySplit.deleteMany({
        where: { categoryId: id }
      })

      // Delete category
      await tx.category.delete({
        where: { id },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}