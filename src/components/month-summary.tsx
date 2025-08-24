"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Lock, Unlock, Calculator, TrendingUp, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface Balance {
  userId: string
  userName: string
  paid: number
  owes: number
  balance: number
}

interface Settlement {
  fromUserId: string
  toUserId: string
  amount: number
}

interface User {
  id: string
  name: string
  email: string
}

interface MonthSummaryData {
  monthYear: string
  totalExpenses: number
  expenseCount: number
  airConditioningAmount: number
  splits: Record<string, number>
  balances: Balance[]
  settlement?: {
    status: "OPEN" | "CLOSED"
    settlements: Settlement[]
    closedAt?: string
  }
  status: "OPEN" | "CLOSED"
  activeUsers?: User[]
}

interface MonthSummaryProps {
  monthYear: string
  onStatusChanged?: () => void
}

export function MonthSummary({ monthYear, onStatusChanged }: MonthSummaryProps) {
  const [data, setData] = useState<MonthSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [closing, setClosing] = useState(false)

  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`/api/months/${monthYear}/summary`)
      if (response.ok) {
        const summaryData = await response.json()
        setData(summaryData)
      }
    } catch (error) {
      console.error("Error fetching summary:", error)
    } finally {
      setLoading(false)
    }
  }, [monthYear])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const handleCloseMonth = async () => {
    if (!confirm("Tem certeza que deseja fechar este mês? Esta ação não pode ser desfeita.")) {
      return
    }

    setClosing(true)
    try {
      const response = await fetch(`/api/months/${monthYear}/close`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Mês fechado com sucesso!")
        await fetchSummary()
        onStatusChanged?.()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao fechar mês")
      }
    } catch (error) {
      toast.error("Erro ao fechar mês")
    } finally {
      setClosing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const getMonthDisplay = (monthYear: string) => {
    const [year, month] = monthYear.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("pt-BR", { 
      month: "long", 
      year: "numeric" 
    })
  }

  const getUserName = (userId: string) => {
    return data?.balances.find(b => b.userId === userId)?.userName || "Usuário"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando resumo...</div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Nenhum dado encontrado para este mês.
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalAmount = data.totalExpenses + data.airConditioningAmount

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Resumo de {getMonthDisplay(monthYear)}
            </CardTitle>
            <CardDescription>
              Divisão dos gastos e acerto de contas
            </CardDescription>
          </div>
          <Badge variant={data.status === "CLOSED" ? "secondary" : "outline"}>
            {data.status === "CLOSED" ? (
              <><Lock className="h-3 w-3 mr-1" /> Fechado</>
            ) : (
              <><Unlock className="h-3 w-3 mr-1" /> Aberto</>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatCurrency(data.totalExpenses)}</div>
            <div className="text-sm text-muted-foreground">Total de Gastos</div>
            <div className="text-xs text-muted-foreground">{data.expenseCount} gastos</div>
          </div>
          {data.airConditioningAmount > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(data.airConditioningAmount)}</div>
              <div className="text-sm text-muted-foreground">Ar Condicionado</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-sm text-muted-foreground">Total Geral</div>
          </div>
        </div>

        <Separator />

        {/* Individual Splits */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Divisão Individual
          </h3>
          <div className={`grid grid-cols-1 md:grid-cols-${Object.keys(data.splits).length} gap-4`}>
            {Object.entries(data.splits).map(([userName, amount]) => (
              <div key={userName} className="text-center p-3 bg-muted rounded-lg">
                <div className="font-bold">{formatCurrency(amount)}</div>
                <div className="text-sm text-muted-foreground">{userName}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Balances */}
        {data.balances.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium mb-3">Saldos (Pago vs Deve)</h3>
              <div className="space-y-2">
                {data.balances.map((balance) => (
                  <div key={balance.userId} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div>
                      <div className="font-medium">{balance.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        Pagou: {formatCurrency(balance.paid)} • Deve: {formatCurrency(balance.owes)}
                      </div>
                    </div>
                    <div className={`font-bold ${balance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {balance.balance >= 0 ? '+' : ''}{formatCurrency(balance.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Settlements */}
        {data.settlement?.settlements && data.settlement.settlements.length > 0 && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Acerto de Contas
              </h3>
              <div className="space-y-2">
                {data.settlement.settlements.map((settlement, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{getUserName(settlement.fromUserId)}</span>
                      <span className="text-muted-foreground"> deve transferir para </span>
                      <span className="font-medium">{getUserName(settlement.toUserId)}</span>
                    </div>
                    <div className="font-bold text-orange-600">
                      {formatCurrency(settlement.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Close Month Button */}
        {data.status === "OPEN" && (
          <>
            <Separator />
            <div className="text-center">
              <Button 
                onClick={handleCloseMonth} 
                disabled={closing}
                className="gap-2"
                size="lg"
              >
                <Lock className="h-4 w-4" />
                {closing ? "Fechando..." : "Fechar Mês"}
              </Button>
              <div className="text-xs text-muted-foreground mt-2">
                Ao fechar o mês, não será possível adicionar ou editar gastos
              </div>
            </div>
          </>
        )}

        {data.settlement?.closedAt && (
          <div className="text-center text-xs text-muted-foreground">
            Fechado em {new Date(data.settlement.closedAt).toLocaleDateString("pt-BR")} às{" "}
            {new Date(data.settlement.closedAt).toLocaleTimeString("pt-BR")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}