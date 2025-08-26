"use client"

import { useState } from "react"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Edit } from "lucide-react"
import { CategoryFormDialog } from "@/components/category-form-dialog"

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

interface CategoryFormProps {
  category?: Category
  trigger?: React.ReactNode
}

export function CategoryForm({ category, trigger }: CategoryFormProps) {
  const [open, setOpen] = useState(false)

  const isEdit = !!category

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Nova Categoria
    </Button>
  )

  const editTrigger = (
    <Button variant="ghost" size="sm" className="gap-2">
      <Edit className="h-4 w-4" />
      Editar
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (isEdit ? editTrigger : defaultTrigger)}
      </DialogTrigger>
      <CategoryFormDialog 
        category={category} 
        onClose={() => setOpen(false)} 
      />
    </Dialog>
  )
}