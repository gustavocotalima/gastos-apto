"use client"

import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { CategoryForm } from "./category-form"
import { useRouter } from "next/navigation"

interface CategorySplit {
  userId: string
  percentage: number
  user: {
    name: string
  }
}

interface Category {
  id: string
  name: string
  splitType: "EQUAL" | "CUSTOM"
  splits?: CategorySplit[]
}

interface CategoryEditButtonProps {
  category: Category
}

export function CategoryEditButton({ category }: CategoryEditButtonProps) {
  const router = useRouter()

  const handleCategoryChanged = () => {
    router.refresh()
  }

  return (
    <CategoryForm
      category={category}
      onCategoryChanged={handleCategoryChanged}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
      }
    />
  )
}