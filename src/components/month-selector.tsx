"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Calendar, Lock, Unlock } from "lucide-react"

interface MonthData {
  monthYear: string
  totalAmount: number
  expenseCount: number
  airConditioningAmount: number
  airConsumption: number
  status: "OPEN" | "CLOSED"
  closedAt?: string | null
}

interface MonthSelectorProps {
  selectedMonth: string
  onMonthChange: (monthYear: string) => void
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const [months, setMonths] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchMonths()
  }, [])

  const fetchMonths = async () => {
    try {
      const response = await fetch("/api/months")
      if (response.ok) {
        const data = await response.json()
        setMonths(data)
      }
    } catch (error) {
      console.error("Error fetching months:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatMonthDisplay = (monthYear: string) => {
    const [year, month] = monthYear.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("pt-BR", { 
      month: "long", 
      year: "numeric" 
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const getCurrentMonthIndex = () => {
    return months.findIndex(month => month.monthYear === selectedMonth)
  }

  const navigateMonth = (direction: "prev" | "next") => {
    const currentIndex = getCurrentMonthIndex()
    if (direction === "prev" && currentIndex < months.length - 1) {
      onMonthChange(months[currentIndex + 1].monthYear)
    } else if (direction === "next" && currentIndex > 0) {
      onMonthChange(months[currentIndex - 1].monthYear)
    }
  }

  const selectedMonthData = months.find(month => month.monthYear === selectedMonth)

  if (!mounted || loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando histórico...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Navegação Mensal
        </CardTitle>
        <CardDescription>
          Navegue entre os meses com gastos registrados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("prev")}
            disabled={getCurrentMonthIndex() >= months.length - 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select value={selectedMonth} onValueChange={onMonthChange}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.monthYear} value={month.monthYear}>
                  {`${formatMonthDisplay(month.monthYear)}${month.status === "CLOSED" ? " 🔒" : ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateMonth("next")}
            disabled={getCurrentMonthIndex() <= 0}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Month Summary */}
        {selectedMonthData && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{formatMonthDisplay(selectedMonth)}</h3>
              <Badge variant={selectedMonthData.status === "CLOSED" ? "secondary" : "outline"}>
                {selectedMonthData.status === "CLOSED" ? (
                  <><Lock className="h-3 w-3 mr-1" /> Fechado</>
                ) : (
                  <><Unlock className="h-3 w-3 mr-1" /> Aberto</>
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total de Gastos</div>
                <div className="font-mono">{formatCurrency(selectedMonthData.totalAmount)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Quantidade</div>
                <div>{selectedMonthData.expenseCount} gastos</div>
              </div>
              {selectedMonthData.airConditioningAmount > 0 && (
                <>
                  <div>
                    <div className="text-muted-foreground">Ar Condicionado</div>
                    <div className="font-mono">{formatCurrency(selectedMonthData.airConditioningAmount)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Consumo AC</div>
                    <div>{selectedMonthData.airConsumption} kWh</div>
                  </div>
                </>
              )}
            </div>

            {selectedMonthData.closedAt && (
              <div className="text-xs text-muted-foreground">
                Fechado em {new Date(selectedMonthData.closedAt).toLocaleDateString("pt-BR")}
              </div>
            )}
          </div>
        )}

        {months.length === 0 && (
          <div className="text-center text-muted-foreground py-4">
            Nenhum gasto encontrado ainda.
          </div>
        )}
      </CardContent>
    </Card>
  )
}