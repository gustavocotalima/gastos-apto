"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarRange } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getBillingCycleEndDate,
  getBillingCycleStartDate,
  getCurrentBillingMonthYear,
} from "@/lib/billing-cycle"

interface BillingCycleSettingsFormProps {
  initialStartDay: number
}

export function BillingCycleSettingsForm({
  initialStartDay,
}: BillingCycleSettingsFormProps) {
  const router = useRouter()
  const [startDay, setStartDay] = useState(String(initialStartDay))
  const [isSaving, setIsSaving] = useState(false)
  const selectedStartDay = Number(startDay)
  const currentMonth = getCurrentBillingMonthYear(selectedStartDay)
  const cycleStart = getBillingCycleStartDate(currentMonth, selectedStartDay)
  const cycleEnd = getBillingCycleEndDate(currentMonth, selectedStartDay)
  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    })

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const response = await fetch("/api/settings/billing-cycle", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDay: selectedStartDay }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        toast.error(error?.error || "Erro ao salvar o ciclo mensal")
        return
      }

      toast.success("Dia inicial atualizado e gastos reorganizados!")
      router.refresh()
    } catch {
      toast.error("Erro ao salvar o ciclo mensal")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="h-5 w-5" />
          Ciclo mensal
        </CardTitle>
        <CardDescription>
          Escolha o dia em que um novo mês de despesas começa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billing-cycle-start-day">Dia inicial</Label>
            <Select value={startDay} onValueChange={setStartDay}>
              <SelectTrigger id="billing-cycle-start-day" className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, index) => index + 1).map((day) => (
                  <SelectItem key={day} value={String(day)}>
                    Dia {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              O ciclo atual vai de {formatDate(cycleStart)} até {formatDate(cycleEnd)}.
              Gastos anteriores ao dia {selectedStartDay} entram no ciclo anterior.
            </p>
            <p className="text-xs text-muted-foreground">
              Ao salvar, os gastos existentes serão reorganizados de acordo com
              suas datas.
            </p>
            {selectedStartDay > 28 && (
              <p className="text-xs text-muted-foreground">
                Em meses mais curtos, o ciclo começa no último dia do mês.
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSaving || selectedStartDay === initialStartDay}
          >
            {isSaving ? "Salvando..." : "Salvar ciclo"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
