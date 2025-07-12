"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CategoryDeleteButtonProps {
  categoryId: string
  categoryName: string
}

export function CategoryDeleteButton({ categoryId, categoryName }: CategoryDeleteButtonProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Categoria excluída com sucesso!")
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao excluir categoria")
      }
    } catch (error) {
      toast.error("Erro ao excluir categoria")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="h-8 w-8 p-0"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}