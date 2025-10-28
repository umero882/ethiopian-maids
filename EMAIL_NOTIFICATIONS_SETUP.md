# Email Notifications Setup Guide

This guide will help you configure email notifications for the Ethiopian Maids platform.

## Overview

The platform supports email notifications for:
- ✉️ **New job applications** - Notify sponsors when maids apply to their jobs
- 📊 **Application status updates** - Notify maids when their application status changes
- 📈 **Weekly digests** - Send sponsors a weekly summary of their job postings

## Prerequisites

1. Node.js email package (nodemailer)
2. An email service provider account (choose one):
   - Gmail (Free, easy setup)
   - SendGrid (Reliable, good for production)
   - AWS SES (Cost-effective for high volume)

## Installation

### Step 1: Install Nodemailer

```bash
cd server
npm install nodemailer
```

### Step 2: Choose Your Email Provider

#### Option A: Gmail (Recommended for Development)

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Visit: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

4. Add to your `.env` file:
```env
EMAIL_SERVICE=gmail
EMAIL_FROM=noreply@your domain.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

#### Option B: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com
2. Create an API key in Settings → API Keys
3. Verify your sender email/domain
4. Add to your `.env` file:
```env
EMAIL_SERVICE=sendgrid
EMAIL_FROM=noreply@yourdomain.com
SENDGRID_API_KEY=SG.your-api-key-here
```

#### Option C: AWS SES

1. Sign up for AWS account
2. Verify your email/domain in AWS SES
3. Create IAM credentials with SES send permissions
4. Add to your `.env` file:
```env
EMAIL_SERVICE=ses
EMAIL_FROM=noreply@yourdomain.com
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Step 3: Restart Your Server

```bash
npm run dev
```

You should see:
```
✅ Email service initialized with Gmail (or SendGrid/SES)
```

## Testing Email Notifications

### Method 1: Via API

Test the new application notification:

```bash
curl -X POST http://localhost:3001/api/email/new-application \
  -H "Content-Type: application/json" \
  -d '{
    "sponsorEmail": "sponsor@example.com",
    "sponsorName": "John Doe",
    "jobTitle": "Live-in Housekeeper",
    "maidName": "Jane Smith",
    "applicationId": "123-456-789"
  }'
```

Test the status update notification:

```bash
curl -X POST http://localhost:3001/api/email/status-update \
  -H "Content-Type: application/json" \
  -d '{
    "maidEmail": "maid@example.com",
    "maidName": "Jane Smith",
    "jobTitle": "Live-in Housekeeper",
    "status": "shortlisted",
    "sponsorMessage": "We would like to interview you!"
  }'
```

### Method 2: From the Application

The platform automatically sends emails when:
1. A maid applies to a job (sponsor receives notification)
2. A sponsor changes an application status (maid receives notification)

## Email Templates

The system includes three professionally designed email templates:

### 1. New Application Notification (to Sponsors)
- Purple gradient header with emoji
- Application details in info box
- "Review Application" CTA button
- Quick response tip

### 2. Application Status Update (to Maids)
- Status-specific emoji and title
- Visual status badge
- Optional message from sponsor
- "View Application" CTA button
- Encouragement for rejected applications

### 3. Weekly Job Digest (to Sponsors)
- Statistics cards with metrics
- New applications count
- Total views
- Active jobs
- Pending reviews

## Customization

### Modify Email Templates

Edit the HTML templates in `server/emailService.js`:

```javascript
// Find the template you want to modify
async sendNewApplicationNotification(...) {
  const html = `
    <!-- Your custom HTML here -->
  `;
}
```

### Change Email Branding

Update these values in the templates:
- **Colors**: Change `#9333ea` (purple) to your brand color
- **Logo**: Add `<img src="your-logo-url">` in the header
- **Footer**: Update company name and links

### Add New Email Types

1. Create a new method in `server/emailService.js`:
```javascript
async sendYourCustomEmail(params) {
  // Your implementation
}
```

2. Add a new endpoint in `server/index.js`:
```javascript
app.post('/api/email/your-custom-email', async (req, res) => {
  // Call your method
});
```

## Database Integration

### Automatic Notifications with Supabase

To automatically send emails when applications are created/updated, you can use Supabase Edge Functions or database triggers.

Example: Create a Supabase Edge Function that calls your email API:

```javascript
// supabase/functions/notify-application/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { record } = await req.json()

  // Send email notification
  await fetch('http://your-backend-url/api/email/new-application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sponsorEmail: record.sponsor_email,
      // ... other fields
    })
  })

  return new Response('OK')
})
```

## Troubleshooting

### Emails Not Sending

1. **Check server logs** for error messages
2. **Verify credentials** in `.env` file
3. **Check spam folder** for test emails
4. **Verify sender email** is authenticated with provider
5. **Check daily limits** (Gmail: 500/day, SendGrid varies by plan)

### "Authentication Failed" Error

- **Gmail**: Make sure you're using an App Password, not your regular password
- **SendGrid**: Verify API key is correct and has send permissions
- **AWS SES**: Check IAM permissions and verify email/domain

### Emails Going to Spam

1. **Set up SPF records** for your domain
2. **Set up DKIM** authentication
3. **Verify sender domain** with your email provider
4. **Add unsubscribe link** in email footer
5. **Avoid spam trigger words** in subject/body

## Production Checklist

Before going live:

- [ ] Use a production email service (SendGrid or AWS SES)
- [ ] Verify your sending domain
- [ ] Set up SPF, DKIM, and DMARC records
- [ ] Configure rate limiting to prevent abuse
- [ ] Add email preference management for users
- [ ] Set up monitoring and alerts for failed emails
- [ ] Test all email templates on multiple devices/clients
- [ ] Comply with email marketing regulations (CAN-SPAM, GDPR)

## Email Preference Management

To implement email preferences:

1. Add a `notification_preferences` column to the profiles table
2. Create a settings page where users can toggle:
   - New applications notifications
   - Status update notifications
   - Weekly digest
   - Marketing emails

3. Check preferences before sending:
```javascript
if (user.notification_preferences.newApplications) {
  await emailService.sendNewApplicationNotification(...)
}
```

## Cost Estimates

### Gmail
- **Cost**: Free
- **Limit**: 500 emails/day
- **Best for**: Development and small-scale testing

### SendGrid
- **Free tier**: 100 emails/day
- **Essentials**: $15/month for 40,000 emails
- **Best for**: Production with moderate volume

### AWS SES
- **Cost**: $0.10 per 1,000 emails
- **Limit**: 200 emails/day (free tier), unlimited after verification
- **Best for**: High-volume production

## Support

For issues or questions:
- Check server logs at `server/` directory
- Review nodemailer documentation: https://nodemailer.com
- Test with `curl` commands above
- Verify email service provider status pages

## Next Steps

1. ✅ Install nodemailer
2. ✅ Choose and configure email provider
3. ✅ Test email sending
4. 🚀 Integrate with application workflow
5. 📊 Monitor delivery rates
6. 🎨 Customize templates to match your brand

---

**Note**: Email notifications are currently in development mode. When no email service is configured, the system will log email operations without actually sending them. This is perfect for development and testing!
