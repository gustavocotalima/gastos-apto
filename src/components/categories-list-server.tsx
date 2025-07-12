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

interface Category {
  id: string
  name: string
  splitType: "DEFAULT" | "CUSTOM"
  user1user2?: number
  user3?: number
}

interface CategoriesListServerProps {
  categories: Category[]
}

export function CategoriesListServer({ categories }: CategoriesListServerProps) {
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
                  <CategoryEditButton category={category} />
                  <CategoryDeleteButton categoryId={category.id} categoryName={category.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}