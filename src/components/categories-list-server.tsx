import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { CategoryEditButton } from "./category-edit-button"
import { CategoryDeleteButton } from "./category-delete-button"

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

interface CategoriesListServerProps {
  categories: Category[]
}

export function CategoriesListServer({ categories }: CategoriesListServerProps) {
  const getSplitDisplay = (category: Category) => {
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
        Nenhuma categoria encontrada.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Divisão</TableHead>
          <TableHead>Detalhes</TableHead>
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
              {getSplitDisplay(category)}
            </TableCell>
            <TableCell>
              <div className="flex gap-1">
                <CategoryEditButton category={category} />
                <CategoryDeleteButton categoryId={category.id} categoryName={category.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}