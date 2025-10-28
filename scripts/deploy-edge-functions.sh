#!/bin/bash
# Deploy all Supabase Edge Functions
# Run this script after setting up Stripe secrets

set -e

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${BLUE}📋 Checking Supabase connection...${NC}"
supabase projects list > /dev/null 2>&1 || {
    echo -e "${RED}❌ Not logged in to Supabase${NC}"
    echo "Run: supabase login"
    exit 1
}

echo -e "${GREEN}✓ Connected to Supabase${NC}"
echo ""

# Function to deploy with error handling
deploy_function() {
    local func_name=$1
    echo -e "${BLUE}📦 Deploying ${func_name}...${NC}"

    if supabase functions deploy "$func_name"; then
        echo -e "${GREEN}✓ ${func_name} deployed successfully${NC}"
        echo ""
    else
        echo -e "${RED}❌ Failed to deploy ${func_name}${NC}"
        exit 1
    fi
}

# Deploy all functions
deploy_function "create-checkout-session"
deploy_function "stripe-webhook"
deploy_function "handle-checkout-success"
deploy_function "create-portal-session"
deploy_function "cancel-subscription"

echo ""
echo -e "${GREEN}🎉 All Edge Functions deployed successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Set Stripe secrets:"
echo "   supabase secrets set STRIPE_SECRET_KEY=sk_test_..."
echo "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "2. Configure Stripe webhook endpoint:"
echo "   URL: https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook"
echo ""
echo "3. Test the integration from your app"
echo ""
echo "📖 See SUPABASE_EDGE_FUNCTIONS_DEPLOYMENT.md for full instructions"
