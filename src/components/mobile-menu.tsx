"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, Home, Zap, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MobileMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    setOpen(false)
    await signOut()
    router.push("/login")
    router.refresh()
  }

  const menuItems = [
    { href: "/", icon: Home, label: "Início" },
    { href: "/ar-condicionado", icon: Zap, label: "Ar Condicionado" },
    { href: "/categorias", icon: Settings, label: "Categorias" },
    { href: "/configuracoes", icon: Settings, label: "Configurações CIP" },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] p-6">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="text-xl">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <div className="my-4 border-t border-border" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-medium hover:bg-accent hover:text-accent-foreground transition-colors text-left w-full"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
