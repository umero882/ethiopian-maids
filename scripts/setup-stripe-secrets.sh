#!/bin/bash
# Interactive script to set up Stripe secrets in Supabase

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔐 Stripe Secrets Setup for Supabase${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if logged in
echo -e "${BLUE}Checking Supabase connection...${NC}"
supabase projects list > /dev/null 2>&1 || {
    echo -e "${RED}❌ Not logged in to Supabase${NC}"
    echo "Run: supabase login"
    exit 1
}

echo -e "${GREEN}✓ Connected to Supabase${NC}"
echo ""

# Get Stripe Secret Key
echo -e "${YELLOW}Enter your Stripe Secret Key${NC}"
echo -e "${BLUE}(starts with sk_test_ or sk_live_)${NC}"
read -p "Stripe Secret Key: " -s stripe_secret_key
echo ""

if [[ ! $stripe_secret_key =~ ^sk_(test|live)_ ]]; then
    echo -e "${RED}❌ Invalid Stripe secret key format${NC}"
    exit 1
fi

# Get Webhook Secret
echo ""
echo -e "${YELLOW}Enter your Stripe Webhook Secret${NC}"
echo -e "${BLUE}(starts with whsec_)${NC}"
echo -e "${BLUE}Get this from: https://dashboard.stripe.com/webhooks${NC}"
read -p "Webhook Secret: " -s webhook_secret
echo ""

if [[ ! $webhook_secret =~ ^whsec_ ]]; then
    echo -e "${RED}❌ Invalid webhook secret format${NC}"
    exit 1
fi

# Set secrets
echo ""
echo -e "${BLUE}Setting secrets in Supabase...${NC}"

echo "Setting STRIPE_SECRET_KEY..."
supabase secrets set STRIPE_SECRET_KEY="$stripe_secret_key"

echo "Setting STRIPE_WEBHOOK_SECRET..."
supabase secrets set STRIPE_WEBHOOK_SECRET="$webhook_secret"

echo ""
echo -e "${GREEN}✓ Secrets set successfully!${NC}"
echo ""

# List secrets to confirm
echo -e "${BLUE}Current secrets:${NC}"
supabase secrets list

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Deploy Edge Functions: npm run deploy:functions"
echo "2. Configure Stripe webhook endpoint"
echo "3. Test the integration"
echo ""
echo "📖 See SUPABASE_EDGE_FUNCTIONS_DEPLOYMENT.md for details"
