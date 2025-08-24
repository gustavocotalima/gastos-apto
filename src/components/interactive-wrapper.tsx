"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { ExpenseForm } from "./expense-form"

export function InteractiveWrapper() {
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  const handleRefresh = async () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleExpenseAdded = () => {
    router.refresh()
  }

  return (
    <div className="flex gap-2">
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
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />
    </div>
  )
}