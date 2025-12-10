"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { ExpenseForm } from "./expense-form"
import { useRouter } from "next/navigation"

interface Expense {
  id: string
  date: string
  amount: number
  description: string
  type?: 'EXPENSE' | 'CREDIT'
  category: {
    id: string
    name: string
  }
  paidBy: {
    id: string
    name: string
  }
}

interface ExpenseEditButtonProps {
  expense: Expense
}

export function ExpenseEditButton({ expense }: ExpenseEditButtonProps) {
  const router = useRouter()

  const handleEditComplete = () => {
    router.refresh()
  }

  return (
    <ExpenseForm
      editingExpense={{
        id: expense.id,
        date: expense.date,
        amount: expense.amount,
        description: expense.description,
        categoryId: expense.category.id,
        paidById: expense.paidBy.id,
        type: expense.type || 'EXPENSE',
      }}
      onExpenseAdded={handleEditComplete}
      onEditComplete={handleEditComplete}
    />
  )
}