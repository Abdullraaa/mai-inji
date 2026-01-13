# Mai Inji Backend Startup Script (Windows)
# Usage: .\start.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔄 Mai Inji Backend Startup" -ForegroundColor Cyan
Write-Host ""

# Check .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "Please create .env with DATABASE_URL from Railway"
    exit 1
}

# Read and display environment
$env_content = Get-Content ".env" | Where-Object { $_ -match "NODE_ENV" }
Write-Host "📝 Environment: $env_content" -ForegroundColor Yellow

# Test database
Write-Host "🔌 Testing database connection..." -ForegroundColor Cyan

try {
    npm run migrate 2>&1 | Select-Object -First 3
    Write-Host "✅ Database connected and migrations applied" -ForegroundColor Green
}
catch {
    Write-Host "❌ Database connection failed" -ForegroundColor Red
    Write-Host "Check your DATABASE_URL in .env"
    exit 1
}

# Seed if development
if ($env_content -match "development") {
    Write-Host "🌱 Seeding test data..." -ForegroundColor Cyan
    npm run seed
}

# Start server
Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Green
Write-Host ""

npm run dev
