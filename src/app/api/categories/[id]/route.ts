import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  splitType: z.enum(["DEFAULT", "CUSTOM"]).optional(),
  user1user2: z.number().min(0).max(100).optional(),
  user3: z.number().min(0).max(100).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = categoryUpdateSchema.parse(body)

    // Validate that custom split percentages add up to 100
    if (validatedData.splitType === "CUSTOM") {
      const user1user2 = validatedData.user1user2 || 0
      const user3 = validatedData.user3 || 0
      
      if (Math.abs(user1user2 + user3 - 100) > 0.01) {
        return NextResponse.json(
          { error: "Percentuais devem somar 100%" },
          { status: 400 }
        )
      }
    }

    // If changing to DEFAULT, clear custom percentages
    const updateData = { ...validatedData }
    if (validatedData.splitType === "DEFAULT") {
      updateData.user1user2 = null
      updateData.user3 = null
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Error updating category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if category is being used by any expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: params.id },
    })

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir categoria que possui gastos associados" },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}