"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Expense {
  id: string
  date: string
  amount: number
  description: string
  category: {
    id: string
    name: string
  }
  paidBy: {
    id: string
    name: string
  }
}

interface ExpensesTableProps {
  expenses: Expense[]
  onExpenseDeleted: () => void
}

export function ExpensesTable({ expenses, onExpenseDeleted }: ExpensesTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este gasto?")) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Gasto excluído com sucesso!")
        onExpenseDeleted()
      } else {
        toast.error("Erro ao excluir gasto")
      }
    } catch (error) {
      toast.error("Erro ao excluir gasto")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum gasto encontrado para este mês.
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Pagador</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{formatDate(expense.date)}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {expense.description}
              </TableCell>
              <TableCell>{expense.category.name}</TableCell>
              <TableCell>{expense.paidBy.name}</TableCell>
              <TableCell className="text-right font-mono">
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}