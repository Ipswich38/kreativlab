import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'

interface EmailContact {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  phone?: string
  tags: string[]
  status: 'active' | 'inactive' | 'bounced'
  createdAt: string
}

interface EmailRequest {
  contacts: EmailContact[]
  subject: string
  message: string
  senderName: string
}

// Template variable replacement function
function replaceTemplateVariables(template: string, contact: EmailContact): string {
  return template
    .replace(/\{\{firstName\}\}/g, contact.firstName)
    .replace(/\{\{lastName\}\}/g, contact.lastName)
    .replace(/\{\{company\}\}/g, contact.company)
    .replace(/\{\{email\}\}/g, contact.email)
}

export async function POST(request: NextRequest) {
  try {
    const { contacts, subject, message, senderName }: EmailRequest = await request.json()

    // Validate request
    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    // Configure Outlook SMTP with client's credentials
    // Note: Replace these with actual environment variables for security
    const transporter = nodemailer.createTransport({
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.OUTLOOK_EMAIL || 'your-client-email@outlook.com', // Client's Outlook email
        pass: process.env.OUTLOOK_PASSWORD || 'your-client-password', // Client's Outlook password or app password
      },
      tls: {
        ciphers: 'SSLv3'
      }
    })

    // Verify connection configuration
    try {
      await transporter.verify()
    } catch (error) {
      console.error('SMTP configuration error:', error)
      return NextResponse.json({ error: 'Email server configuration error' }, { status: 500 })
    }

    const results = []
    const errors = []

    // Send emails to each contact
    for (const contact of contacts) {
      try {
        // Replace template variables in message
        const personalizedMessage = replaceTemplateVariables(message, contact)
        const personalizedSubject = replaceTemplateVariables(subject, contact)

        // Create HTML version of the email
        const htmlMessage = personalizedMessage.replace(/\n/g, '<br>')

        const mailOptions = {
          from: `"${senderName}" <${process.env.OUTLOOK_EMAIL}>`,
          to: contact.email,
          subject: personalizedSubject,
          text: personalizedMessage,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              ${htmlMessage}
              <br><br>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                <p>Best regards,<br>
                <strong>${senderName}</strong><br>
                Happy Teeth Support Services<br>
                Professional Dental Administrative Support</p>
              </div>
            </div>
          `
        }

        await transporter.sendMail(mailOptions)
        results.push({
          contact: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          status: 'sent'
        })

        // Add a small delay between emails to avoid overwhelming the SMTP server
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Failed to send email to ${contact.email}:`, error)
        errors.push({
          contact: `${contact.firstName} ${contact.lastName}`,
          email: contact.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Close the transporter
    transporter.close()

    return NextResponse.json({
      success: true,
      message: `Email blast completed. ${results.length} emails sent successfully.`,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Email blast error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}