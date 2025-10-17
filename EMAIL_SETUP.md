# Email Blast Setup Guide

This guide will help you configure the Outlook email integration for your CRM email blast functionality.

## Prerequisites

You'll need:
- Your Outlook email address that you want to send emails from
- Either your email password or an App Password (recommended for security)

## Setup Instructions

### Step 1: Enable App Passwords in Outlook (Recommended)

For security, it's recommended to use an App Password instead of your main email password.

1. Go to [Microsoft Account Security](https://account.microsoft.com/security)
2. Sign in with your Outlook account
3. Go to "Security" → "Advanced security options"
4. Under "App passwords", click "Create a new app password"
5. Give it a name like "KreativLab CRM"
6. Copy the generated app password (you'll need this in Step 2)

### Step 2: Configure Environment Variables

Update the `.env` file in your project root with your Outlook credentials:

```env
# Email Configuration (Outlook SMTP)
OUTLOOK_EMAIL=your-email@outlook.com
OUTLOOK_PASSWORD=your-app-password-or-regular-password
```

**Replace:**
- `your-email@outlook.com` with your actual Outlook email address
- `your-app-password-or-regular-password` with either:
  - The App Password you generated in Step 1 (recommended)
  - Your regular email password (less secure)

### Step 3: Deploy to Production

After updating the environment variables:

1. **For Vercel deployment:** Add the environment variables in your Vercel dashboard:
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add `OUTLOOK_EMAIL` and `OUTLOOK_PASSWORD`

2. **For other hosting platforms:** Follow their environment variable configuration guide

## Email Blast Features

Once configured, your CRM will support:

### ✅ Bulk Email Selection
- Select individual contacts or use "Select All"
- Only active contacts with valid emails can be selected
- Real-time selection counter

### ✅ Email Template Variables
Your emails support personalization variables:
- `{{firstName}}` - Contact's first name
- `{{lastName}}` - Contact's last name
- `{{company}}` - Contact's company name
- `{{email}}` - Contact's email address

### ✅ Professional Email Format
- Emails are sent in both plain text and HTML format
- Automatic signature with your company branding
- Professional styling and formatting

### ✅ Delivery Tracking
- Real-time sending progress
- Success/failure reporting for each email
- Error logging for troubleshooting

## Example Email Template

```
Subject: Exclusive Dental Administrative Support Services for {{company}}

Hi {{firstName}},

I hope this email finds you well. I'm reaching out from Happy Teeth Support Services because I noticed that {{company}} might benefit from our specialized dental administrative support services.

We help dental practices like yours by providing:
- Virtual front desk support
- Insurance claim processing
- Patient appointment management
- Administrative task automation

Would you be interested in a brief 15-minute call to discuss how we can help {{company}} streamline operations and increase profitability?

Best regards,
{{senderName}}
```

## Troubleshooting

### Common Issues:

1. **"Authentication failed" error:**
   - Double-check your email and password/app password
   - Ensure you're using an App Password if 2FA is enabled
   - Verify the email address is correct

2. **"Connection refused" error:**
   - Check your internet connection
   - Verify Outlook SMTP settings haven't changed

3. **Emails not being delivered:**
   - Check if emails are going to spam folders
   - Verify recipient email addresses are valid
   - Consider adding a SPF/DKIM record for your domain

### Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your environment variables are set correctly
3. Test with a small batch of emails first
4. Contact your development team for technical support

## Security Best Practices

- ✅ Use App Passwords instead of regular passwords
- ✅ Keep environment variables secure and never commit them to version control
- ✅ Regularly rotate App Passwords
- ✅ Monitor email sending for suspicious activity
- ✅ Test email templates before sending to large lists

---

**Ready to start your email campaigns!** 🚀

Your CRM is now configured for professional email blasting with Outlook integration.