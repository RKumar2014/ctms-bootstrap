# CTMS GCP Deployment Setup Script
# Run this once to set up your Google Cloud project

$PROJECT_ID = "ctms-clinical-app"
$REGION = "us-central1"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CTMS Cloud Deployment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Check gcloud installation
Write-Host "`n[1/5] Checking Google Cloud SDK..." -ForegroundColor Yellow
$gcloudPath = Get-Command gcloud -ErrorAction SilentlyContinue
if (-not $gcloudPath) {
    Write-Host "ERROR: Google Cloud SDK not found!" -ForegroundColor Red
    Write-Host "Please install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor White
    Write-Host "After installing, restart PowerShell and run this script again." -ForegroundColor White
    exit 1
}
Write-Host "  Found: $($gcloudPath.Source)" -ForegroundColor Green

# Step 2: Login
Write-Host "`n[2/5] Logging into Google Cloud..." -ForegroundColor Yellow
gcloud auth login

# Step 3: Create project
Write-Host "`n[3/5] Creating project '$PROJECT_ID'..." -ForegroundColor Yellow
$existingProject = gcloud projects describe $PROJECT_ID 2>&1
if ($existingProject -match "NOT_FOUND") {
    gcloud projects create $PROJECT_ID --name="CTMS Clinical App"
} else {
    Write-Host "  Project already exists, using it." -ForegroundColor Gray
}

# Set project
gcloud config set project $PROJECT_ID

# Step 4: Enable billing
Write-Host "`n[4/5] Billing Setup Required" -ForegroundColor Yellow
Write-Host "  Please enable billing at:" -ForegroundColor White
Write-Host "  https://console.cloud.google.com/billing/linkedaccount?project=$PROJECT_ID" -ForegroundColor Cyan
Write-Host ""
Read-Host "  Press Enter after enabling billing..."

# Step 5: Enable APIs
Write-Host "`n[5/5] Enabling required APIs..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable artifactregistry.googleapis.com

# Set region
gcloud config set run/region $REGION

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Run .\deploy-backend.ps1" -ForegroundColor Cyan
