#!/bin/bash

# =============================================================================
# GitHub Secrets Setup Script
# =============================================================================
# This script automatically configures all required GitHub repository secrets
# for the Ethiopian Maids Platform deployment pipeline.
#
# Prerequisites:
# - GitHub CLI installed (gh)
# - Authenticated with GitHub (gh auth login)
# - Admin access to the repository
#
# Usage:
#   chmod +x scripts/setup-github-secrets.sh
#   ./scripts/setup-github-secrets.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Repository
REPO="umero882/ethiopian-maids-st"

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}  GitHub Secrets Setup for Ethiopian Maids Platform${NC}"
echo -e "${BLUE}==============================================================================${NC}\n"

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo -e "${YELLOW}Install it from: https://cli.github.com/${NC}"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with GitHub${NC}"
    echo -e "${YELLOW}Run: gh auth login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is installed and authenticated${NC}\n"

# Confirm before proceeding
echo -e "${YELLOW}This will add/update secrets in repository: ${REPO}${NC}"
read -p "Continue? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted${NC}"
    exit 1
fi

echo -e "\n${BLUE}Adding secrets...${NC}\n"

# Function to add secret
add_secret() {
    local name=$1
    local value=$2
    echo -n "Adding ${name}... "
    if gh secret set "${name}" --body "${value}" --repo "${REPO}" 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
        return 1
    fi
}

# Vercel Secrets
echo -e "${BLUE}📦 Vercel Configuration${NC}"
add_secret "VERCEL_TOKEN" "olBORiuI87mRG6Qo1NR00mAD"
add_secret "VERCEL_ORG_ID" "team_XnY1b9HZxbTV3OElmnJdJIZI"
add_secret "VERCEL_PROJECT_ID" "ulove882's projects"

# Supabase Secrets
echo -e "\n${BLUE}🗄️  Supabase Configuration${NC}"
add_secret "VITE_SUPABASE_URL" "https://kstoksqbhmxnrmspfywm.supabase.co"
add_secret "VITE_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTAyNTcsImV4cCI6MjA3NTA4NjI1N30.es6ozZDte5pOHA7Y1exXwdUybM-5WTxnrADKpbSGyzw"
add_secret "SUPABASE_SERVICE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUxMDI1NywiZXhwIjoyMDc1MDg2MjU3fQ.XLsNhkZE79g4HrSosEnxgGpYwGC95nWwHQtpR5mdiuQ"

# Stripe Secrets
echo -e "\n${BLUE}💳 Stripe Configuration${NC}"
add_secret "VITE_STRIPE_PUBLISHABLE_KEY" "pk_test_51RtCWi3ySFkJEQXkZns3C60KhWwr8XuqXydtnMM2cwnvBNss6CsaeQBwHzrFqBAB9A0QMLbslX3R5FRVuPIaGwG800BRlTQvle"
add_secret "STRIPE_SECRET_KEY" "sk_test_51RtCWi3ySFkJEQXkvnX6i76neuywIoPFWdIigbpk42NSWKEytE6qeZn2plPD0l9HhvLeOTMcOGBgfbnW0KMo3dhh004Sr9JBUO"
add_secret "STRIPE_WEBHOOK_SECRET" "whsec_jftb01DjPvQHN6I4cv2e0XZHWxsv6elX"

# Twilio Secrets
echo -e "\n${BLUE}📱 Twilio Configuration${NC}"
add_secret "VITE_TWILIO_ACCOUNT_SID" "ACbfdadc1ba60a882a64b410046ca3c8a6"
add_secret "TWILIO_AUTH_TOKEN" "fdf1da8e7b8b2a7c799d3e4a49c3b2de"
add_secret "VITE_TWILIO_PHONE_NUMBER" "+17176998295"

# SendGrid Secret
echo -e "\n${BLUE}📧 SendGrid Configuration${NC}"
add_secret "SENDGRID_API_KEY" "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"

# ElevenLabs Secrets
echo -e "\n${BLUE}🎙️  ElevenLabs Configuration${NC}"
add_secret "ELEVENLABS_API_KEY" "sk_321124673d200067686fe8f1e12bbeea09fa4d41e3028a41"
add_secret "VITE_ELEVENLABS_AGENT_ID" "agent_5301k3h9y7cbezt8kq5s38a0857h"

# GitHub Token
echo -e "\n${BLUE}🔑 GitHub Token${NC}"
add_secret "GH_TOKEN" "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"

echo -e "\n${BLUE}==============================================================================${NC}"
echo -e "${GREEN}✅ All secrets have been added successfully!${NC}"
echo -e "${BLUE}==============================================================================${NC}\n"

# List all secrets
echo -e "${BLUE}📋 Current secrets in repository:${NC}\n"
gh secret list --repo "${REPO}"

echo -e "\n${YELLOW}⚠️  Next Steps:${NC}"
echo -e "1. Configure Vercel project (see VERCEL_SETUP.md)"
echo -e "2. Set up branch protection (see BRANCH_STRATEGY.md)"
echo -e "3. Test deployment: ${BLUE}git push origin development${NC}"
echo -e "4. Monitor GitHub Actions: ${BLUE}https://github.com/${REPO}/actions${NC}"
echo -e "5. ${RED}DELETE GITHUB_SECRETS_SETUP.md for security${NC}\n"

echo -e "${GREEN}Setup complete! 🎉${NC}\n"
