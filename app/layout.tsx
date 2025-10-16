import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "kreativlab - CRM & Email Marketing Platform",
  description: "Professional CRM and email marketing platform for managing contacts and campaigns",
  generator: "v0.app",
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={`font-sans antialiased`}>{children}</body>
    </html>
  )
}
