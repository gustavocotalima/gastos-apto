"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ExpenseDeleteButtonProps {
  expenseId: string
}

export function ExpenseDeleteButton({ expenseId }: ExpenseDeleteButtonProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este gasto?")) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Gasto excluído com sucesso!")
        router.refresh() // Refresh the page to update the data
      } else {
        toast.error("Erro ao excluir gasto")
      }
    } catch (error) {
      toast.error("Erro ao excluir gasto")
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