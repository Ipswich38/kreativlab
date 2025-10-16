"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Send, Edit, Trash2, Loader } from "lucide-react"
import Link from "next/link"

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  recipient_count: number
  open_count: number
  click_count: number
  sent_at: string
  created_at: string
}

export default function CampaignDetailPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    fetchCampaign()
  }, [])

  const fetchCampaign = async () => {
    try {
      const { data, error: fetchError } = await supabase.from("campaigns").select("*").eq("id", params.id).single()

      if (fetchError) throw fetchError
      setCampaign(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading campaign")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendCampaign = async () => {
    setIsSending(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/campaigns/${params.id}/send`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error sending campaign")
      }

      setSuccess(data.message)
      fetchCampaign()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error sending campaign")
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this campaign?")) return

    try {
      const { error: deleteError } = await supabase.from("campaigns").delete().eq("id", params.id)

      if (deleteError) throw deleteError
      router.push("/campaigns")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting campaign")
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">Loading campaign...</div>
      </DashboardLayout>
    )
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">Campaign not found</div>
      </DashboardLayout>
    )
  }

  const openRate = campaign.recipient_count > 0 ? Math.round((campaign.open_count / campaign.recipient_count) * 100) : 0
  const clickRate =
    campaign.recipient_count > 0 ? Math.round((campaign.click_count / campaign.recipient_count) * 100) : 0

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <Link href="/campaigns" className="flex items-center gap-2 text-primary hover:underline w-fit">
          <ArrowLeft size={18} />
          Back to Campaigns
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
            <p className="text-muted-foreground mt-1">Subject: {campaign.subject}</p>
          </div>
          <div className="flex gap-2">
            {campaign.status === "draft" && (
              <>
                <Link href={`/campaigns/${campaign.id}/edit`}>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Edit size={18} />
                    Edit
                  </Button>
                </Link>
                <Button onClick={handleSendCampaign} disabled={isSending} className="flex items-center gap-2">
                  {isSending ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Send
                    </>
                  )}
                </Button>
              </>
            )}
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive bg-transparent"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}
        {success && <div className="p-4 bg-green-500/10 text-green-700 rounded-lg text-sm">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-2xl font-bold text-primary mt-2 capitalize">{campaign.status}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Recipients</p>
            <p className="text-2xl font-bold text-primary mt-2">{campaign.recipient_count}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Open Rate</p>
            <p className="text-2xl font-bold text-primary mt-2">{openRate}%</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Click Rate</p>
            <p className="text-2xl font-bold text-primary mt-2">{clickRate}%</p>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Campaign Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium mt-1">{new Date(campaign.created_at).toLocaleDateString()}</p>
            </div>
            {campaign.sent_at && (
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="font-medium mt-1">{new Date(campaign.sent_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
