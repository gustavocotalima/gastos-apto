"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { MonthSelector } from "./month-selector"

interface MonthNavigationProps {
  initialMonth: string
}

export function MonthNavigation({ initialMonth }: MonthNavigationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleMonthChange = (monthYear: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', monthYear)
    router.push(`/?${params.toString()}`)
  }

  return (
    <MonthSelector 
      selectedMonth={initialMonth} 
      onMonthChange={handleMonthChange} 
    />
  )
}