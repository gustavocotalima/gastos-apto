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

interface Category {
  id: string
  name: string
  splitType: "DEFAULT" | "CUSTOM"
  user1user2?: number
  user3?: number
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

  const getSplitDisplay = (category: Category) => {
    if (category.splitType === "DEFAULT") {
      return "Padrão (2/3 + 1/3)"
    }
    
    return `${category.user1user2?.toFixed(1)}% + ${category.user3?.toFixed(1)}%`
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma categoria encontrada.
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Divisão</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">
                {category.name}
              </TableCell>
              <TableCell>
                <Badge variant={category.splitType === "DEFAULT" ? "secondary" : "outline"}>
                  {category.splitType === "DEFAULT" ? "Padrão" : "Personalizada"}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">
                {getSplitDisplay(category)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <CategoryForm
                    category={category}
                    onCategoryChanged={onCategoryChanged}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(category.id, category.name)}
                    disabled={deletingId === category.id}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}