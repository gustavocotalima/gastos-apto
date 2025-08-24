"use client"

import { SessionProvider } from "next-auth/react"
import { PWAInstallPrompt } from "./pwa-install-prompt"
import { OfflineIndicator } from "./offline-indicator"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
      <PWAInstallPrompt />
      <OfflineIndicator />
    </SessionProvider>
  )
}