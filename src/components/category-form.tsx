"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit } from "lucide-react"
import { toast } from "sonner"

interface Category {
  id: string
  name: string
  splitType: "DEFAULT" | "CUSTOM"
  user1user2?: number
  user3?: number
}

interface CategoryFormProps {
  category?: Category
  onCategoryChanged: () => void
  trigger?: React.ReactNode
}

export function CategoryForm({ category, onCategoryChanged, trigger }: CategoryFormProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Form data
  const [name, setName] = useState("")
  const [splitType, setSplitType] = useState<"DEFAULT" | "CUSTOM">("DEFAULT")
  const [user1user2, setuser1user2] = useState<number>(66.67)
  const [user3, setuser3] = useState<number>(33.33)

  const isEdit = !!category

  useEffect(() => {
    if (category) {
      setName(category.name)
      setSplitType(category.splitType)
      setuser1user2(category.user1user2 || 66.67)
      setuser3(category.user3 || 33.33)
    } else {
      resetForm()
    }
  }, [category, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const data = {
      name,
      splitType,
      ...(splitType === "CUSTOM" && {
        user1user2,
        user3,
      }),
    }

    try {
      const url = isEdit ? `/api/categories/${category!.id}` : "/api/categories"
      const method = isEdit ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success(isEdit ? "Categoria atualizada!" : "Categoria criada!")
        setOpen(false)
        if (!isEdit) resetForm()
        onCategoryChanged()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar categoria")
      }
    } catch (error) {
      toast.error("Erro ao salvar categoria")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setName("")
    setSplitType("DEFAULT")
    setuser1user2(66.67)
    setuser3(33.33)
  }

  const handlePercentageChange = (field: "user1user2" | "user3", value: number) => {
    if (field === "user1user2") {
      setuser1user2(value)
      setuser3(100 - value)
    } else {
      setuser3(value)
      setuser1user2(100 - value)
    }
  }

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Nova Categoria
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? "Modifique os dados da categoria."
              : "Crie uma nova categoria para organizar os gastos."
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supermercado, Conta de Luz..."
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="custom-split"
                checked={splitType === "CUSTOM"}
                onCheckedChange={(checked) => 
                  setSplitType(checked ? "CUSTOM" : "DEFAULT")
                }
              />
              <Label htmlFor="custom-split">Divisão personalizada</Label>
            </div>

            {splitType === "DEFAULT" && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <strong>Divisão padrão:</strong>
                <br />
                • user1 + user2: 66.67% (33.33% cada)
                <br />
                • user3: 33.33%
              </div>
            )}

            {splitType === "CUSTOM" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="user1-user2">
                    user1 + user2 (%)
                  </Label>
                  <Input
                    id="user1-user2"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={user1user2}
                    onChange={(e) => 
                      handlePercentageChange("user1user2", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user3">user3 (%)</Label>
                  <Input
                    id="user3"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={user3}
                    onChange={(e) => 
                      handlePercentageChange("user3", parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Total: {(user1user2 + user3).toFixed(2)}%
                  {Math.abs(user1user2 + user3 - 100) > 0.01 && (
                    <span className="text-red-500 ml-2">
                      (Deve somar 100%)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}