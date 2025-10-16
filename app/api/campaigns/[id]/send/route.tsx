import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Get campaign recipients
    const { data: recipients, error: recipientsError } = await supabase
      .from("campaign_recipients")
      .select("*, contacts(email, name)")
      .eq("campaign_id", params.id)
      .eq("status", "pending")

    if (recipientsError) {
      return NextResponse.json({ error: "Error fetching recipients" }, { status: 500 })
    }

    // Get user's email settings
    const { data: userSettings } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (!userSettings?.outlook_email) {
      return NextResponse.json(
        { error: "Outlook email not configured. Please connect your Outlook account in settings." },
        { status: 400 },
      )
    }

    // Send emails (in production, use a queue service like Vercel Queues or Bull)
    const emailResults = []

    for (const recipient of recipients) {
      try {
        // Call email sending service (Resend, SendGrid, or Outlook API)
        const emailResponse = await sendEmail({
          to: recipient.contacts.email,
          subject: campaign.subject,
          html: campaign.content || "<p>Email content</p>",
          from: userSettings.outlook_email,
        })

        if (emailResponse.success) {
          // Update recipient status
          await supabase
            .from("campaign_recipients")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", recipient.id)

          emailResults.push({ email: recipient.contacts.email, success: true })
        }
      } catch (error) {
        console.error(`Error sending to ${recipient.contacts.email}:`, error)
        emailResults.push({ email: recipient.contacts.email, success: false })
      }
    }

    // Update campaign status
    const successCount = emailResults.filter((r) => r.success).length

    await supabase
      .from("campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    return NextResponse.json({
      success: true,
      message: `Campaign sent to ${successCount} of ${recipients.length} recipients`,
      results: emailResults,
    })
  } catch (error) {
    console.error("Error sending campaign:", error)
    return NextResponse.json({ error: "Error sending campaign" }, { status: 500 })
  }
}

// Mock email sending function - replace with actual service
async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string
  subject: string
  html: string
  from: string
}): Promise<{ success: boolean }> {
  // In production, integrate with:
  // - Resend (recommended for Next.js)
  // - SendGrid
  // - Outlook/Microsoft Graph API
  // - AWS SES

  console.log(`Sending email to ${to} from ${from}`)

  // Simulate email sending
  return { success: true }
}
