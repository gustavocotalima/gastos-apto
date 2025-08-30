"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, Zap, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MobileMenu() {
  const [open, setOpen] = useState(false)

  const handleSignOut = () => {
    setOpen(false)
    signOut()
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
      <SheetContent side="right" className="w-[250px] sm:w-[300px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-8">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors"
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
          <hr className="my-2" />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 text-lg font-medium hover:text-primary transition-colors text-left"
          >
            <LogOut className="h-5 w-5" />
            Sair
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  )
}