"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calculator, Zap } from "lucide-react"
import { toast } from "sonner"
import { useSession } from "@/lib/auth-client"

interface AirConditioningData {
  id?: string
  monthYear: string
  airConsumptionKwh: number
  totalConsumptionKwh: number
  totalBillAmount: number
  kwhUnitPrice: number
  totalCipAmount: number
  calculatedAmount?: number
  acExtraCost?: number
  cipWithoutAirAmount?: number
  cipTierWithoutAir?: number
  cipTierWithAir?: number
  paidById?: string
  paidBy?: { id: string; name: string }
}

interface SimpleUser {
  id: string
  name: string
}

interface AirConditioningFormProps {
  monthYear?: string
  onCalculated?: (data: AirConditioningData) => void
}

export function AirConditioningForm({ monthYear, onCalculated }: AirConditioningFormProps) {
  const { data: session } = useSession()
  const userName = session?.user?.name ?? "você"
  const [isLoading, setIsLoading] = useState(false)
  const [existingData, setExistingData] = useState<AirConditioningData | null>(null)
  const [users, setUsers] = useState<SimpleUser[]>([])

  const currentMonth = monthYear || new Date().toISOString().slice(0, 7)
  const [airConsumption, setAirConsumption] = useState("")
  const [totalConsumption, setTotalConsumption] = useState("")
  const [totalBill, setTotalBill] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [totalCip, setTotalCip] = useState("")
  const [paidById, setPaidById] = useState("")

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }, [])

  const fetchExistingData = useCallback(async () => {
    try {
      const response = await fetch(`/api/air-conditioning?monthYear=${currentMonth}`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setExistingData(data)
          setAirConsumption(data.airConsumptionKwh.toString())
          setTotalConsumption(data.totalConsumptionKwh.toString())
          setTotalBill(data.totalBillAmount.toString())
          setUnitPrice(data.kwhUnitPrice.toString())
          setTotalCip(data.totalCipAmount.toString())
          setPaidById(data.paidById || "")
        }
      }
    } catch (error) {
      console.error("Error fetching existing data:", error)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchUsers()
    fetchExistingData()
  }, [fetchUsers, fetchExistingData])

  useEffect(() => {
    if (!paidById && session?.user?.id) {
      setPaidById(session.user.id)
    }
  }, [session?.user?.id, paidById])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const data = {
      monthYear: currentMonth,
      airConsumptionKwh: parseFloat(airConsumption),
      totalConsumptionKwh: parseFloat(totalConsumption),
      totalBillAmount: parseFloat(totalBill),
      kwhUnitPrice: parseFloat(unitPrice),
      totalCipAmount: parseFloat(totalCip),
      paidById,
    }

    try {
      const response = await fetch("/api/air-conditioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Cálculo realizado com sucesso!")
        setExistingData(result)
        onCalculated?.(result)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao calcular")
      }
    } catch {
      toast.error("Erro ao calcular")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount)
  }

  const consumptionWithoutAir = parseFloat(totalConsumption) - parseFloat(airConsumption) || 0

  const acEnergyCost = existingData
    ? existingData.airConsumptionKwh * existingData.kwhUnitPrice
    : 0
  const acExtra = existingData?.acExtraCost ?? existingData?.calculatedAmount ?? 0
  const cipWithoutAir = existingData?.cipWithoutAirAmount ?? 0
  const cipDiff = existingData ? existingData.totalCipAmount - cipWithoutAir : 0
  const nonAcPortion = existingData ? existingData.totalBillAmount - acExtra : 0
  const perUserShare = users.length > 0 ? nonAcPortion / users.length : 0

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Conta de Energia + Ar Condicionado
          </CardTitle>
          <CardDescription>
            Insira os dados da conta de energia para calcular a divisão justa considerando o uso do ar condicionado.
            Esta tela substitui o lançamento manual da conta de energia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="air-consumption">Consumo do Ar (kWh)</Label>
                <Input
                  id="air-consumption"
                  type="number"
                  step="0.001"
                  min="0"
                  value={airConsumption}
                  onChange={(e) => setAirConsumption(e.target.value)}
                  placeholder="Ex: 141.26"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-consumption">Consumo Total (kWh)</Label>
                <Input
                  id="total-consumption"
                  type="number"
                  step="0.001"
                  min="0"
                  value={totalConsumption}
                  onChange={(e) => setTotalConsumption(e.target.value)}
                  placeholder="Ex: 340"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-bill">Valor Total da Conta (R$)</Label>
                <Input
                  id="total-bill"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalBill}
                  onChange={(e) => setTotalBill(e.target.value)}
                  placeholder="Ex: 444.06"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit-price">Preço por kWh (R$)</Label>
                <Input
                  id="unit-price"
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="Ex: 1.12585890"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total-cip">CIP Pago na Conta (R$)</Label>
                <Input
                  id="total-cip"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalCip}
                  onChange={(e) => setTotalCip(e.target.value)}
                  placeholder="Ex: 61.29"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paid-by">Quem pagou a conta?</Label>
                <Select value={paidById} onValueChange={setPaidById} required>
                  <SelectTrigger id="paid-by">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {airConsumption && totalConsumption && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Resumo do Consumo:</h4>
                <div className="text-sm space-y-1">
                  <div>Consumo sem ar: {consumptionWithoutAir.toFixed(1)} kWh</div>
                  <div>Consumo do ar: {airConsumption} kWh</div>
                  <div>Total: {totalConsumption} kWh</div>
                </div>
              </div>
            )}

            <Button type="submit" disabled={isLoading || !paidById} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              {isLoading ? "Calculando..." : "Calcular e Lançar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {existingData?.acExtraCost !== undefined && existingData.acExtraCost !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Cálculo</CardTitle>
            <CardDescription>
              A conta de energia foi lançada automaticamente como despesa com divisão personalizada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {formatCurrency(acExtra)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Extra do ar ({userName})
                </div>
              </div>

              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(perUserShare)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Parte de cada um (sem ar)
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Custo do Ar Condicionado:</h4>
                <div className="space-y-1">
                  <div>Consumo: {existingData.airConsumptionKwh} kWh × {formatCurrency(existingData.kwhUnitPrice)}/kWh</div>
                  <div>Custo energia do ar: {formatCurrency(acEnergyCost)}</div>
                  <div>Diferença CIP: {formatCurrency(cipDiff)}</div>
                  <div className="font-medium">Total extra: {formatCurrency(acExtra)}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Faixas CIP:</h4>
                <div className="space-y-1">
                  <div>CIP pago (com ar): {formatCurrency(existingData.totalCipAmount)}</div>
                  <div>CIP sem ar (estimado): {formatCurrency(cipWithoutAir)}</div>
                  <div>Faixa sem ar: {existingData.cipTierWithoutAir ?? 0}%</div>
                  <div>Faixa com ar: {existingData.cipTierWithAir ?? 0}%</div>
                  {cipDiff > 0 && (
                    <div className="text-orange-600 font-medium">
                      Mudou de faixa: +{formatCurrency(cipDiff)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Divisão da Conta ({formatCurrency(existingData.totalBillAmount)}):</h4>
              <div className="space-y-1 text-sm">
                {users.map((user) => {
                  const isAcUser = user.id === session?.user?.id
                  const userAmount = isAcUser
                    ? perUserShare + acExtra
                    : perUserShare
                  return (
                    <div key={user.id} className="flex justify-between">
                      <span>{user.name} {isAcUser ? "(ar)" : ""}</span>
                      <span className="font-medium">{formatCurrency(userAmount)}</span>
                    </div>
                  )
                })}
                <div className="flex justify-between border-t pt-1 font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(existingData.totalBillAmount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
