import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, accessToken } = await request.json()

    // Store Outlook email and token in user settings
    const { error } = await supabase
      .from("users")
      .update({
        outlook_email: email,
        outlook_token: accessToken, // In production, encrypt this
      })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: "Error saving Outlook connection" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Outlook connected successfully" })
  } catch (error) {
    console.error("Error connecting Outlook:", error)
    return NextResponse.json({ error: "Error connecting Outlook" }, { status: 500 })
  }
}
