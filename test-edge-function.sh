#!/bin/bash

SUPABASE_URL="https://kstoksqbhmxnrmspfywm.supabase.co"
ANON_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2-)

curl -i --location --request POST "${SUPABASE_URL}/functions/v1/create-checkout-session" \
  --header "Authorization: Bearer ${ANON_KEY}" \
  --header "Content-Type: application/json" \
  --data '{
    "priceId": "price_1RuWrr3ySFkJEQXk49EgguMT",
    "userType": "sponsor",
    "planTier": "pro",
    "billingCycle": "monthly",
    "userId": "test-user-id",
    "userEmail": "test@example.com",
    "successUrl": "http://localhost:5176/dashboard?success=true",
    "cancelUrl": "http://localhost:5176/pricing?canceled=true"
  }'
