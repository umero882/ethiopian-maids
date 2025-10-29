# =============================================================================
# GitHub Secrets Setup Script (PowerShell)
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
#   .\scripts\setup-github-secrets.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

# Repository
$REPO = "umero882/ethiopian-maids-st"

Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host "  GitHub Secrets Setup for Ethiopian Maids Platform" -ForegroundColor Blue
Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host ""

# Check if gh is installed
try {
    $null = Get-Command gh -ErrorAction Stop
    Write-Host "✅ GitHub CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI (gh) is not installed" -ForegroundColor Red
    Write-Host "Install it from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
try {
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
    Write-Host "✅ Authenticated with GitHub" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Not authenticated with GitHub" -ForegroundColor Red
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

# Confirm before proceeding
Write-Host "This will add/update secrets in repository: $REPO" -ForegroundColor Yellow
$confirmation = Read-Host "Continue? (y/n)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "Aborted" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Adding secrets..." -ForegroundColor Blue
Write-Host ""

# Function to add secret
function Add-GitHubSecret {
    param(
        [string]$Name,
        [string]$Value
    )

    Write-Host "Adding $Name... " -NoNewline
    try {
        $output = gh secret set $Name --body $Value --repo $REPO 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌" -ForegroundColor Red
            Write-Host "  Error: $output" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "❌" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        return $false
    }
}

# Vercel Secrets
Write-Host "📦 Vercel Configuration" -ForegroundColor Blue
Add-GitHubSecret "VERCEL_TOKEN" "olBORiuI87mRG6Qo1NR00mAD"
Add-GitHubSecret "VERCEL_ORG_ID" "team_XnY1b9HZxbTV3OElmnJdJIZI"
Add-GitHubSecret "VERCEL_PROJECT_ID" "prj_T3mzPCeUM1kWrMaqf6E2Cad9lPQ3"

# Supabase Secrets
Write-Host ""
Write-Host "🗄️  Supabase Configuration" -ForegroundColor Blue
Add-GitHubSecret "VITE_SUPABASE_URL" "https://kstoksqbhmxnrmspfywm.supabase.co"
Add-GitHubSecret "VITE_SUPABASE_ANON_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTAyNTcsImV4cCI6MjA3NTA4NjI1N30.es6ozZDte5pOHA7Y1exXwdUybM-5WTxnrADKpbSGyzw"
Add-GitHubSecret "SUPABASE_SERVICE_KEY" "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUxMDI1NywiZXhwIjoyMDc1MDg2MjU3fQ.XLsNhkZE79g4HrSosEnxgGpYwGC95nWwHQtpR5mdiuQ"

# Stripe Secrets
Write-Host ""
Write-Host "💳 Stripe Configuration" -ForegroundColor Blue
Add-GitHubSecret "VITE_STRIPE_PUBLISHABLE_KEY" "pk_test_51RtCWi3ySFkJEQXkZns3C60KhWwr8XuqXydtnMM2cwnvBNss6CsaeQBwHzrFqBAB9A0QMLbslX3R5FRVuPIaGwG800BRlTQvle"
Add-GitHubSecret "STRIPE_SECRET_KEY" "sk_test_51RtCWi3ySFkJEQXkvnX6i76neuywIoPFWdIigbpk42NSWKEytE6qeZn2plPD0l9HhvLeOTMcOGBgfbnW0KMo3dhh004Sr9JBUO"
Add-GitHubSecret "STRIPE_WEBHOOK_SECRET" "whsec_jftb01DjPvQHN6I4cv2e0XZHWxsv6elX"

# Twilio Secrets
Write-Host ""
Write-Host "📱 Twilio Configuration" -ForegroundColor Blue
Add-GitHubSecret "VITE_TWILIO_ACCOUNT_SID" "ACbfdadc1ba60a882a64b410046ca3c8a6"
Add-GitHubSecret "TWILIO_AUTH_TOKEN" "fdf1da8e7b8b2a7c799d3e4a49c3b2de"
Add-GitHubSecret "VITE_TWILIO_PHONE_NUMBER" "+17176998295"

# SendGrid Secret
Write-Host ""
Write-Host "📧 SendGrid Configuration" -ForegroundColor Blue
Add-GitHubSecret "SENDGRID_API_KEY" "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"

# ElevenLabs Secrets
Write-Host ""
Write-Host "🎙️  ElevenLabs Configuration" -ForegroundColor Blue
Add-GitHubSecret "ELEVENLABS_API_KEY" "sk_321124673d200067686fe8f1e12bbeea09fa4d41e3028a41"
Add-GitHubSecret "VITE_ELEVENLABS_AGENT_ID" "agent_5301k3h9y7cbezt8kq5s38a0857h"

# GitHub Token
Write-Host ""
Write-Host "🔑 GitHub Token" -ForegroundColor Blue
Add-GitHubSecret "GH_TOKEN" "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"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host "✅ All secrets have been added successfully!" -ForegroundColor Green
Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host ""

# List all secrets
Write-Host "📋 Current secrets in repository:" -ForegroundColor Blue
Write-Host ""
gh secret list --repo $REPO

Write-Host ""
Write-Host "⚠️  Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure Vercel project (see VERCEL_SETUP.md)"
Write-Host "2. Set up branch protection (see BRANCH_STRATEGY.md)"
Write-Host "3. Test deployment: " -NoNewline
Write-Host "git push origin development" -ForegroundColor Blue
Write-Host "4. Monitor GitHub Actions: " -NoNewline
Write-Host "https://github.com/$REPO/actions" -ForegroundColor Blue
Write-Host "5. " -NoNewline
Write-Host "DELETE GITHUB_SECRETS_SETUP.md for security" -ForegroundColor Red
Write-Host ""

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
