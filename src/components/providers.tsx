"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { PWAInstallPrompt } from "./pwa-install-prompt"
import { OfflineIndicator } from "./offline-indicator"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <PWAInstallPrompt />
        <OfflineIndicator />
      </ThemeProvider>
    </SessionProvider>
  )
}