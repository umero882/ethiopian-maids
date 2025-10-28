/**
 * Ethiopian Maids - Backend API Server
 * Handles Twilio SMS sending and other backend operations
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import twilio from 'twilio';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables FIRST before importing emailService
dotenv.config({ path: join(__dirname, '..', '.env') });

// Dynamic import of emailService after environment is loaded
let emailService;
(async () => {
  const module = await import('./emailService.js');
  emailService = module.emailService;
})();

const app = express();
const PORT = process.env.PORT || 3001;

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.VITE_TWILIO_PHONE_NUMBER;

// Initialize Twilio client
let twilioClient;
try {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized successfully');
  } else {
    console.warn('⚠️  Twilio credentials not found - SMS sending will not work');
  }
} catch (error) {
  console.error('❌ Failed to initialize Twilio client:', error.message);
}

// Middleware
app.use(cors({
  origin: process.env.VITE_APP_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    twilio: {
      configured: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER),
      accountSid: TWILIO_ACCOUNT_SID ? `${TWILIO_ACCOUNT_SID.substring(0, 10)}...` : null,
      phoneNumber: TWILIO_PHONE_NUMBER || null
    },
    email: {
      configured: emailService.isConfigured()
    }
  });
});

// Send verification SMS endpoint
app.post('/api/sms/send-verification', async (req, res) => {
  try {
    const { phoneNumber, code, message } = req.body;

    // Validate inputs
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    if (!code || code.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Valid 6-digit code is required'
      });
    }

    // Check if Twilio is configured
    if (!twilioClient) {
      console.warn('⚠️  Twilio not configured - returning mock success for development');
      return res.json({
        success: true,
        messageSid: 'DEV_MODE_' + Date.now(),
        development: true,
        message: 'Development mode - no SMS sent. Use code: ' + code
      });
    }

    // Validate phone number format (E.164)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be E.164 format (e.g., +12025551234)'
      });
    }

    // Send SMS via Twilio
    console.log(`📤 Sending SMS to ${phoneNumber} with code: ${code}`);

    const twilioMessage = await twilioClient.messages.create({
      body: message || `Your Ethiopian Maids verification code is: ${code}. Valid for 10 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`✅ SMS sent successfully - SID: ${twilioMessage.sid}`);

    res.json({
      success: true,
      messageSid: twilioMessage.sid,
      status: twilioMessage.status,
      dateCreated: twilioMessage.dateCreated
    });
  } catch (error) {
    console.error('❌ Error sending SMS:', error);

    // Handle Twilio-specific errors
    if (error.code) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        moreInfo: error.moreInfo
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send SMS'
    });
  }
});

// Send 2FA SMS endpoint
app.post('/api/sms/send-2fa', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    if (!twilioClient) {
      console.warn('⚠️  Twilio not configured - returning mock success for development');
      return res.json({
        success: true,
        messageSid: 'DEV_MODE_2FA_' + Date.now(),
        development: true,
        expiresIn: 300
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Send SMS
    const twilioMessage = await twilioClient.messages.create({
      body: `Your Ethiopian Maids 2FA code is: ${code}. Valid for 5 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`✅ 2FA SMS sent - SID: ${twilioMessage.sid}`);

    res.json({
      success: true,
      messageSid: twilioMessage.sid,
      expiresIn: 300 // 5 minutes
    });
  } catch (error) {
    console.error('❌ Error sending 2FA SMS:', error);

    if (error.code) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send 2FA code'
    });
  }
});

// ============================================================================
// EMAIL NOTIFICATION ENDPOINTS
// ============================================================================

// Send new application notification
app.post('/api/email/new-application', async (req, res) => {
  try {
    const { sponsorEmail, sponsorName, jobTitle, maidName, applicationId } = req.body;

    // Validate inputs
    if (!sponsorEmail || !sponsorName || !jobTitle || !maidName || !applicationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const result = await emailService.sendNewApplicationNotification(
      sponsorEmail,
      sponsorName,
      jobTitle,
      maidName,
      applicationId
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Error sending application notification:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email notification'
    });
  }
});

// Send application status update notification
app.post('/api/email/status-update', async (req, res) => {
  try {
    const { maidEmail, maidName, jobTitle, status, sponsorMessage } = req.body;

    // Validate inputs
    if (!maidEmail || !maidName || !jobTitle || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const result = await emailService.sendApplicationStatusUpdateNotification(
      maidEmail,
      maidName,
      jobTitle,
      status,
      sponsorMessage
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Error sending status update:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email notification'
    });
  }
});

// Send weekly digest
app.post('/api/email/weekly-digest', async (req, res) => {
  try {
    const { sponsorEmail, sponsorName, stats } = req.body;

    if (!sponsorEmail || !sponsorName || !stats) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const result = await emailService.sendWeeklyJobDigest(
      sponsorEmail,
      sponsorName,
      stats
    );

    res.json(result);
  } catch (error) {
    console.error('❌ Error sending weekly digest:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email notification'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Ethiopian Maids API Server');
  console.log('='.repeat(60));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📱 SMS endpoint: http://localhost:${PORT}/api/sms/send-verification`);
  console.log('\n📋 Twilio Configuration:');
  console.log(`   Account SID: ${TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Auth Token: ${TWILIO_AUTH_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Phone Number: ${TWILIO_PHONE_NUMBER || '❌ Missing'}`);
  console.log('\n' + '='.repeat(60) + '\n');
});

export default app;
