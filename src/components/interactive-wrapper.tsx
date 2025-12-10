"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { ExpenseForm } from "./expense-form"
import { CopyExpensesDialog } from "./copy-expenses-dialog"

export function InteractiveWrapper() {
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentMonthYear = searchParams.get("month") || new Date().toISOString().slice(0, 7)

  const handleRefresh = async () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleExpenseAdded = () => {
    router.refresh()
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRefresh}
        disabled={refreshing}
        className="gap-2"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
      <CopyExpensesDialog
        currentMonthYear={currentMonthYear}
        onExpensesCopied={handleExpenseAdded}
      />
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />
    </div>
  )
}