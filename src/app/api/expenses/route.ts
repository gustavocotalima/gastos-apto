import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getPaginationParams, createPaginatedResponse, getPrismaSkipTake } from "@/lib/pagination"
import { handleApiError, AuthenticationError } from "@/lib/errors"
import { headers } from "next/headers"

const expenseSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  amount: z.number().positive().max(1_000_000),
  description: z.string().min(1).max(500),
  categoryId: z.string().min(1).max(100),
  paidById: z.string().min(1).max(100),
})

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get("monthYear") || new Date().toISOString().slice(0, 7)
    const paginationParams = getPaginationParams(searchParams)
    const { skip, take } = getPrismaSkipTake(paginationParams)

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: { monthYear },
        include: {
          category: true,
          paidBy: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        skip,
        take,
      }),
      prisma.expense.count({ where: { monthYear } })
    ])

    const response = createPaginatedResponse(expenses, total, paginationParams)
    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })
    if (!session?.user?.id) {
      throw new AuthenticationError()
    }

    const body = await request.json()
    const validatedData = expenseSchema.parse(body)

    const monthYear = validatedData.date.toISOString().slice(0, 7)

    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        monthYear,
      },
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
