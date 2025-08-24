"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit } from "lucide-react"
import { toast } from "sonner"
import { CategoryForm } from "./category-form"

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

interface CategoriesListProps {
  categories: Category[]
  onCategoryChanged: () => void
}

export function CategoriesList({ categories, onCategoryChanged }: CategoriesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Categoria excluída com sucesso!")
        onCategoryChanged()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao excluir categoria")
      }
    } catch (error) {
      toast.error("Erro ao excluir categoria")
    } finally {
      setDeletingId(null)
    }
  }

  const formatSplitInfo = (category: Category) => {
    if (category.splitType === "EQUAL") {
      return "Divisão igual entre todos"
    }
    
    if (category.splits && category.splits.length > 0) {
      return category.splits
        .map(split => `${split.user.name}: ${split.percentage.toFixed(1)}%`)
        .join(" • ")
    }
    
    return "Configuração personalizada"
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma categoria encontrada. Crie sua primeira categoria!
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Tipo de Divisão</TableHead>
          <TableHead>Divisão</TableHead>
          <TableHead className="w-24">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id}>
            <TableCell className="font-medium">{category.name}</TableCell>
            <TableCell>
              <Badge variant={category.splitType === "EQUAL" ? "default" : "secondary"}>
                {category.splitType === "EQUAL" ? "Igual" : "Personalizada"}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatSplitInfo(category)}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <CategoryForm
                  category={category}
                  onCategoryChanged={onCategoryChanged}
                  trigger={
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(category.id, category.name)}
                  disabled={deletingId === category.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}