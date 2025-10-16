"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [passcode, setPasscode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Login - Attempting login with username:", username)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, passcode }),
        credentials: "include", // Ensure cookies are sent
      })

      const data = await response.json()
      console.log("[v0] Login - Response status:", response.status, "Data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      // Store session info in localStorage
      localStorage.setItem("session_token", data.token)
      localStorage.setItem("user_id", data.user_id)
      localStorage.setItem("username", data.username)

      console.log("[v0] Login - Success, redirecting to dashboard")

      // Small delay to ensure cookie is set
      await new Promise((resolve) => setTimeout(resolve, 100))

      router.push("/dashboard")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      console.log("[v0] Login - Error:", errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 md:p-10 bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold text-primary mb-2">kreativlab</h1>
            <p className="text-muted-foreground">CRM & Email Marketing Platform</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-10"
                      autoComplete="username"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="passcode">Passcode</Label>
                    <Input
                      id="passcode"
                      type="password"
                      placeholder="Enter your passcode"
                      required
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="h-10"
                      autoComplete="current-password"
                    />
                  </div>
                  {error && <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>}
                  <Button type="submit" className="w-full h-10 text-base" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
