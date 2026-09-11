"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"
import {
  getBillingCycleEndDate,
  getBillingCycleStartDate,
  getCurrentBillingMonthYear,
  shiftMonthYear,
} from "@/lib/billing-cycle"

interface MonthSelectorSimpleProps {
  selectedMonth: string
  onMonthChange: (monthYear: string) => void
  billingCycleStartDay: number
}

export function MonthSelectorSimple({
  selectedMonth,
  onMonthChange,
  billingCycleStartDay,
}: MonthSelectorSimpleProps) {
  const formatMonthDisplay = (monthYear: string) => {
    const [year, month] = monthYear.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("pt-BR", { 
      month: "long", 
      year: "numeric" 
    })
  }

  const formatCycleRange = (monthYear: string) => {
    const formatDate = (date: Date) =>
      date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        timeZone: "UTC",
      })

    const start = getBillingCycleStartDate(monthYear, billingCycleStartDay)
    const end = getBillingCycleEndDate(monthYear, billingCycleStartDay)
    return `${formatDate(start)}–${formatDate(end)}`
  }

  // Generate last 12 months for selection
  const generateMonths = () => {
    const months = []
    const currentMonth = getCurrentBillingMonthYear(billingCycleStartDay)
    
    for (let i = 0; i < 12; i++) {
      months.push(shiftMonthYear(currentMonth, -i))
    }
    
    return months
  }

  const availableMonths = generateMonths()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Navegação Mensal
        </CardTitle>
        <CardDescription>
          Selecione o mês para visualizar os gastos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={selectedMonth} onValueChange={onMonthChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um mês" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map((monthYear) => (
              <SelectItem key={monthYear} value={monthYear}>
                {formatMonthDisplay(monthYear)}
                {billingCycleStartDay > 1
                  ? ` (${formatCycleRange(monthYear)})`
                  : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
