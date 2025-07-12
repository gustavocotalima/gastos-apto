"use client"

import { useRouter } from "next/navigation"
import { CategoryForm } from "./category-form"

export function CategoryFormWrapper() {
  const router = useRouter()

  const handleCategoryChanged = () => {
    router.refresh()
  }

  return <CategoryForm onCategoryChanged={handleCategoryChanged} />
}