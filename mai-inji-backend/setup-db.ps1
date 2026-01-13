# Setup PostgreSQL for Mai Inji development

$PSQL = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$PGPASSWORD = "604472148f5a41c38f50197eca59ad0a"

Write-Host "Creating PostgreSQL role and database..." -ForegroundColor Cyan

$env:PGPASSWORD = $PGPASSWORD
& $PSQL -U postgres -h localhost -f setup-db.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database setup complete" -ForegroundColor Green
} else {
    Write-Host "Database setup failed" -ForegroundColor Red
    exit 1
}

Write-Host "Testing connection to maiinji_dev..." -ForegroundColor Cyan
$env:PGPASSWORD = "dev_password_123"
& $PSQL -U maiinji_dev -h localhost -d maiinji_dev -c "SELECT version();"

if ($LASTEXITCODE -eq 0) {
    Write-Host "Connection successful" -ForegroundColor Green
} else {
    Write-Host "Connection failed" -ForegroundColor Red
    exit 1
}

Write-Host "Database setup complete" -ForegroundColor Yellow
