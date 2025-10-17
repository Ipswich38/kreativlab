import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Mail, FileText } from "lucide-react"
import { cookies } from "next/headers"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const authToken = cookieStore.get("sb-auth-token")?.value

  if (!authToken) {
    redirect("/auth/login")
  }

  // Extract user_id from token (format: base64(user_id:timestamp))
  let userId: string
  try {
    const decoded = Buffer.from(authToken, "base64").toString("utf-8")
    userId = decoded.split(":")[0]
  } catch {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Fetch all analytics data in parallel
  const [contactsData, campaignsData, sentCampaignsData, recentCampaignsData] = await Promise.all([
    supabase.from("contacts").select("id", { count: "exact" }).eq("user_id", userId),
    supabase.from("campaigns").select("id", { count: "exact" }).eq("user_id", userId),
    supabase
      .from("campaigns")
      .select("id, open_count, click_count, recipient_count")
      .eq("user_id", userId)
      .eq("status", "sent"),
    supabase
      .from("campaigns")
      .select("id, name, subject, status, recipient_count, open_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const contactsCount = contactsData.count || 0
  const campaignsCount = campaignsData.count || 0

  // Calculate aggregate metrics
  const sentCampaigns = sentCampaignsData.data || []
  const totalEmailsSent = sentCampaigns.reduce((sum, c) => sum + (c.recipient_count || 0), 0)
  const totalOpens = sentCampaigns.reduce((sum, c) => sum + (c.open_count || 0), 0)
  const totalClicks = sentCampaigns.reduce((sum, c) => sum + (c.click_count || 0), 0)
  const avgOpenRate = totalEmailsSent > 0 ? Math.round((totalOpens / totalEmailsSent) * 100) : 0
  const avgClickRate = totalEmailsSent > 0 ? Math.round((totalClicks / totalEmailsSent) * 100) : 0

  const recentCampaigns = recentCampaignsData.data || []

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back! Here's your CRM overview.</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
                <p className="text-3xl font-bold text-primary mt-2">{contactsCount}</p>
              </div>
              <Users className="text-primary/20" size={32} />
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
                <p className="text-3xl font-bold text-primary mt-2">{campaignsCount}</p>
              </div>
              <Mail className="text-primary/20" size={32} />
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Open Rate</p>
                <p className="text-3xl font-bold text-primary mt-2">{avgOpenRate}%</p>
              </div>
              <TrendingUp className="text-primary/20" size={32} />
            </div>
          </Card>

          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Click Rate</p>
                <p className="text-3xl font-bold text-primary mt-2">{avgClickRate}%</p>
              </div>
              <TrendingUp className="text-primary/20" size={32} />
            </div>
          </Card>
        </div>

        {/* Campaign Performance */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Campaign Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Emails Sent</p>
              <p className="text-2xl font-bold text-primary mt-2">{totalEmailsSent}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Total Opens</p>
              <p className="text-2xl font-bold text-primary mt-2">{totalOpens}</p>
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold text-primary mt-2">{totalClicks}</p>
            </div>
          </div>
        </Card>

        {/* Recent Campaigns */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Campaigns</h2>
            <Link href="/campaigns">
              <Button variant="outline" size="sm" className="bg-transparent">
                View All
              </Button>
            </Link>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No campaigns yet</p>
              <Link href="/campaigns/new">
                <Button className="flex items-center gap-2 mx-auto">
                  <Mail size={18} />
                  Create Campaign
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Campaign</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Recipients</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Opens</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/campaigns/${campaign.id}`} className="text-primary hover:underline font-medium">
                          {campaign.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            campaign.status === "sent"
                              ? "bg-green-500/10 text-green-700"
                              : "bg-yellow-500/10 text-yellow-700"
                          }`}
                        >
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{campaign.recipient_count}</td>
                      <td className="px-4 py-3 text-sm">{campaign.open_count}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/contacts/import">
              <Button variant="outline" className="w-full justify-start bg-background hover:bg-secondary">
                <FileText size={18} className="mr-2" />
                Import Contacts
              </Button>
            </Link>
            <Link href="/campaigns/new">
              <Button variant="outline" className="w-full justify-start bg-background hover:bg-secondary">
                <Mail size={18} className="mr-2" />
                New Campaign
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start bg-background hover:bg-secondary">
                <Users size={18} className="mr-2" />
                Connect Outlook
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
