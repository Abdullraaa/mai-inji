#!/bin/bash
# Test Mai Inji order lifecycle end-to-end
# Usage: ./test-order-flow.sh http://localhost:3001

set -e

API_URL="${1:-http://localhost:3001}"
echo "Testing Mai Inji Order Flow"
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health check${NC}"
HEALTH=$(curl -s "$API_URL/health")
echo "Response: $HEALTH"
echo ""

# Test 2: Get menu
echo -e "${YELLOW}Test 2: Get menu${NC}"
MENU=$(curl -s "$API_URL/api/menu")
MENU_ITEM_ID=$(echo "$MENU" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Menu items fetched. First item ID: $MENU_ITEM_ID"
echo ""

if [ -z "$MENU_ITEM_ID" ]; then
    echo -e "${RED}❌ No menu items found${NC}"
    exit 1
fi

# Test 3: Create order
echo -e "${YELLOW}Test 3: Create order${NC}"
ORDER_DATA=$(curl -s -X POST "$API_URL/api/orders" \
  -H "Content-Type: application/json" \
  -H "x-user-id: test-customer-001" \
  -d "{
    \"items\": [
      {\"menuItemId\": \"$MENU_ITEM_ID\", \"quantity\": 1}
    ],
    \"fulfillmentType\": \"PICKUP\"
  }")

ORDER_ID=$(echo "$ORDER_DATA" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
ORDER_STATUS=$(echo "$ORDER_DATA" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Order created: $ORDER_ID"
echo "Status: $ORDER_STATUS"
echo ""

if [ "$ORDER_STATUS" != "PAYMENT_PENDING" ]; then
    echo -e "${RED}❌ Order status should be PAYMENT_PENDING${NC}"
    exit 1
fi

# Test 4: Initialize payment
echo -e "${YELLOW}Test 4: Initialize payment${NC}"
PAYMENT_DATA=$(curl -s -X POST "$API_URL/api/orders/$ORDER_ID/payment" \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "test@example.com"}')

PAYMENT_ID=$(echo "$PAYMENT_DATA" | grep -o '"paymentId":"[^"]*"' | cut -d'"' -f4)
echo "Payment initialized: $PAYMENT_ID"
echo ""

# Test 5: Verify order status
echo -e "${YELLOW}Test 5: Verify order status${NC}"
ORDER_CHECK=$(curl -s "$API_URL/api/orders/$ORDER_ID")
CURRENT_STATUS=$(echo "$ORDER_CHECK" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Current status: $CURRENT_STATUS"
echo ""

# Test 6: Check audit logs
echo -e "${YELLOW}Test 6: Query audit logs (requires direct DB access)${NC}"
echo "Run this in Railway PostgreSQL client:"
echo "SELECT entity_type, action, previous_state, new_state FROM audit_logs WHERE entity_id = '$ORDER_ID' ORDER BY created_at;"
echo ""

echo -e "${GREEN}✅ Basic order flow test complete${NC}"
echo ""
echo "Next steps:"
echo "1. Check audit_logs in Railway database"
echo "2. Test payment webhook (requires Paystack account)"
echo "3. Test order rejection and refund"
