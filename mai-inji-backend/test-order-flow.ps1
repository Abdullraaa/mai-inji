# Test Mai Inji order lifecycle end-to-end
# Usage: .\test-order-flow.ps1 http://localhost:3001

param(
    [string]$ApiUrl = "http://localhost:3001"
)

Write-Host "Testing Mai Inji Order Flow" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl"
Write-Host ""

# Test 1: Health check
Write-Host "Test 1: Health check" -ForegroundColor Yellow
$health = curl -s "$ApiUrl/health" | ConvertFrom-Json
Write-Host "Status: $($health.status)" -ForegroundColor Green
Write-Host ""

# Test 2: Get menu
Write-Host "Test 2: Get menu" -ForegroundColor Yellow
$menu = curl -s "$ApiUrl/api/menu" | ConvertFrom-Json
$menuItemId = $menu[0].id
Write-Host "Menu items fetched. First item ID: $menuItemId" -ForegroundColor Green
Write-Host ""

if (-not $menuItemId) {
    Write-Host "❌ No menu items found" -ForegroundColor Red
    exit 1
}

# Test 3: Create order
Write-Host "Test 3: Create order" -ForegroundColor Yellow
$orderBody = @{
    items = @(@{ menuItemId = $menuItemId; quantity = 1 })
    fulfillmentType = "PICKUP"
} | ConvertTo-Json

$orderData = curl -s -X POST "$ApiUrl/api/orders" `
  -H "Content-Type: application/json" `
  -H "x-user-id: test-customer-001" `
  -d $orderBody | ConvertFrom-Json

$orderId = $orderData.data.id
$orderStatus = $orderData.data.status

Write-Host "Order created: $orderId" -ForegroundColor Green
Write-Host "Status: $orderStatus" -ForegroundColor Green
Write-Host ""

if ($orderStatus -ne "PAYMENT_PENDING") {
    Write-Host "❌ Order status should be PAYMENT_PENDING" -ForegroundColor Red
    exit 1
}

# Test 4: Initialize payment
Write-Host "Test 4: Initialize payment" -ForegroundColor Yellow
$paymentBody = @{
    userEmail = "test@example.com"
} | ConvertTo-Json

$paymentData = curl -s -X POST "$ApiUrl/api/orders/$orderId/payment" `
  -H "Content-Type: application/json" `
  -d $paymentBody | ConvertFrom-Json

$paymentId = $paymentData.data.paymentId
Write-Host "Payment initialized: $paymentId" -ForegroundColor Green
Write-Host ""

# Test 5: Verify order status
Write-Host "Test 5: Verify order status" -ForegroundColor Yellow
$orderCheck = curl -s "$ApiUrl/api/orders/$orderId" | ConvertFrom-Json
$currentStatus = $orderCheck.data.status
Write-Host "Current status: $currentStatus" -ForegroundColor Green
Write-Host ""

# Test 6: Audit logs instruction
Write-Host "Test 6: Query audit logs" -ForegroundColor Yellow
Write-Host "Run this in Railway PostgreSQL client:" -ForegroundColor Cyan
Write-Host "SELECT entity_type, action, previous_state, new_state FROM audit_logs WHERE entity_id = '$orderId' ORDER BY created_at;" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Basic order flow test complete" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check audit_logs in Railway database"
Write-Host "2. Test payment webhook (requires Paystack account)"
Write-Host "3. Test order rejection and refund"
