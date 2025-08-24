"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Trash2, Settings } from "lucide-react"
import { toast } from "sonner"

interface CipTier {
  id?: string
  minKwh: number
  maxKwh: number | null
  percentage: number
}

interface CipConfiguration {
  id?: string
  monthYear: string
  baseCalculationValue: number
  tiers: CipTier[]
}

interface CipConfigurationFormProps {
  monthYear?: string
}

export function CipConfigurationForm({ monthYear }: CipConfigurationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<CipConfiguration | null>(null)
  
  const currentMonth = monthYear || new Date().toISOString().slice(0, 7)
  const [baseValue, setBaseValue] = useState("")
  const [tiers, setTiers] = useState<Omit<CipTier, "id">[]>([
    { minKwh: 0, maxKwh: 100, percentage: 0.5 },
    { minKwh: 101, maxKwh: 150, percentage: 1.0 },
    { minKwh: 151, maxKwh: null, percentage: 2.0 },
  ])

  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/cip-config?monthYear=${currentMonth}`)
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setConfig(data)
          setBaseValue(data.baseCalculationValue.toString())
          setTiers(data.tiers)
        }
      }
    } catch (error) {
      console.error("Error fetching CIP config:", error)
    }
  }, [currentMonth])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const handleAddTier = () => {
    const lastTier = tiers[tiers.length - 1]
    const newMinKwh = lastTier?.maxKwh ? lastTier.maxKwh + 1 : 200
    
    setTiers([
      ...tiers.slice(0, -1), // Remove the last tier (which should have maxKwh: null)
      { ...lastTier, maxKwh: newMinKwh - 1 }, // Update last tier to have a max value
      { minKwh: newMinKwh, maxKwh: null, percentage: 2.0 }, // New last tier
    ])
  }

  const handleRemoveTier = (index: number) => {
    if (tiers.length <= 1) {
      toast.error("Deve haver pelo menos uma faixa CIP")
      return
    }
    
    const newTiers = tiers.filter((_, i) => i !== index)
    // Ensure the last tier has maxKwh: null
    if (newTiers.length > 0) {
      newTiers[newTiers.length - 1].maxKwh = null
    }
    setTiers(newTiers)
  }

  const handleTierChange = (index: number, field: keyof CipTier, value: number | null) => {
    const newTiers = [...tiers]
    newTiers[index] = { ...newTiers[index], [field]: value }
    setTiers(newTiers)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate tiers
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i]
      if (tier.minKwh < 0 || tier.percentage < 0) {
        toast.error("Valores não podem ser negativos")
        setIsLoading(false)
        return
      }
      
      if (i < tiers.length - 1 && tier.maxKwh === null) {
        toast.error("Apenas a última faixa pode ter valor máximo indefinido")
        setIsLoading(false)
        return
      }
      
      if (tier.maxKwh !== null && tier.minKwh >= tier.maxKwh) {
        toast.error("Valor mínimo deve ser menor que o máximo")
        setIsLoading(false)
        return
      }
    }

    const data = {
      monthYear: currentMonth,
      baseCalculationValue: parseFloat(baseValue),
      tiers: tiers,
    }

    try {
      let response
      if (config) {
        // Update existing config
        response = await fetch(`/api/cip-config/${currentMonth}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            baseCalculationValue: data.baseCalculationValue,
            tiers: data.tiers,
          }),
        })
      } else {
        // Create new config
        response = await fetch("/api/cip-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
      }

      if (response.ok) {
        const result = await response.json()
        toast.success(config ? "Configuração atualizada!" : "Configuração criada!")
        setConfig(result)
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar configuração")
      }
    } catch (error) {
      toast.error("Erro ao salvar configuração")
    } finally {
      setIsLoading(false)
    }
  }

  const getMonthDisplay = (monthYear: string) => {
    const [year, month] = monthYear.split("-")
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("pt-BR", { 
      month: "long", 
      year: "numeric" 
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuração CIP - {getMonthDisplay(currentMonth)}
        </CardTitle>
        <CardDescription>
          Configure as faixas de CIP (Contribuição para Iluminação Pública) para este mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="base-value">Valor Base de Cálculo (R$)</Label>
            <Input
              id="base-value"
              type="number"
              step="0.01"
              min="0"
              value={baseValue}
              onChange={(e) => setBaseValue(e.target.value)}
              placeholder="Ex: 45.67"
              required
            />
            <p className="text-sm text-muted-foreground">
              Conv4 - % Tarifa B4A (valor base para cálculo do CIP)
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Faixas de Consumo (kWh)</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTier}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Faixa
              </Button>
            </div>

            <div className="space-y-3">
              {tiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-xs">Min kWh</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={tier.minKwh}
                      onChange={(e) => handleTierChange(index, "minKwh", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Max kWh</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={tier.maxKwh || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        handleTierChange(index, "maxKwh", value ? parseFloat(value) : null)
                      }}
                      placeholder={index === tiers.length - 1 ? "Ilimitado" : ""}
                      disabled={index === tiers.length - 1}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">CIP (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={tier.percentage}
                      onChange={(e) => handleTierChange(index, "percentage", parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveTier(index)}
                      disabled={tiers.length <= 1}
                      className="gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {tiers.length > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo das Faixas:</h4>
              <div className="text-sm space-y-1">
                {tiers.map((tier, index) => (
                  <div key={index}>
                    {tier.minKwh} - {tier.maxKwh ? `${tier.maxKwh} kWh` : "∞ kWh"}: {tier.percentage}% CIP
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Salvando..." : config ? "Atualizar Configuração" : "Criar Configuração"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}