"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calculator, Zap } from "lucide-react"
import { toast } from "sonner"

interface AirConditioningData {
  id?: string
  monthYear: string
  airConsumptionKwh: number
  totalConsumptionKwh: number
  totalBillAmount: number
  kwhUnitPrice: number
  totalCipAmount: number
  calculatedAmount?: number
  cipTierWithoutAir?: number
  cipTierWithAir?: number
}

interface AirConditioningFormProps {
  monthYear?: string
  onCalculated?: (data: AirConditioningData) => void
}

export function AirConditioningForm({ monthYear, onCalculated }: AirConditioningFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [existingData, setExistingData] = useState<AirConditioningData | null>(null)
  
  // Form data
  const currentMonth = monthYear || new Date().toISOString().slice(0, 7)
  const [airConsumption, setAirConsumption] = useState("")
  const [totalConsumption, setTotalConsumption] = useState("")
  const [totalBill, setTotalBill] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [totalCip, setTotalCip] = useState("")

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
        }
      }
    } catch (error) {
      console.error("Error fetching existing data:", error)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchExistingData()
  }, [fetchExistingData])

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
    }

    try {
      const response = await fetch("/api/air-conditioning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    } catch (error) {
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Cálculo do Ar Condicionado
          </CardTitle>
          <CardDescription>
            Insira os dados da conta de energia para calcular quanto você deve pagar pelo ar condicionado
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
                  placeholder="Ex: 150.527"
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
                  placeholder="Ex: 350.2"
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
                  placeholder="Ex: 280.50"
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
                  placeholder="Ex: 1.00872125"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="total-cip">Total Pago de CIP (R$)</Label>
                <Input
                  id="total-cip"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalCip}
                  onChange={(e) => setTotalCip(e.target.value)}
                  placeholder="Ex: 25.80"
                  required
                />
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

            <Button type="submit" disabled={isLoading} className="w-full gap-2">
              <Calculator className="h-4 w-4" />
              {isLoading ? "Calculando..." : "Calcular"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {existingData?.calculatedAmount !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado do Cálculo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(existingData.calculatedAmount)}
              </div>
              <div className="text-muted-foreground">
                Valor que user1 deve pagar
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Detalhes do Cálculo:</h4>
                <div className="space-y-1">
                  <div>Consumo do ar: {existingData.airConsumptionKwh} kWh</div>
                  <div>Preço por kWh: {formatCurrency(existingData.kwhUnitPrice)}</div>
                  <div>Custo do ar: {formatCurrency(existingData.airConsumptionKwh * existingData.kwhUnitPrice)}</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Faixas CIP:</h4>
                <div className="space-y-1">
                  <div>Sem ar: {existingData.cipTierWithoutAir ?? 0}%</div>
                  <div>Com ar: {existingData.cipTierWithAir ?? 0}%</div>
                  {(existingData.cipTierWithAir ?? 0) > (existingData.cipTierWithoutAir ?? 0) && (
                    <div className="text-orange-600">
                      ⚠️ Mudou de faixa CIP
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}