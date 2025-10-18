import nodemailer from 'nodemailer'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('Testing email configuration...')
    console.log('OUTLOOK_EMAIL:', process.env.OUTLOOK_EMAIL)
    console.log('OUTLOOK_PASSWORD exists:', !!process.env.OUTLOOK_PASSWORD)

    // Try multiple SMTP configurations
    const configs = [
      {
        name: 'Office365',
        config: {
          host: 'smtp.office365.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.OUTLOOK_EMAIL || 'support@happyteethsupportservices.com',
            pass: process.env.OUTLOOK_PASSWORD || 'Robes2013$'
          },
          tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
          },
          requireTLS: true
        }
      },
      {
        name: 'Hotmail Service',
        config: {
          service: 'hotmail',
          auth: {
            user: process.env.OUTLOOK_EMAIL || 'support@happyteethsupportservices.com',
            pass: process.env.OUTLOOK_PASSWORD || 'Robes2013$'
          }
        }
      },
      {
        name: 'Outlook.com',
        config: {
          host: 'smtp-mail.outlook.com',
          port: 587,
          secure: false,
          auth: {
            user: process.env.OUTLOOK_EMAIL || 'support@happyteethsupportservices.com',
            pass: process.env.OUTLOOK_PASSWORD || 'Robes2013$'
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      }
    ]

    const results = []

    for (const { name, config } of configs) {
      try {
        console.log(`Testing ${name} configuration...`)
        const transporter = nodemailer.createTransport(config)
        await transporter.verify()
        results.push({ config: name, status: 'success', message: 'Connection verified' })
        transporter.close()
      } catch (error) {
        console.error(`${name} failed:`, error)
        results.push({
          config: name,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email configuration test completed',
      results,
      credentials: {
        email: process.env.OUTLOOK_EMAIL || 'support@happyteethsupportservices.com',
        passwordSet: !!(process.env.OUTLOOK_PASSWORD || 'Robes2013$')
      }
    })

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json(
      {
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        credentials: {
          email: process.env.OUTLOOK_EMAIL || 'support@happyteethsupportservices.com',
          passwordSet: !!(process.env.OUTLOOK_PASSWORD || 'Robes2013$')
        }
      },
      { status: 500 }
    )
  }
}