# Deploy Frontend to Cloud Run
# Prerequisites: Run deploy-backend.ps1 first

$REGION = "us-central1"
$SERVICE_NAME = "ctms-frontend"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Deploy CTMS Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "frontend/Dockerfile")) {
    Write-Host "ERROR: Run this script from the ctms-bootstrap directory" -ForegroundColor Red
    exit 1
}

# Get backend URL
if (Test-Path ".backend-url") {
    $BACKEND_URL = (Get-Content ".backend-url" -Raw).Trim()
    Write-Host "`nUsing backend URL: $BACKEND_URL" -ForegroundColor Gray
} else {
    Write-Host "`nNo .backend-url file found." -ForegroundColor Yellow
    $BACKEND_URL = Read-Host "Enter your backend URL"
}

Write-Host "`nDeploying frontend to Cloud Run..." -ForegroundColor Yellow
Write-Host "(This may take 3-5 minutes on first deploy)" -ForegroundColor Gray

Push-Location frontend

gcloud run deploy $SERVICE_NAME `
    --source . `
    --platform managed `
    --region $REGION `
    --allow-unauthenticated `
    --build-env-vars="VITE_API_URL=$BACKEND_URL"

Pop-Location

# Get the frontend URL
$FRONTEND_URL = gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)'

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   Frontend Deployed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: $FRONTEND_URL" -ForegroundColor White

# Update backend CORS
Write-Host "`nUpdating backend CORS to allow frontend..." -ForegroundColor Yellow
gcloud run services update ctms-backend `
    --region $REGION `
    --update-env-vars="FRONTEND_URL=$FRONTEND_URL"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your CTMS app is now live:" -ForegroundColor White
Write-Host ""
Write-Host "  Frontend: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "  Backend:  $BACKEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open $FRONTEND_URL in your browser to test!" -ForegroundColor Yellow
