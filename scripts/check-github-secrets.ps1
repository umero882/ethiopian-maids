# =============================================================================
# GitHub Secrets Verification Script (PowerShell)
# =============================================================================
# This script checks if all required GitHub secrets are configured
#
# Usage:
#   .\scripts\check-github-secrets.ps1
# =============================================================================

$ErrorActionPreference = "Stop"

$REPO = "umero882/ethiopian-maids-st"

Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host "  GitHub Secrets Verification" -ForegroundColor Blue
Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host ""

# Check if gh is installed
try {
    $null = Get-Command gh -ErrorAction Stop
    Write-Host "✅ GitHub CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ GitHub CLI (gh) is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install GitHub CLI to use this script:" -ForegroundColor Yellow
    Write-Host "  winget install GitHub.cli" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or check secrets manually at:" -ForegroundColor Yellow
    Write-Host "  https://github.com/$REPO/settings/secrets/actions" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Check if authenticated
try {
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not authenticated"
    }
    Write-Host "✅ Authenticated with GitHub" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with GitHub" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "Checking secrets for repository: $REPO" -ForegroundColor Blue
Write-Host ""

# Get list of secrets
try {
    $secrets = gh secret list --repo $REPO 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to list secrets"
    }
} catch {
    Write-Host "❌ Failed to list secrets" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

# Required secrets
$requiredSecrets = @(
    @{ Name = "VERCEL_TOKEN"; Category = "Vercel"; Required = $true },
    @{ Name = "VERCEL_ORG_ID"; Category = "Vercel"; Required = $true },
    @{ Name = "VERCEL_PROJECT_ID"; Category = "Vercel"; Required = $true },
    @{ Name = "VITE_SUPABASE_URL"; Category = "Supabase"; Required = $true },
    @{ Name = "VITE_SUPABASE_ANON_KEY"; Category = "Supabase"; Required = $true },
    @{ Name = "SUPABASE_SERVICE_KEY"; Category = "Supabase"; Required = $false },
    @{ Name = "VITE_STRIPE_PUBLISHABLE_KEY"; Category = "Stripe"; Required = $true },
    @{ Name = "STRIPE_SECRET_KEY"; Category = "Stripe"; Required = $false },
    @{ Name = "STRIPE_WEBHOOK_SECRET"; Category = "Stripe"; Required = $false },
    @{ Name = "VITE_TWILIO_ACCOUNT_SID"; Category = "Twilio"; Required = $false },
    @{ Name = "TWILIO_AUTH_TOKEN"; Category = "Twilio"; Required = $false },
    @{ Name = "VITE_TWILIO_PHONE_NUMBER"; Category = "Twilio"; Required = $false },
    @{ Name = "SENDGRID_API_KEY"; Category = "SendGrid"; Required = $false },
    @{ Name = "ELEVENLABS_API_KEY"; Category = "ElevenLabs"; Required = $false },
    @{ Name = "VITE_ELEVENLABS_AGENT_ID"; Category = "ElevenLabs"; Required = $false }
)

# Parse secrets output
$secretsList = $secrets -split "`n" | ForEach-Object {
    if ($_ -match "^(\S+)\s+") {
        $matches[1]
    }
}

# Check each secret
$categories = @{}
$missingRequired = @()

foreach ($secret in $requiredSecrets) {
    if (-not $categories.ContainsKey($secret.Category)) {
        $categories[$secret.Category] = @()
    }

    $isSet = $secretsList -contains $secret.Name
    $status = if ($isSet) { "✅" } else { "❌" }
    $typeLabel = if ($secret.Required) { "[REQUIRED]" } else { "[Optional]" }

    $categories[$secret.Category] += @{
        Name = $secret.Name
        IsSet = $isSet
        Required = $secret.Required
        Status = $status
        TypeLabel = $typeLabel
    }

    if ($secret.Required -and -not $isSet) {
        $missingRequired += $secret.Name
    }
}

# Display results by category
foreach ($category in $categories.Keys | Sort-Object) {
    Write-Host ""
    Write-Host "📦 $category" -ForegroundColor Blue

    foreach ($secret in $categories[$category]) {
        $color = if ($secret.IsSet) { "Green" } else {
            if ($secret.Required) { "Red" } else { "Yellow" }
        }

        Write-Host "  $($secret.Status) $($secret.Name) $($secret.TypeLabel)" -ForegroundColor $color
    }
}

# Summary
Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host "  Summary" -ForegroundColor Blue
Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host ""

$totalRequired = ($requiredSecrets | Where-Object { $_.Required }).Count
$setRequired = ($requiredSecrets | Where-Object { $_.Required -and ($secretsList -contains $_.Name) }).Count
$totalOptional = ($requiredSecrets | Where-Object { -not $_.Required }).Count
$setOptional = ($requiredSecrets | Where-Object { (-not $_.Required) -and ($secretsList -contains $_.Name) }).Count

Write-Host "Required Secrets: $setRequired / $totalRequired" -ForegroundColor $(if ($setRequired -eq $totalRequired) { "Green" } else { "Red" })
Write-Host "Optional Secrets: $setOptional / $totalOptional" -ForegroundColor $(if ($setOptional -eq $totalOptional) { "Green" } else { "Yellow" })

if ($missingRequired.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing Required Secrets:" -ForegroundColor Red
    foreach ($secret in $missingRequired) {
        Write-Host "  - $secret" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Add missing secrets using:" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup-github-secrets.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or manually at:" -ForegroundColor Yellow
    Write-Host "  https://github.com/$REPO/settings/secrets/actions" -ForegroundColor Cyan
    Write-Host ""
    exit 1
} else {
    Write-Host ""
    Write-Host "✅ All required secrets are configured!" -ForegroundColor Green
    Write-Host ""

    if ($setOptional -lt $totalOptional) {
        Write-Host "⚠️  Some optional secrets are missing (Twilio, SendGrid, ElevenLabs)" -ForegroundColor Yellow
        Write-Host "   These are only needed if you use those services." -ForegroundColor Yellow
        Write-Host ""
    }

    Write-Host "🚀 Ready to deploy!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Blue
    Write-Host "  1. Configure Vercel project" -ForegroundColor White
    Write-Host "  2. Test deployment: git push origin development" -ForegroundColor White
    Write-Host "  3. Monitor: https://github.com/$REPO/actions" -ForegroundColor White
    Write-Host ""
    exit 0
}
