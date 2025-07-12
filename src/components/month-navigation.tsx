"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { MonthSelectorSimple } from "./month-selector-simple"
import { useCallback } from "react"

interface MonthNavigationProps {
  initialMonth: string
}

export function MonthNavigation({ initialMonth }: MonthNavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleMonthChange = useCallback((monthYear: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', monthYear)
    router.push(`/?${params.toString()}`)
  }, [router, searchParams])

  return (
    <MonthSelectorSimple 
      selectedMonth={initialMonth} 
      onMonthChange={handleMonthChange} 
    />
  )
}