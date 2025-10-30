#!/bin/bash
# Setup Vercel Environment Variables

export VERCEL_TOKEN=olBORiuI87mRG6Qo1NR00mAD

echo "Adding environment variables to Vercel..."

# Supabase
vercel env add VITE_SUPABASE_URL production preview development --yes --force < <(echo "https://kstoksqbhmxnrmspfywm.supabase.co")
vercel env add VITE_SUPABASE_ANON_KEY production preview development --yes --force < <(echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTAyNTcsImV4cCI6MjA3NTA4NjI1N30.es6ozZDte5pOHA7Y1exXwdUybM-5WTxnrADKpbSGyzw")

# App Settings
vercel env add VITE_APP_NAME production preview development --yes --force < <(echo "Ethiopian Maids Platform")
vercel env add VITE_APP_VERSION production preview development --yes --force < <(echo "1.0.0")
vercel env add VITE_APP_ENVIRONMENT production preview development --yes --force < <(echo "production")

# Stripe
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production preview development --yes --force < <(echo "pk_test_51RtCWi3ySFkJEQXkZns3C60KhWwr8XuqXydtnMM2cwnvBNss6CsaeQBwHzrFqBAB9A0QMLbslX3R5FRVuPIaGwG800BRlTQvle")

# Twilio
vercel env add VITE_TWILIO_ACCOUNT_SID production preview development --yes --force < <(echo "ACbfdadc1ba60a882a64b410046ca3c8a6")
vercel env add VITE_TWILIO_PHONE_NUMBER production preview development --yes --force < <(echo "+17176998295")

# ElevenLabs
vercel env add VITE_ELEVENLABS_AGENT_ID production preview development --yes --force < <(echo "agent_5301k3h9y7cbezt8kq5s38a0857h")

# Feature Flags
vercel env add VITE_ENABLE_CHAT production preview development --yes --force < <(echo "true")
vercel env add VITE_ENABLE_VIDEO_CALLS production preview development --yes --force < <(echo "false")
vercel env add VITE_ENABLE_ANALYTICS production preview development --yes --force < <(echo "false")

# Google
vercel env add VITE_GOOGLE_CLIENT_ID production preview development --yes --force < <(echo "360906953841-aol08g20r7ltm2a5lf4192j3h3diuhqg.apps.googleusercontent.com")

echo "✅ Environment variables added successfully!"
