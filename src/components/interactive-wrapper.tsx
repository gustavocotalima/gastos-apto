"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { ExpenseForm } from "./expense-form"
import { MonthSelector } from "./month-selector"
import { MonthSummary } from "./month-summary"

interface InteractiveWrapperProps {
  initialMonth: string
}

export function InteractiveWrapper({ initialMonth }: InteractiveWrapperProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleRefresh = async () => {
    setRefreshing(true)
    router.refresh()
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleExpenseAdded = () => {
    router.refresh()
  }

  const handleMonthChange = (monthYear: string) => {
    setSelectedMonth(monthYear)
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', monthYear)
    router.push(`/?${params.toString()}`)
  }

  const handleStatusChanged = () => {
    router.refresh()
  }

  return (
    <>
      {/* Month Navigation */}
      <MonthSelector 
        selectedMonth={selectedMonth} 
        onMonthChange={handleMonthChange} 
      />

      {/* Interactive Controls */}
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

      {/* Month Summary */}
      <MonthSummary 
        monthYear={selectedMonth} 
        onStatusChanged={handleStatusChanged}
      />
    </>
  )
}