"use client"

import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { CategoryForm } from "./category-form"

interface Category {
  id: string
  name: string
  splitType: "DEFAULT" | "CUSTOM"
  user1user2?: number
  user3?: number
}

interface CategoryEditButtonProps {
  category: Category
}

export function CategoryEditButton({ category }: CategoryEditButtonProps) {
  return (
    <CategoryForm
      category={category}
      onCategoryChanged={() => window.location.reload()}
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