import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const categorySchema = z.object({
  name: z.string().min(1),
  splitType: z.enum(["DEFAULT", "CUSTOM"]),
  user1user2: z.number().min(0).max(100).optional(),
  user3: z.number().min(0).max(100).optional(),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.category.findMany({
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
    const validatedData = categorySchema.parse(body)

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

    const category = await prisma.category.create({
      data: validatedData,
    })

    return NextResponse.json(category)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 })
    }
    console.error("Error creating category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}