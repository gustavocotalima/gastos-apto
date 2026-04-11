import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { headers } from "next/headers"
import { handleApiError, AuthenticationError } from "@/lib/errors"

const expenseUpdateSchema = z.object({
  date: z.string().transform((str) => new Date(str)).optional(),
  amount: z.number().positive().max(1_000_000).optional(),
  description: z.string().min(1).max(500).optional(),
  categoryId: z.string().min(1).max(100).optional(),
  paidById: z.string().min(1).max(100).optional(),
  type: z.enum(['EXPENSE', 'CREDIT']).optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new AuthenticationError()
    }

    const { id } = await params
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
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      throw new AuthenticationError()
    }

    const { id } = await params

    await prisma.expense.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
