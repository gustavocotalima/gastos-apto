import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
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
    const body = await request.json()
    
    // Basic validation without zod
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }

    // Validate custom splits if provided
    if (body.splitType === "CUSTOM" && body.splits) {
      const total = body.splits.reduce((sum: number, split: any) => sum + split.percentage, 0)
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
          name: body.name,
          splitType: body.splitType || "EQUAL",
        },
      })

      // Create splits if custom type
      if (body.splitType === "CUSTOM" && body.splits && body.splits.length > 0) {
        await tx.categorySplit.createMany({
          data: body.splits.map((split: any) => ({
            categoryId: newCategory.id,
            userId: split.userId,
            percentage: split.percentage
          }))
        })
      }

      // Return the category with splits
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
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}