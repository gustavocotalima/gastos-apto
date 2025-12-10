"use client"

import { useSession } from "@/lib/auth-client"

export function UserGreeting() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <p className="text-muted-foreground">Carregando...</p>
  }

  return (
    <p className="text-muted-foreground">
      {session?.user?.name ? `Olá, ${session.user.name}` : "Carregando..."}
    </p>
  )
}
