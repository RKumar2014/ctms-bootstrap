# Deploy Backend to Cloud Run
# Prerequisites: Run deploy-setup.ps1 first

$REGION = "us-central1"
$SERVICE_NAME = "ctms-backend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Deploy CTMS Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "backend/Dockerfile")) {
    Write-Host "ERROR: Run this script from the ctms-bootstrap directory" -ForegroundColor Red
    exit 1
}

# Prompt for secrets
Write-Host "`nEnter your Supabase credentials:" -ForegroundColor Yellow
$SUPABASE_URL = Read-Host "  SUPABASE_URL (e.g., https://xxx.supabase.co)"
$SUPABASE_KEY = Read-Host "  SUPABASE_SERVICE_KEY"

Write-Host ""
$JWT_SECRET = Read-Host "  JWT_SECRET (press Enter for auto-generated)"
if ([string]::IsNullOrEmpty($JWT_SECRET)) {
    $JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "  Generated: $JWT_SECRET" -ForegroundColor Gray
    Write-Host "  SAVE THIS! You'll need it later." -ForegroundColor Yellow
}

Write-Host "`nDeploying backend to Cloud Run..." -ForegroundColor Yellow
Write-Host "(This may take 3-5 minutes on first deploy)" -ForegroundColor Gray

Push-Location backend

gcloud run deploy $SERVICE_NAME `
    --source . `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --set-env-vars="SUPABASE_URL=$SUPABASE_URL" `
    --set-env-vars="SUPABASE_SERVICE_KEY=$SUPABASE_KEY" `
    --set-env-vars="JWT_SECRET=$JWT_SECRET" `
    --set-env-vars="NODE_ENV=production"

Pop-Location

# Get and save the backend URL
$BACKEND_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   Backend Deployed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor White
Write-Host ""

# Save URL for frontend deployment
$BACKEND_URL | Out-File -FilePath ".backend-url" -Encoding utf8 -NoNewline
Write-Host "URL saved to .backend-url" -ForegroundColor Gray

# Test health endpoint
Write-Host "`nTesting health endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod "$BACKEND_URL/health"
    Write-Host "  Status: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "  Could not reach health endpoint (may need a moment to start)" -ForegroundColor Yellow
}

Write-Host "`nNext step: Run .\deploy-frontend.ps1" -ForegroundColor Cyan
