# Paystack Webhook Simulator
# Simulates webhook from Paystack for testing idempotency and payment flow
# Usage: .\webhook-simulator.ps1 <ORDER_ID> <EVENT_TYPE>

param(
    [Parameter(Mandatory=$true)]
    [string]$OrderId,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("success", "failed", "refund")]
    [string]$EventType = "success",
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "http://localhost:3001"
)

# Colors
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$RESET = "`e[0m"

Write-Host "${YELLOW}Paystack Webhook Simulator${RESET}"
Write-Host "Order ID: $OrderId"
Write-Host "Event: $EventType"
Write-Host "API URL: $ApiUrl"
Write-Host ""

# Step 1: Get order details
Write-Host "${YELLOW}Step 1: Fetching order...${RESET}"
$orderResponse = curl -s "$ApiUrl/api/orders/$OrderId" | ConvertFrom-Json

if (-not $orderResponse.success) {
    Write-Host "${RED}❌ Order not found${RESET}"
    exit 1
}

$order = $orderResponse.data
Write-Host "${GREEN}✅ Order found: $($order.order_number)${RESET}"
Write-Host "   Status: $($order.status)"
Write-Host "   Amount: $($order.total_amount) kobo"
Write-Host ""

# Step 2: Query database for payment reference
Write-Host "${YELLOW}Step 2: Finding payment reference...${RESET}"
# In real scenario, you'd query the database
# For now, generate a reference
$reference = "MAI-$OrderId-$(Get-Random -Minimum 1000 -Maximum 9999)"
Write-Host "${GREEN}✅ Reference: $reference${RESET}"
Write-Host ""

# Step 3: Create webhook payload based on event type
Write-Host "${YELLOW}Step 3: Creating webhook payload...${RESET}"

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')

switch ($EventType) {
    "success" {
        $webhookPayload = @{
            event = "charge.success"
            data = @{
                id = Get-Random -Minimum 1000000 -Maximum 9999999
                reference = $reference
                amount = $order.total_amount
                customer = @{
                    email = "customer@example.com"
                    phone = "+2340000000000"
                }
                authorization = @{
                    authorization_code = "AUTH_$(Get-Random -Minimum 100000 -Maximum 999999)"
                    bin = "408408"
                    last4 = "4081"
                    exp_month = "12"
                    exp_year = "2025"
                    channel = "card"
                    card_type = "visa"
                    bank = "TEST BANK"
                    country_code = "NG"
                    brand = "visa"
                }
                status = "success"
                paid_at = $timestamp
                created_at = $timestamp
                gateway_response = "Successful"
                message = null
            }
        }
    }
    "failed" {
        $webhookPayload = @{
            event = "charge.failed"
            data = @{
                id = Get-Random -Minimum 1000000 -Maximum 9999999
                reference = $reference
                amount = $order.total_amount
                customer = @{
                    email = "customer@example.com"
                }
                status = "failed"
                created_at = $timestamp
                gateway_response = "Insufficient Funds"
                message = null
            }
        }
    }
    "refund" {
        $webhookPayload = @{
            event = "charge.refund"
            data = @{
                id = Get-Random -Minimum 1000000 -Maximum 9999999
                reference = $reference
                amount = $order.total_amount
                customer = @{
                    email = "customer@example.com"
                }
                status = "success"
                created_at = $timestamp
                gateway_response = "Refund Successful"
                message = null
            }
        }
    }
}

Write-Host "${GREEN}✅ Payload created${RESET}"
Write-Host ""

# Step 4: Generate signature
Write-Host "${YELLOW}Step 4: Computing HMAC-SHA512 signature...${RESET}"

$jsonPayload = $webhookPayload | ConvertTo-Json -Compress

# NOTE: In real scenario, you'd need the actual PAYSTACK_WEBHOOK_SECRET from .env
# For now, we'll use a test secret (not real Paystack)
$webhookSecret = $env:PAYSTACK_WEBHOOK_SECRET
if (-not $webhookSecret) {
    Write-Host "${RED}⚠️  Warning: PAYSTACK_WEBHOOK_SECRET not in environment${RESET}"
    Write-Host "   Using placeholder secret for testing"
    $webhookSecret = "test_webhook_secret_12345"
}

# Compute HMAC-SHA512
$hmac = New-Object System.Security.Cryptography.HMACSHA512
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($webhookSecret)
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($jsonPayload))
$signature = [System.BitConverter]::ToString($hash).Replace("-", "").ToLower()

Write-Host "${GREEN}✅ Signature: $($signature.Substring(0, 32))...${RESET}"
Write-Host ""

# Step 5: Send webhook to backend
Write-Host "${YELLOW}Step 5: Sending webhook to backend...${RESET}"

$response = curl -s -X POST "$ApiUrl/api/orders/payment/webhook" `
  -H "Content-Type: application/json" `
  -H "x-paystack-signature: $signature" `
  -d $jsonPayload

Write-Host "${GREEN}✅ Response:${RESET}"
Write-Host $response | ConvertFrom-Json | ConvertTo-Json

Write-Host ""

# Step 6: Verify order status changed
Write-Host "${YELLOW}Step 6: Verifying order status...${RESET}"
Start-Sleep -Seconds 1

$updatedOrder = curl -s "$ApiUrl/api/orders/$OrderId" | ConvertFrom-Json

if ($updatedOrder.success) {
    $newStatus = $updatedOrder.data.status
    Write-Host "${GREEN}✅ New status: $newStatus${RESET}"
    
    if ($EventType -eq "success" -and $newStatus -eq "PAID") {
        Write-Host "${GREEN}✅ SUCCESS: Order moved to PAID status${RESET}"
    } elseif ($EventType -eq "failed" -and $newStatus -eq "PAYMENT_FAILED") {
        Write-Host "${GREEN}✅ SUCCESS: Order moved to PAYMENT_FAILED status${RESET}"
    } else {
        Write-Host "${YELLOW}⚠️  Status changed but may need verification${RESET}"
    }
} else {
    Write-Host "${RED}❌ Failed to fetch updated order${RESET}"
}

Write-Host ""
Write-Host "${GREEN}✅ Webhook test complete${RESET}"
Write-Host ""
Write-Host "Next: Check audit_logs in database for complete chain:"
Write-Host "  SELECT * FROM audit_logs WHERE entity_id = '$OrderId' ORDER BY created_at;"
