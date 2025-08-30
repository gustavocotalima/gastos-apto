import { Button } from "@/components/ui/button"
import { Settings, Zap, Home } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { UserGreeting } from "./user-greeting"
import { SignOutButton } from "./sign-out-button"
import { MobileMenu } from "./mobile-menu"

export function PageHeaderServer() {
  return (
    <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and Greeting */}
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold">Gastos do Apto</h1>
            <UserGreeting />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Início
              </Button>
            </Link>
            <Link href="/ar-condicionado">
              <Button variant="ghost" size="sm" className="gap-2">
                <Zap className="h-4 w-4" />
                Ar Condicionado
              </Button>
            </Link>
            <Link href="/categorias">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Categorias
              </Button>
            </Link>
            <Link href="/configuracoes">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Config CIP
              </Button>
            </Link>
            <SignOutButton />
          </nav>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}