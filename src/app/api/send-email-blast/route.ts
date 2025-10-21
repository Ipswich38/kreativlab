import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { NextRequest, NextResponse } from 'next/server'
import { EmailConfig } from '../email-config/route'

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

// Get email configuration based on environment variables
function getEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER as 'gmail' | 'outlook' | 'smtp') || 'outlook'

  switch (provider) {
    case 'gmail':
      return {
        provider: 'gmail',
        email: process.env.GMAIL_EMAIL || '',
        appPassword: process.env.GMAIL_APP_PASSWORD || '',
        senderName: process.env.GMAIL_SENDER_NAME || 'Happy Teeth Support Services',
        isActive: !!(process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD)
      }

    case 'outlook':
      return {
        provider: 'outlook',
        email: process.env.OUTLOOK_EMAIL || '',
        password: process.env.OUTLOOK_PASSWORD || '',
        senderName: process.env.OUTLOOK_SENDER_NAME || 'Happy Teeth Support Services',
        isActive: !!(process.env.OUTLOOK_EMAIL && process.env.OUTLOOK_PASSWORD)
      }

    case 'smtp':
      return {
        provider: 'smtp',
        email: process.env.SMTP_EMAIL || '',
        password: process.env.SMTP_PASSWORD || '',
        host: process.env.SMTP_HOST || '',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        senderName: process.env.SMTP_SENDER_NAME || 'Happy Teeth Support Services',
        isActive: !!(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && process.env.SMTP_HOST)
      }

    default:
      return {
        provider: 'outlook',
        email: '',
        senderName: 'Happy Teeth Support Services',
        isActive: false
      }
  }
}

// Create email transporter based on configuration
function createEmailTransporter(config: EmailConfig) {
  switch (config.provider) {
    case 'gmail':
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.email,
          pass: config.appPassword
        }
      })

    case 'outlook':
      return nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: config.email,
          pass: config.password
        },
        tls: {
          rejectUnauthorized: false
        }
      })

    case 'smtp':
      return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.email,
          pass: config.password
        }
      })

    default:
      throw new Error('Invalid email provider configuration')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { contacts, subject, message }: EmailRequest = await request.json()

    // Validate request
    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ error: 'No contacts provided' }, { status: 400 })
    }

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
    }

    // Get email configuration
    const emailConfig = getEmailConfig()

    if (!emailConfig.isActive) {
      return NextResponse.json({
        error: 'No email provider is configured. Please configure an email provider in settings.'
      }, { status: 400 })
    }

    console.log(`Using ${emailConfig.provider.toUpperCase()} email service...`)

    const results = []
    const errors = []

    // Try Resend first if configured
    if (process.env.RESEND_API_KEY) {
      console.log('Using Resend email service...')
      const resend = new Resend(process.env.RESEND_API_KEY)

      for (const contact of contacts) {
        try {
          console.log(`Sending email via Resend to: ${contact.email}`)

          const personalizedMessage = replaceTemplateVariables(message, contact)
          const personalizedSubject = replaceTemplateVariables(subject, contact)
          const htmlMessage = personalizedMessage.replace(/\n/g, '<br>')

          const { data, error } = await resend.emails.send({
            from: `${emailConfig.senderName} <onboarding@resend.dev>`,
            to: [contact.email],
            subject: personalizedSubject,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                ${htmlMessage}
                <br><br>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                  <p>Best regards,<br>
                  <strong>${emailConfig.senderName}</strong><br>
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
      // Use configured SMTP provider
      const transporter = createEmailTransporter(emailConfig)

      for (const contact of contacts) {
        try {
          console.log(`Sending via ${emailConfig.provider.toUpperCase()} to: ${contact.email}`)

          const personalizedMessage = replaceTemplateVariables(message, contact)
          const personalizedSubject = replaceTemplateVariables(subject, contact)
          const htmlMessage = personalizedMessage.replace(/\n/g, '<br>')

          const mailOptions = {
            from: `"${emailConfig.senderName}" <${emailConfig.email}>`,
            to: contact.email,
            subject: personalizedSubject,
            text: personalizedMessage,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                ${htmlMessage}
                <br><br>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                  <p>Best regards,<br>
                  <strong>${emailConfig.senderName}</strong><br>
                  Happy Teeth Support Services<br>
                  Professional Dental Administrative Support</p>
                </div>
              </div>
            `
          }

          const info = await transporter.sendMail(mailOptions)
          console.log(`${emailConfig.provider.toUpperCase()} email sent to ${contact.email}:`, info.messageId)

          results.push({
            contact: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            status: 'sent',
            messageId: info.messageId,
            service: emailConfig.provider
          })

          await new Promise(resolve => setTimeout(resolve, 100))

        } catch (error) {
          console.error(`${emailConfig.provider.toUpperCase()} failed for ${contact.email}:`, error)
          errors.push({
            contact: `${contact.firstName} ${contact.lastName}`,
            email: contact.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }

      transporter.close()
    }

    return NextResponse.json({
      success: true,
      message: `Email blast completed using ${emailConfig.provider.toUpperCase()}. ${results.length} emails sent successfully.`,
      provider: emailConfig.provider,
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