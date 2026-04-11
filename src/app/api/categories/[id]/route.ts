import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/errors"
import { headers } from "next/headers"

const updateCategorySchema = z.object({
  name: z.string().min(1),
  splitType: z.enum(["EQUAL", "CUSTOM"]),
  splits: z
    .array(
      z.object({
        userId: z.string().min(1),
        percentage: z.number().min(0).max(100),
      })
    )
    .optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const { id } = await params
    const body = await request.json()
    const data = updateCategorySchema.parse(body)

    if (data.splitType === "CUSTOM" && data.splits) {
      const total = data.splits.reduce((sum, split) => sum + split.percentage, 0)
      if (Math.abs(total - 100) > 0.01) {
        throw new ValidationError("Os percentuais devem somar 100%")
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        splitType: data.splitType,
      },
    })

    return NextResponse.json(category)
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
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const { id } = await params

    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    })

    if (expenseCount > 0) {
      throw new ValidationError(
        `Categoria está sendo usada por ${expenseCount} gasto(s)`
      )
    }

    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
