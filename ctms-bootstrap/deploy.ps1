# CTMS Quick Deploy Script
# Usage: .\deploy.ps1 [frontend|backend|all]
#
# Examples:
#   .\deploy.ps1 frontend   - Deploy only frontend
#   .\deploy.ps1 backend    - Deploy only backend
#   .\deploy.ps1 all        - Deploy both (default)
#   .\deploy.ps1            - Deploy both (default)

param(
    [Parameter(Position=0)]
    [ValidateSet("frontend", "backend", "all")]
    [string]$Component = "all"
)

$REGION = "us-central1"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        CTMS Quick Deploy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Track start time
$startTime = Get-Date

function Deploy-Backend {
    Write-Host "[Backend] Starting deployment..." -ForegroundColor Yellow
    $backendStart = Get-Date
    
    gcloud run deploy ctms-backend `
        --source ./backend `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --quiet
    
    if ($LASTEXITCODE -eq 0) {
        $duration = [math]::Round(((Get-Date) - $backendStart).TotalSeconds)
        Write-Host "[Backend] Deployed in ${duration}s" -ForegroundColor Green
    } else {
        Write-Host "[Backend] Deployment FAILED" -ForegroundColor Red
        return $false
    }
    return $true
}

function Deploy-Frontend {
    Write-Host "[Frontend] Starting deployment..." -ForegroundColor Yellow
    $frontendStart = Get-Date
    
    gcloud run deploy ctms-frontend `
        --source ./frontend `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --quiet
    
    if ($LASTEXITCODE -eq 0) {
        $duration = [math]::Round(((Get-Date) - $frontendStart).TotalSeconds)
        Write-Host "[Frontend] Deployed in ${duration}s" -ForegroundColor Green
    } else {
        Write-Host "[Frontend] Deployment FAILED" -ForegroundColor Red
        return $false
    }
    return $true
}

# Execute based on component selection
switch ($Component) {
    "backend" {
        Deploy-Backend
    }
    "frontend" {
        Deploy-Frontend
    }
    "all" {
        Write-Host "Deploying BOTH backend and frontend..." -ForegroundColor Cyan
        Write-Host ""
        $backendOk = Deploy-Backend
        Write-Host ""
        $frontendOk = Deploy-Frontend
    }
}

# Summary
$totalDuration = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "        Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Total time: ${totalDuration}s" -ForegroundColor Gray
Write-Host ""
Write-Host "Frontend: https://ctms-frontend-727328933272.us-central1.run.app" -ForegroundColor White
Write-Host "Backend:  https://ctms-backend-727328933272.us-central1.run.app" -ForegroundColor White
Write-Host ""
