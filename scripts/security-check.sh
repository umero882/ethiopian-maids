#!/bin/bash

echo "🔐 Running Environment Security Check..."
echo ""

# Run environment validation
echo "1️⃣  Validating environment variables..."
npm run env:validate

if [ $? -ne 0 ]; then
    echo "❌ Environment validation failed!"
    exit 1
fi

echo ""
echo "2️⃣  Checking for secrets in codebase..."

# Check if any VITE_ prefixed secrets exist
if grep -r "VITE_.*API_KEY\|VITE_.*SECRET\|VITE_.*TOKEN" src/ --include="*.js" --include="*.jsx" | grep -v "// " | grep -v "PUBLISHABLE" > /dev/null 2>&1; then
    echo "⚠️  Warning: Found potential VITE_ prefixed secrets in source code"
    grep -r "VITE_.*API_KEY\|VITE_.*SECRET\|VITE_.*TOKEN" src/ --include="*.js" --include="*.jsx" | grep -v "// " | grep -v "PUBLISHABLE"
else
    echo "✅ No VITE_ prefixed secrets found in source code"
fi

echo ""
echo "3️⃣  Checking .gitignore protection..."

if grep -q "^\.env$" .gitignore && grep -q "^\.env\.frontend$" .gitignore && grep -q "^\.env\.backend$" .gitignore; then
    echo "✅ Environment files properly protected in .gitignore"
else
    echo "❌ Missing .gitignore protection for environment files"
    exit 1
fi

echo ""
echo "4️⃣  Verifying build artifacts (if exist)..."

if [ -d "dist" ]; then
    echo "Checking for secrets in build..."
    
    # Check for common secret patterns
    if grep -r "sk_test_.*[0-9a-f]\{20\}\|sk_live_.*[0-9a-f]\{20\}\|whsec_\|SG\.[A-Za-z0-9_-]\{22\}" dist/ > /dev/null 2>&1; then
        echo "❌ CRITICAL: Secrets found in build artifacts!"
        exit 1
    else
        echo "✅ No secrets found in build artifacts"
    fi
else
    echo "ℹ️  No build artifacts found (run 'npm run build' first)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Security Check Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Recommendations:"
echo "  • Rotate API keys immediately if any were exposed"
echo "  • Review ENV_SECURITY_AUDIT_REPORT.md for details"
echo "  • Set up Vercel/Supabase secrets before deployment"
echo ""
