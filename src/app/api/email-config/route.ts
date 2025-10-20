import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export interface EmailConfig {
  provider: 'gmail' | 'outlook' | 'smtp'
  email: string
  password?: string
  appPassword?: string
  host?: string
  port?: number
  secure?: boolean
  senderName: string
  isActive: boolean
}

// In a real app, this would be stored in a database
// For now, we'll use environment variables and localStorage on the client
const getEmailConfig = (): EmailConfig => {
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

export async function GET() {
  try {
    const config = getEmailConfig()

    // Remove sensitive data before sending to client
    const safeConfig = {
      ...config,
      password: undefined,
      appPassword: undefined
    }

    return NextResponse.json({
      success: true,
      config: safeConfig
    })
  } catch (error) {
    console.error('Error getting email config:', error)
    return NextResponse.json(
      { error: 'Failed to get email configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json()

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      )
    }

    const config = getEmailConfig()

    if (!config.isActive) {
      return NextResponse.json(
        { error: 'No email configuration is currently active' },
        { status: 400 }
      )
    }

    // Test email sending
    let transporter

    switch (config.provider) {
      case 'gmail':
        transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: config.email,
            pass: config.appPassword
          }
        })
        break

      case 'outlook':
        transporter = nodemailer.createTransporter({
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: config.email,
            pass: config.password
          }
        })
        break

      case 'smtp':
        transporter = nodemailer.createTransporter({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: {
            user: config.email,
            pass: config.password
          }
        })
        break
    }

    const info = await transporter.sendMail({
      from: `"${config.senderName}" <${config.email}>`,
      to: testEmail,
      subject: 'Email Configuration Test - Happy Teeth CRM',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Configuration Test</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Configuration Details:</h3>
            <ul style="color: #6b7280;">
              <li><strong>Provider:</strong> ${config.provider.toUpperCase()}</li>
              <li><strong>From Email:</strong> ${config.email}</li>
              <li><strong>Sender Name:</strong> ${config.senderName}</li>
              <li><strong>Test Time:</strong> ${new Date().toLocaleString()}</li>
            </ul>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            If you received this email, your email configuration is working correctly!
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Happy Teeth Support Services - Administrative Excellence Team
          </p>
        </div>
      `
    })

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      provider: config.provider,
      from: config.email
    })

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      {
        error: 'Test email failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}