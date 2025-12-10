import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { headers } from "next/headers"

const expenseUpdateSchema = z.object({
  date: z.string().transform((str) => new Date(str)).optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  paidById: z.string().optional(),
  type: z.enum(['EXPENSE', 'CREDIT']).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = expenseUpdateSchema.parse(body)

    const updatedData: {
      date?: Date
      amount?: number
      description?: string
      categoryId?: string
      paidById?: string
      type?: 'EXPENSE' | 'CREDIT'
      monthYear?: string
    } = { ...validatedData }
    if (validatedData.date) {
      updatedData.monthYear = validatedData.date.toISOString().slice(0, 7)
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: updatedData,
      include: {
        category: true,
        paidBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(expense)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Error updating expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
