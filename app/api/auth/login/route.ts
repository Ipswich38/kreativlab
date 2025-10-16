import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { username, passcode } = await request.json()

    if (!username || !passcode) {
      return NextResponse.json({ error: "Username and passcode required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Query the users table
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, passcode, company_name")
      .eq("username", username)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: "Invalid username or passcode" }, { status: 401 })
    }

    // Check passcode
    if (user.passcode !== passcode) {
      return NextResponse.json({ error: "Invalid username or passcode" }, { status: 401 })
    }

    // Create a simple session token
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64")

    const response = NextResponse.json({
      token,
      user_id: user.id,
      username: user.username,
      company_name: user.company_name,
    })

    response.cookies.set("sb-auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}
