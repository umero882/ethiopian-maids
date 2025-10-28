/**
 * Email Notification Service
 * Handles sending email notifications for job applications and other events
 *
 * Setup Instructions:
 * 1. Install nodemailer: npm install nodemailer
 * 2. Choose an email provider:
 *    - Gmail: Use app-specific password
 *    - SendGrid: Get API key from sendgrid.com
 *    - AWS SES: Configure AWS credentials
 * 3. Add environment variables to .env:
 *    EMAIL_SERVICE=gmail (or 'sendgrid', 'ses')
 *    EMAIL_FROM=noreply@ethiopianmaids.com
 *    EMAIL_USER=your-email@gmail.com
 *    EMAIL_PASSWORD=your-app-password
 *    OR
 *    SENDGRID_API_KEY=your-sendgrid-api-key
 */

import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'noreply@ethiopianmaids.com';
    this.initialized = false;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on configuration
   */
  initializeTransporter() {
    const emailService = process.env.EMAIL_SERVICE || 'gmail';

    try {
      if (emailService === 'sendgrid' && process.env.SENDGRID_API_KEY) {
        // SendGrid configuration
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false, // Use STARTTLS
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          },
          tls: {
            rejectUnauthorized: false // Allow self-signed certificates in development
          }
        });
        this.initialized = true;
        console.log('✅ Email service initialized with SendGrid');
      } else if (emailService === 'gmail' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        // Gmail configuration
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
        this.initialized = true;
        console.log('✅ Email service initialized with Gmail');
      } else if (emailService === 'ses' && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        // AWS SES configuration
        this.transporter = nodemailer.createTransport({
          host: `email.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`,
          port: 587,
          auth: {
            user: process.env.AWS_ACCESS_KEY_ID,
            pass: process.env.AWS_SECRET_ACCESS_KEY
          }
        });
        this.initialized = true;
        console.log('✅ Email service initialized with AWS SES');
      } else {
        console.warn('⚠️  Email service not configured - email notifications will not be sent');
        console.warn('   Add EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASSWORD to .env');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  /**
   * Send new job application notification to sponsor
   */
  async sendNewApplicationNotification(sponsorEmail, sponsorName, jobTitle, maidName, applicationId) {
    if (!this.initialized) {
      console.log('📧 [DEV MODE] Would send application notification to:', sponsorEmail);
      return { success: true, development: true };
    }

    const subject = `New Application for ${jobTitle}`;
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #9333ea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .info-box { background: white; padding: 15px; border-left: 4px solid #9333ea; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Job Application</h1>
            </div>
            <div class="content">
              <p>Hello ${sponsorName},</p>

              <p>Great news! You have received a new application for your job posting.</p>

              <div class="info-box">
                <strong>Job Position:</strong> ${jobTitle}<br>
                <strong>Applicant:</strong> ${maidName}<br>
                <strong>Applied:</strong> ${new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>

              <p>Review the application and candidate profile to see if they're a good fit for your position.</p>

              <center>
                <a href="${process.env.VITE_APP_URL}/dashboard/sponsor/applications/${applicationId}" class="button">
                  Review Application
                </a>
              </center>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                <strong>Tip:</strong> Respond to applications quickly to increase your chances of hiring top candidates.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Ethiopian Maids. All rights reserved.</p>
              <p>
                <a href="${process.env.VITE_APP_URL}/dashboard/sponsor/settings">Notification Settings</a> |
                <a href="${process.env.VITE_APP_URL}/support">Support</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"Ethiopian Maids" <${this.from}>`,
        to: sponsorEmail,
        subject,
        html
      });

      console.log(`✅ Application notification sent to ${sponsorEmail} - Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send application notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send application status update notification to maid
   */
  async sendApplicationStatusUpdateNotification(maidEmail, maidName, jobTitle, status, sponsorMessage = null) {
    if (!this.initialized) {
      console.log('📧 [DEV MODE] Would send status update to:', maidEmail);
      return { success: true, development: true };
    }

    const statusMessages = {
      reviewed: { emoji: '👀', title: 'Application Reviewed', message: 'Your application has been reviewed by the sponsor.' },
      shortlisted: { emoji: '⭐', title: 'Congratulations! You\'ve Been Shortlisted', message: 'Great news! The sponsor is interested in your profile.' },
      interviewed: { emoji: '🎙️', title: 'Interview Scheduled', message: 'The sponsor wants to interview you for this position.' },
      offered: { emoji: '🎉', title: 'Job Offer Received!', message: 'Congratulations! You\'ve received a job offer.' },
      accepted: { emoji: '✅', title: 'Application Accepted', message: 'Your application has been accepted!' },
      rejected: { emoji: '📝', title: 'Application Status Update', message: 'Thank you for your interest in this position.' }
    };

    const statusInfo = statusMessages[status] || statusMessages.reviewed;
    const subject = `${statusInfo.emoji} ${statusInfo.title} - ${jobTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #9333ea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .status-badge { display: inline-block; padding: 8px 16px; background: #e0e7ff; color: #6366f1; border-radius: 20px; font-weight: bold; text-transform: capitalize; }
            .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9333ea; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${statusInfo.emoji} ${statusInfo.title}</h1>
            </div>
            <div class="content">
              <p>Hello ${maidName},</p>

              <p>${statusInfo.message}</p>

              <div style="text-align: center; margin: 20px 0;">
                <p><strong>Position:</strong> ${jobTitle}</p>
                <span class="status-badge">Status: ${status}</span>
              </div>

              ${sponsorMessage ? `
                <div class="message-box">
                  <strong>Message from Sponsor:</strong>
                  <p>${sponsorMessage}</p>
                </div>
              ` : ''}

              <center>
                <a href="${process.env.VITE_APP_URL}/dashboard/maid/applications" class="button">
                  View Application
                </a>
              </center>

              ${status === 'rejected' ? `
                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                  Don't be discouraged! Keep applying to other positions that match your skills and experience.
                </p>
              ` : ''}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Ethiopian Maids. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"Ethiopian Maids" <${this.from}>`,
        to: maidEmail,
        subject,
        html
      });

      console.log(`✅ Status update sent to ${maidEmail} - Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send status update:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send weekly job digest to sponsors
   */
  async sendWeeklyJobDigest(sponsorEmail, sponsorName, stats) {
    if (!this.initialized) {
      console.log('📧 [DEV MODE] Would send weekly digest to:', sponsorEmail);
      return { success: true, development: true };
    }

    const subject = `📊 Your Weekly Job Digest`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .stat-card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 36px; font-weight: bold; color: #9333ea; }
            .stat-label { color: #666; font-size: 14px; }
            .button { display: inline-block; padding: 12px 30px; background: #9333ea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Your Weekly Summary</h1>
            </div>
            <div class="content">
              <p>Hello ${sponsorName},</p>

              <p>Here's a summary of your job postings from the past week:</p>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div class="stat-card">
                  <div class="stat-number">${stats.newApplications || 0}</div>
                  <div class="stat-label">New Applications</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.totalViews || 0}</div>
                  <div class="stat-label">Job Views</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.activeJobs || 0}</div>
                  <div class="stat-label">Active Jobs</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${stats.pendingReviews || 0}</div>
                  <div class="stat-label">Pending Reviews</div>
                </div>
              </div>

              <center>
                <a href="${process.env.VITE_APP_URL}/dashboard/sponsor/jobs" class="button">
                  View Dashboard
                </a>
              </center>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Ethiopian Maids. All rights reserved.</p>
              <p><a href="${process.env.VITE_APP_URL}/dashboard/sponsor/settings">Manage Email Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      const info = await this.transporter.sendMail({
        from: `"Ethiopian Maids" <${this.from}>`,
        to: sponsorEmail,
        subject,
        html
      });

      console.log(`✅ Weekly digest sent to ${sponsorEmail}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send weekly digest:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if email service is configured
   */
  isConfigured() {
    return this.initialized;
  }
}

// Create singleton instance
export const emailService = new EmailService();
export default emailService;
