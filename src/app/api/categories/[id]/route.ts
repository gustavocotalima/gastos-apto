import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  try {
    const body = await request.json()
    
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        splitType: body.splitType,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
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
    // Check if category is being used by any expenses
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    })

    if (expenseCount > 0) {
      return NextResponse.json(
        { error: `Categoria está sendo usada por ${expenseCount} gasto(s)` },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}