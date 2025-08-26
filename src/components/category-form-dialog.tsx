"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface User {
  id: string
  name: string
  email: string
}

interface CategorySplit {
  userId: string
  percentage: number
  user: {
    name: string
  }
}

interface Category {
  id: string
  name: string
  splitType: "EQUAL" | "CUSTOM"
  splits?: CategorySplit[]
}

interface CategoryFormDialogProps {
  category?: Category
  onClose: () => void
}

export function CategoryFormDialog({ category, onClose }: CategoryFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const router = useRouter()
  
  // Form data
  const [name, setName] = useState("")
  const [splitType, setSplitType] = useState<"EQUAL" | "CUSTOM">("EQUAL")
  const [customSplits, setCustomSplits] = useState<Record<string, number>>({})

  const isEdit = !!category

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (category) {
      setName(category.name)
      setSplitType(category.splitType)
    } else {
      resetForm()
    }
  }, [category])

  // Handle splits after users are loaded
  useEffect(() => {
    if (users.length > 0) {
      if (category && category.splits && category.splits.length > 0) {
        // Load existing splits for edit mode
        const splits: Record<string, number> = {}
        category.splits.forEach(split => {
          splits[split.userId] = split.percentage
        })
        setCustomSplits(splits)
      } else if (!category) {
        // Initialize equal splits for new categories
        const equalPercentage = 100 / users.length
        const splits: Record<string, number> = {}
        users.forEach((user: User) => {
          splits[user.id] = equalPercentage
        })
        setCustomSplits(splits)
      }
    }
  }, [users, category])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate custom splits total to 100%
    if (splitType === "CUSTOM") {
      const total = Object.values(customSplits).reduce((sum, val) => sum + val, 0)
      if (Math.abs(total - 100) > 0.01) {
        toast.error("Os percentuais devem somar 100%")
        setIsLoading(false)
        return
      }
    }

    const data = {
      name,
      splitType,
      ...(splitType === "CUSTOM" && {
        splits: Object.entries(customSplits).map(([userId, percentage]) => ({
          userId,
          percentage
        }))
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
        onClose()
        if (!isEdit) resetForm()
        router.refresh()
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
    setSplitType("EQUAL")
    setCustomSplits({})
  }

  const updateSplit = (userId: string, percentage: number) => {
    setCustomSplits(prev => ({
      ...prev,
      [userId]: percentage
    }))
  }

  const totalPercentage = Object.values(customSplits).reduce((sum, val) => sum + val, 0)

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {isEdit ? "Editar Categoria" : "Nova Categoria"}
        </DialogTitle>
        <DialogDescription>
          {isEdit 
            ? "Edite o nome e a forma de divisão da categoria"
            : "Crie uma nova categoria para organizar seus gastos"
          }
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome da Categoria</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Aluguel, Internet, Supermercado..."
            required
          />
        </div>

        <div className="space-y-3">
          <Label>Tipo de Divisão</Label>
          
          <Select value={splitType} onValueChange={(value: "EQUAL" | "CUSTOM") => setSplitType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EQUAL">Divisão Igual</SelectItem>
              <SelectItem value="CUSTOM">Divisão Personalizada</SelectItem>
            </SelectContent>
          </Select>

          {splitType === "EQUAL" && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
              <strong>Divisão igual:</strong> O valor será dividido igualmente entre todos os usuários ativos
              {users.length > 0 && (
                <div className="mt-2">
                  {users.map(user => (
                    <div key={user.id}>• {user.name}: {(100 / users.length).toFixed(1)}%</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {splitType === "CUSTOM" && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Defina o percentual que cada usuário deve pagar:
              </div>
              
              {users.map(user => (
                <div key={user.id} className="flex items-center gap-3">
                  <Label className="min-w-0 flex-1">{user.name}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={customSplits[user.id] || 0}
                      onChange={(e) => updateSplit(user.id, parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
              
              <div className="text-sm">
                Total: {totalPercentage.toFixed(1)}%
                {Math.abs(totalPercentage - 100) > 0.01 && (
                  <span className="text-red-500 ml-2">
                    (deve somar 100%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : isEdit ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </DialogContent>
  )
}