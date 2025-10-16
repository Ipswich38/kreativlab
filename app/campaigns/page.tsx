"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  recipient_count: number
  open_count: number
  created_at: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error) {
      console.error("Error fetching campaigns:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
            <p className="text-muted-foreground mt-1">Manage your email campaigns</p>
          </div>
          <Link href="/campaigns/new">
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              New Campaign
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No campaigns yet</p>
            <Link href="/campaigns/new">
              <Button className="flex items-center gap-2 mx-auto">
                <Plus size={18} />
                Create Campaign
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.subject}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-secondary rounded-full text-muted-foreground">
                    {campaign.status}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Recipients: {campaign.recipient_count}</p>
                  <p className="text-muted-foreground">Opens: {campaign.open_count}</p>
                </div>
                <Link href={`/campaigns/${campaign.id}`}>
                  <Button variant="outline" className="w-full mt-4 bg-transparent">
                    View Details
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
