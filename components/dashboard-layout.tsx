import type React from "react"
import { Sidebar } from "./sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 md:ml-64">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
