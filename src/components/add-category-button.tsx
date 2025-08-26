import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function AddCategoryButton() {
  return (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      Nova Categoria
    </Button>
  )
}