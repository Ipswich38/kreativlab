import nodemailer from 'nodemailer'
import { Resend } from 'resend'
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

    const results = []
    const errors = []

    // Try Resend first (more reliable for production)
    if (process.env.RESEND_API_KEY) {
      console.log('Using Resend email service...')
      const resend = new Resend(process.env.RESEND_API_KEY)

      for (const contact of contacts) {
        try {
          console.log(`Sending email via Resend to: ${contact.email}`)

          // Replace template variables
          const personalizedMessage = replaceTemplateVariables(message, contact)
          const personalizedSubject = replaceTemplateVariables(subject, contact)
          const htmlMessage = personalizedMessage.replace(/\n/g, '<br>')

          const { data, error } = await resend.emails.send({
            from: `${senderName} <onboarding@resend.dev>`, // Resend default domain
            to: [contact.email],
            subject: personalizedSubject,
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
            `,
            text: personalizedMessage
          })

          if (error) {
            throw new Error(error.message)
          }

          console.log(`Email sent successfully via Resend to ${contact.email}:`, data?.id)
          results.push({
            contact: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            status: 'sent',
            messageId: data?.id,
            service: 'resend'
          })

          // Small delay between emails
          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          console.error(`Resend failed for ${contact.email}:`, error)
          errors.push({
            contact: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    } else {
      // Use Gmail SMTP as primary fallback
      console.log('Resend not configured, using Gmail SMTP...')

      let transporter;

      // Try Gmail first (more reliable)
      if (process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
        console.log('Using Gmail SMTP configuration...')
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_EMAIL,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });
      } else {
        console.log('Gmail not configured, falling back to Outlook...')
        try {
          transporter = nodemailer.createTransport({
            service: 'hotmail',
            auth: {
              user: process.env.OUTLOOK_EMAIL || 'support@happyteethsupportservices.com',
              pass: process.env.OUTLOOK_PASSWORD || 'Robes2013$'
            }
          });
        } catch (error) {
          console.log('Hotmail service failed, trying manual config...');
          transporter = nodemailer.createTransport({
            host: 'smtp-mail.outlook.com',
            port: 587,
            secure: false,
            auth: {
              user: process.env.OUTLOOK_EMAIL || 'support@happyteethsupportservices.com',
              pass: process.env.OUTLOOK_PASSWORD || 'Robes2013$'
            },
            tls: {
              rejectUnauthorized: false,
              minVersion: 'TLSv1'
            },
            ignoreTLS: false,
            requireTLS: true
          });
        }
      }

      for (const contact of contacts) {
        try {
          console.log(`Attempting SMTP send to: ${contact.email}`)

          const personalizedMessage = replaceTemplateVariables(message, contact)
          const personalizedSubject = replaceTemplateVariables(subject, contact)
          const htmlMessage = personalizedMessage.replace(/\n/g, '<br>')

          const fromEmail = process.env.GMAIL_EMAIL || process.env.OUTLOOK_EMAIL || 'support@happyteethsupportservices.com';
          const mailOptions = {
            from: `"${senderName}" <${fromEmail}>`,
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

          const info = await transporter.sendMail(mailOptions)
          console.log(`SMTP email sent to ${contact.email}:`, info.messageId)

          results.push({
            contact: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            status: 'sent',
            messageId: info.messageId,
            service: 'smtp'
          })

          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          console.error(`SMTP failed for ${contact.email}:`, error)
          errors.push({
            contact: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      if (transporter) {
        transporter.close()
      }
    }

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