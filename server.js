import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import twilio from 'twilio';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ES Module __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables (local .env for server)
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const isDev = process.env.NODE_ENV !== 'production';
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : [];

// Initialize Twilio client only if credentials are provided
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error.message);
  }
} else {
  console.log(
    'Twilio credentials not provided - running in development simulation mode'
  );
}

// Security: Helmet with CSP
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: [
    "'self'",
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
    'https://js.stripe.com',
  ],
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
  connectSrc: [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.twilio.com',
    'https://*.stripe.com',
    'https://api.elevenlabs.io',
    'https://api.openai.com',
  ],
  mediaSrc: ["'self'", 'blob:'],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  frameAncestors: ["'none'"],
  upgradeInsecureRequests: [],
};
// Allow inline/eval only in development
if (isDev) {
  cspDirectives.scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
  // Allow local dev servers and websockets
  cspDirectives.connectSrc.push(
    'http://localhost:3001',
    'ws://localhost:3001',
    'http://127.0.0.1:3001',
    'ws://127.0.0.1:3001',
    'http://localhost:5173',
    'ws://localhost:5173'
  );
} else {
  // In production, allow Stripe/Socket if needed
  cspDirectives.connectSrc.push('wss:');
}

app.use(
  helmet({
    contentSecurityPolicy: { directives: cspDirectives },
    crossOriginEmbedderPolicy: false,
  })
);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// Body parsing
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      if (buf.length > 10 * 1024 * 1024)
        throw new Error('Request entity too large');
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use(
  cors({
    origin: isDev ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Extra security headers
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  if (isDev) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token'
  );
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(
  '/mock-documents',
  (req, res, next) => {
    const requestOrigin = req.headers.origin;
    if (isDev) res.set('Access-Control-Allow-Origin', '*');
    else if (requestOrigin && allowedOrigins.includes(requestOrigin))
      res.set('Access-Control-Allow-Origin', requestOrigin);
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    if (req.method === 'OPTIONS') return res.status(200).end();
    next();
  },
  express.static(path.join(__dirname, 'public/mock-documents'))
);

// Basic origin/CSRF check for state-changing requests
function verifyOrigin(req, res) {
  if (isDev) return true;
  const origin = req.headers.origin || '';
  if (!origin || !allowedOrigins.includes(origin)) {
    res
      .status(403)
      .json({ success: false, message: 'Forbidden: Invalid origin' });
    return false;
  }
  // Require CSRF header presence (token value validated client-side)
  if (!req.headers['x-csrf-token']) {
    res.status(400).json({ success: false, message: 'Missing CSRF token' });
    return false;
  }
  return true;
}

// Store verification attempts (use Redis/DB in production)
const verificationAttempts = new Map();

// Send SMS verification code
app.post('/api/sms/send-verification', authLimiter, async (req, res) => {
  if (!verifyOrigin(req, res)) return;
  console.log('SMS verification request received:', {
    phoneNumber: req.body.phoneNumber,
  });
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      console.log('No phone number provided');
      return res
        .status(400)
        .json({ success: false, message: 'Phone number is required' });
    }
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Invalid phone number format. Use E.164 (e.g., +1234567890)',
        });
    }

    const attemptKey = `${phoneNumber}_${Date.now()}`;
    const existingAttempts = Array.from(verificationAttempts.keys())
      .filter((key) => key.startsWith(phoneNumber))
      .filter((key) => Date.now() - parseInt(key.split('_')[1], 10) < 3600000);
    if (existingAttempts.length >= 3) {
      return res
        .status(429)
        .json({
          success: false,
          message: 'Too many verification attempts. Please try again later.',
        });
    }

    if (isDev) {
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      console.log(
        `SMS Verification Code for ${phoneNumber}: ${verificationCode}`
      );
      console.log('Development simulation - no actual SMS sent');
      verificationAttempts.set(attemptKey, {
        phoneNumber,
        timestamp: Date.now(),
        code: verificationCode,
        isDevelopment: true,
      });
      return res.json({
        success: true,
        message: 'Verification code sent successfully',
        data: { status: 'sent', developmentMode: true, verificationCode },
      });
    }

    try {
      if (!twilioClient) throw new Error('Twilio client not initialized');
      if (process.env.TWILIO_VERIFY_SERVICE_SID) {
        console.log('Using Twilio Verify Service for international SMS');
        const verification = await twilioClient.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({ to: phoneNumber, channel: 'sms' });
        console.log(
          'Verification sent via Verify Service:',
          verification.status
        );
        verificationAttempts.set(attemptKey, {
          phoneNumber,
          timestamp: Date.now(),
          verificationSid: verification.sid,
          useVerifyService: true,
        });
        return res.json({
          success: true,
          message: 'Verification code sent successfully',
          data: {
            status: verification.status,
            verificationSid: verification.sid,
          },
        });
      }

      console.log('No Verify Service configured, using direct SMS');
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const message = await twilioClient.messages.create({
        body: `Your Ethio-Maids verification code is: ${verificationCode}. This code will expire in 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      verificationAttempts.set(attemptKey, {
        phoneNumber,
        timestamp: Date.now(),
        code: verificationCode,
        messageSid: message.sid,
      });
      return res.json({
        success: true,
        message: 'Verification code sent successfully',
        data: { messageSid: message.sid, status: message.status },
      });
    } catch (twilioError) {
      console.error('Twilio SMS Error:', twilioError);
      if (twilioError.code === 21211)
        return res
          .status(400)
          .json({ success: false, message: 'Invalid phone number' });
      if (twilioError.code === 21608)
        return res
          .status(400)
          .json({ success: false, message: 'Phone number is not reachable' });
      if (twilioError.code === 21612)
        return res
          .status(400)
          .json({
            success: false,
            message:
              'Geographic restrictions prevent SMS delivery. Using Verify Service to resolve this.',
          });
      return res
        .status(500)
        .json({
          success: false,
          message: 'Failed to send verification code. Please try again.',
        });
    }
  } catch (error) {
    console.error('SMS Send Error:', error);
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to send verification code. Please try again.',
      });
  }
});

// AI Support endpoint (optional live LLM integration)
app.post('/api/ai-support', async (req, res) => {
  if (!verifyOrigin(req, res)) return;
  try {
    const { message, category, user } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.AI_SUPPORT_API_KEY;
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    if (!apiKey) {
      return res.status(501).json({ success: false, message: 'AI not configured' });
    }

    const system =
      'You are a helpful, concise customer support assistant for an Ethiopian maids platform in GCC. '
      + 'Answer succinctly (2-5 sentences), include steps and links when relevant, and keep a friendly tone. '
      + 'If the question is about billing, account, matching, technical issues, or verification, provide clear next steps.';

    const contextLines = [];
    if (category) contextLines.push(`Category: ${category}`);
    if (user?.userType) contextLines.push(`User Type: ${user.userType}`);
    if (user?.email) contextLines.push(`User: ${user.email}`);
    contextLines.push(`Question: ${message}`);
    const userText = contextLines.join('\n');

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userText },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ success: false, message: 'LLM request failed', detail: errText });
    }
    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    return res.json({ success: true, reply });
  } catch (err) {
    console.error('AI support error:', err);
    return res.status(500).json({ success: false, message: 'AI error', error: err.message });
  }
});

// Verify SMS code
app.post('/api/sms/verify-code', authLimiter, async (req, res) => {
  if (!verifyOrigin(req, res)) return;
  try {
    const { phoneNumber, code } = req.body;
    if (!phoneNumber || !code)
      return res
        .status(400)
        .json({
          success: false,
          message: 'Phone number and verification code are required',
        });

    if (
      process.env.TWILIO_VERIFY_SERVICE_SID &&
      process.env.NODE_ENV === 'production'
    ) {
      try {
        const verificationCheck = await twilioClient.verify.v2
          .services(process.env.TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: phoneNumber, code });
        if (verificationCheck.status === 'approved')
          return res.json({
            success: true,
            message: 'Phone number verified successfully',
            data: { status: verificationCheck.status, valid: true },
          });
        return res
          .status(400)
          .json({ success: false, message: 'Invalid verification code' });
      } catch (twilioError) {
        console.error('Twilio Verify Service Error:', twilioError);
        // Fallback below
      }
    }

    const recentAttempts = Array.from(verificationAttempts.entries())
      .filter(
        ([_key, data]) =>
          data.phoneNumber === phoneNumber &&
          Date.now() - data.timestamp < 600000
      )
      .sort(([, a], [, b]) => b.timestamp - a.timestamp);
    if (recentAttempts.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'No verification code found or code has expired',
        });
    }
    const [attemptKey, attemptData] = recentAttempts[0];
    if (attemptData.code === code) {
      verificationAttempts.delete(attemptKey);
      return res.json({
        success: true,
        message: 'Phone number verified successfully',
        data: { valid: true },
      });
    }
    return res
      .status(400)
      .json({ success: false, message: 'Invalid verification code' });
  } catch (error) {
    console.error('SMS Verify Error:', error);
    res
      .status(500)
      .json({
        success: false,
        message: 'Failed to verify code. Please try again.',
      });
  }
});

// Socket.io server
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: isDev ? '*' : allowedOrigins, methods: ['GET', 'POST'] },
});

// Store connected users and conversations
const connectedUsers = new Map();
const conversations = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('authenticate', (userData) => {
    connectedUsers.set(socket.id, userData);
    socket.broadcast.emit('userOnline', userData.userId);
    console.log('User authenticated:', userData.name);
  });
  socket.on('sendMessage', (messageData) => {
    console.log('Message received:', messageData);
    socket.broadcast.emit('message', messageData);
    if (!conversations.has(messageData.conversationId))
      conversations.set(messageData.conversationId, []);
    conversations.get(messageData.conversationId).push(messageData);
  });
  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', {
      userId: connectedUsers.get(socket.id)?.userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
  });
  socket.on('createConversation', (conversationData) => {
    const conversationId = Date.now().toString();
    conversations.set(conversationId, []);
    socket.emit('conversationCreated', {
      ...conversationData,
      id: conversationId,
    });
  });
  socket.on('markAsRead', (data) => {
    socket.broadcast.emit('messageRead', {
      conversationId: data.conversationId,
      userId: connectedUsers.get(socket.id)?.userId,
    });
  });
  socket.on('initiateCall', (callData) => {
    console.log('Call initiated:', callData);
    socket.broadcast.emit('incomingCall', callData);
  });
  socket.on('acceptCall', (callData) => {
    console.log('Call accepted:', callData);
    socket.broadcast.emit('callAccepted', callData);
  });
  socket.on('rejectCall', (callData) => {
    console.log('Call rejected:', callData);
    socket.broadcast.emit('callRejected', callData);
  });
  socket.on('endCall', (callData) => {
    console.log('Call ended:', callData);
    socket.broadcast.emit('callEnded', callData);
  });
  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      socket.broadcast.emit('userOffline', userData.userId);
      connectedUsers.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'public')}`);
  console.log(`Mock documents: http://localhost:${PORT}/mock-documents/`);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    connectedUsers: connectedUsers.size,
    conversations: conversations.size,
  });
});

// Document access debug
app.get('/test-document-access', (req, res) => {
  const documentPath = path.join(__dirname, 'public/mock-documents');
  try {
    const files = fs.readdirSync(documentPath);
    res.json({ status: 'OK', documentPath, files });
  } catch (error) {
    res
      .status(500)
      .json({ status: 'Error', documentPath, error: error.message });
  }
});
