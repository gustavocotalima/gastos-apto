"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

interface MonthSelectorSimpleProps {
  selectedMonth: string
  onMonthChange: (monthYear: string) => void
}

export function MonthSelectorSimple({ selectedMonth, onMonthChange }: MonthSelectorSimpleProps) {
  const formatMonthDisplay = (monthYear: string) => {
    const [year, month] = monthYear.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("pt-BR", { 
      month: "long", 
      year: "numeric" 
    })
  }

  // Generate last 12 months for selection
  const generateMonths = () => {
    const months = []
    const now = new Date()
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthYear = date.toISOString().slice(0, 7)
      months.push(monthYear)
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
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}