"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Check, AlertCircle } from "lucide-react"

interface UserSettings {
  id: string
  email: string
  company_name: string
  outlook_email?: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error: fetchError } = await supabase.from("users").select("*").eq("id", user.id).single()

      if (fetchError) throw fetchError
      setSettings(data)
      setCompanyName(data.company_name || "")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCompany = async () => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error: updateError } = await supabase
        .from("users")
        .update({ company_name: companyName })
        .eq("id", user.id)

      if (updateError) throw updateError
      setSuccess("Company name updated successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving settings")
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnectOutlook = async () => {
    // In production, implement OAuth flow with Microsoft
    // For now, show a placeholder
    alert(
      "Outlook integration coming soon! In production, this would redirect to Microsoft OAuth for secure authentication.",
    )
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">Loading settings...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and integrations</p>
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <Check size={18} />
            {success}
          </div>
        )}

        {/* Company Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Company Information</h2>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={settings?.email || ""} disabled className="bg-secondary" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
              />
            </div>
            <Button onClick={handleSaveCompany} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Card>

        {/* Email Integration */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Email Integration</h2>
              <p className="text-sm text-muted-foreground mt-1">Connect your Outlook account to send campaigns</p>
            </div>
            {settings?.outlook_email && <Check className="text-green-600" size={24} />}
          </div>

          {settings?.outlook_email ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 rounded-lg flex items-center gap-3">
                <Mail className="text-green-600" size={20} />
                <div>
                  <p className="font-semibold text-sm">Connected</p>
                  <p className="text-sm text-muted-foreground">{settings.outlook_email}</p>
                </div>
              </div>
              <Button variant="outline" className="bg-transparent">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 rounded-lg flex items-center gap-3">
                <AlertCircle className="text-yellow-600" size={20} />
                <p className="text-sm">Not connected. Connect your Outlook account to send email campaigns.</p>
              </div>
              <Button onClick={handleConnectOutlook} className="flex items-center gap-2">
                <Mail size={18} />
                Connect Outlook
              </Button>
            </div>
          )}
        </Card>

        {/* API Keys */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">API Keys</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Use these keys to integrate with external services (coming soon)
          </p>
          <Button variant="outline" disabled className="bg-transparent">
            Generate API Key
          </Button>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-destructive/50">
          <h2 className="text-xl font-semibold mb-4 text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Irreversible actions</p>
          <Button variant="outline" className="text-destructive hover:text-destructive bg-transparent">
            Delete Account
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  )
}
