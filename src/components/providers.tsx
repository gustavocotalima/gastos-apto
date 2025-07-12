"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { PWAInstallPrompt } from "./pwa-install-prompt"
import { OfflineIndicator } from "./offline-indicator"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <PWAInstallPrompt />
        <OfflineIndicator />
      </ThemeProvider>
    </SessionProvider>
  )
}