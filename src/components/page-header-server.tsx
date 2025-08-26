import { Button } from "@/components/ui/button"
import { Settings, Zap, Home } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { UserGreeting } from "./user-greeting"
import { SignOutButton } from "./sign-out-button"

export function PageHeaderServer() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gastos do Apto</h1>
          <UserGreeting />
        </div>
        <nav className="flex gap-2">
          <ThemeToggle />
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Início</span>
            </Button>
          </Link>
          <Link href="/ar-condicionado">
            <Button variant="outline" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Ar Condicionado</span>
            </Button>
          </Link>
          <Link href="/categorias">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Categorias</span>
            </Button>
          </Link>
          <Link href="/configuracoes">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config CIP</span>
            </Button>
          </Link>
          <SignOutButton />
        </nav>
      </div>
    </header>
  )
}