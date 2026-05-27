#!/usr/bin/env bash
# Comprehensive E2E test exercising every module via API.
# Flow: customer (L1, Sari) buys printer 2.5jt → auto-approved (grade A, ≤3jt)
#       → DP pending → bayar DP → purchasing → admin record PO + QC pass
#       → auto-create delivery → admin assign kurir → kurir submit proof
#       → app active + installment schedule generated → bayar cicilan
set -e
BASE="http://localhost:3001"

trap 'rm -f /tmp/manggala-*.cookie' EXIT

OK=0
FAIL=0
function check() {
  local label="$1"
  local out="$2"
  if echo "$out" | grep -q '"ok":true'; then
    echo "✓ $label"
    OK=$((OK+1))
  else
    echo "✗ $label  → $out"
    FAIL=$((FAIL+1))
  fi
}

# ============== AUTH ==============
echo "== AUTH"
RES=$(curl -s -c /tmp/manggala-cust.cookie -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"identifier":"sari@example.com","password":"password123"}')
check "Login customer (Sari, L1)" "$RES"

RES=$(curl -s -b /tmp/manggala-cust.cookie "$BASE/api/auth/me")
check "GET /api/auth/me (customer)" "$RES"

RES=$(curl -s -c /tmp/manggala-admin.cookie -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"identifier":"bagus@manggala.id","password":"password123"}')
check "Login super admin" "$RES"

RES=$(curl -s -c /tmp/manggala-fin.cookie -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"identifier":"andini@manggala.id","password":"password123"}')
check "Login finance admin" "$RES"

RES=$(curl -s -c /tmp/manggala-col.cookie -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"identifier":"cahyo@manggala.id","password":"password123"}')
check "Login collection" "$RES"

RES=$(curl -s -c /tmp/manggala-cou.cookie -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"identifier":"adi@manggala.id","password":"password123"}')
check "Login courier" "$RES"

RES=$(curl -s -X POST "$BASE/api/auth/otp/request" \
  -H "content-type: application/json" \
  -d '{"phone":"+62811000999"}')
check "OTP request" "$RES"

# ============== CUSTOMER ==============
echo
echo "== CUSTOMER"
RES=$(curl -s -b /tmp/manggala-cust.cookie -X POST "$BASE/api/products/scrape" \
  -H "content-type: application/json" \
  -d '{"url":"https://tokopedia.com/p/0"}')
check "Product scrape (printer 2.5jt)" "$RES"

RES=$(curl -s -b /tmp/manggala-cust.cookie -X POST "$BASE/api/applications" \
  -H "content-type: application/json" \
  -d '{"productUrl":"https://tokopedia.com/p/0","tenor":3,"income":6500000,"occupation":"Reseller Online","city":"Bekasi","consentSignature":true}')
check "Create application (within L1 limit)" "$RES"
APP_ID=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['applicationId'])")
APP_STATUS=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
echo "  App ID: $APP_ID (status: $APP_STATUS)"

# Verify limit enforcement (PRD §8)
RES=$(curl -s -b /tmp/manggala-cust.cookie -X POST "$BASE/api/applications" \
  -H "content-type: application/json" \
  -d '{"productUrl":"https://tokopedia.com/p/1","tenor":3,"income":6500000,"city":"Bekasi","consentSignature":true}')
if echo "$RES" | grep -q '"error":"Limit Anda'; then
  echo "✓ Limit enforcement (over-limit blocked)"
  OK=$((OK+1))
else
  echo "✗ Limit enforcement  → $RES"
  FAIL=$((FAIL+1))
fi

# Verify tenor cap for L1 (PRD §8)
RES=$(curl -s -b /tmp/manggala-cust.cookie -X POST "$BASE/api/applications" \
  -H "content-type: application/json" \
  -d '{"productUrl":"https://tokopedia.com/p/0","tenor":12,"income":6500000,"consentSignature":true}')
if echo "$RES" | grep -q "tenor maks"; then
  echo "✓ Tenor cap enforced (L1 ≤ 3 bulan)"
  OK=$((OK+1))
else
  echo "✗ Tenor cap  → $RES"
  FAIL=$((FAIL+1))
fi

RES=$(curl -s -b /tmp/manggala-cust.cookie "$BASE/api/applications")
check "List my applications" "$RES"

RES=$(curl -s -b /tmp/manggala-cust.cookie "$BASE/api/applications/$APP_ID")
check "Get application detail" "$RES"

RES=$(curl -s -b /tmp/manggala-cust.cookie "$BASE/api/installments")
check "List my installments" "$RES"

RES=$(curl -s -b /tmp/manggala-cust.cookie "$BASE/api/notifications")
check "List notifications" "$RES"

RES=$(curl -s -b /tmp/manggala-cust.cookie -X PATCH "$BASE/api/notifications" \
  -H "content-type: application/json" \
  -d '{}')
check "Mark notifications read" "$RES"

# ============== ADMIN: APPROVAL ==============
echo
echo "== ADMIN APPROVAL"
RES=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/admin/overview")
check "Admin overview" "$RES"

RES=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/admin/finance")
check "Admin finance KPI" "$RES"

RES=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/applications?status=manual_review")
check "List manual_review apps" "$RES"

# Approve another (any pending) one to exercise decide path.
PENDING=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/applications?status=manual_review" | python3 -c "import sys,json; items=json.load(sys.stdin)['data']['items']; print(items[0]['app']['id'] if items else '')")
if [ -n "$PENDING" ]; then
  RES=$(curl -s -b /tmp/manggala-fin.cookie -X POST "$BASE/api/applications/$PENDING/decide" \
    -H "content-type: application/json" \
    -d '{"action":"approve"}')
  check "Approve manual_review app" "$RES"
fi

# ============== PAYMENT (DP) ==============
echo
echo "== PAYMENT DP"
DP_AMOUNT=$(curl -s -b /tmp/manggala-cust.cookie "$BASE/api/applications/$APP_ID" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['application']['dpAmount'])")
DP_REQ=$(curl -s -b /tmp/manggala-cust.cookie "$BASE/api/applications/$APP_ID" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['application']['dpRequired'])")
echo "  DP required: $DP_REQ, amount: $DP_AMOUNT"

if [ "$DP_REQ" = "True" ] && [ "$DP_AMOUNT" -gt 0 ]; then
  PAY_RES=$(curl -s -b /tmp/manggala-cust.cookie -X POST "$BASE/api/payments" \
    -H "content-type: application/json" \
    -d "{\"applicationId\":\"$APP_ID\",\"type\":\"dp\",\"method\":\"va\",\"channel\":\"BCA\",\"amount\":$DP_AMOUNT}")
  check "Create DP payment intent" "$PAY_RES"
  PAY_ID=$(echo "$PAY_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['paymentId'])")
  CONFIRM_RES=$(curl -s -b /tmp/manggala-cust.cookie -X POST "$BASE/api/payments/$PAY_ID/confirm")
  check "Confirm DP payment" "$CONFIRM_RES"
fi

# ============== ADMIN: WAREHOUSE ==============
echo
echo "== ADMIN WAREHOUSE"
RES=$(curl -s -b /tmp/manggala-fin.cookie "$BASE/api/admin/warehouse/po")
check "List PO" "$RES"
ASSET_ID=$(echo "$RES" | python3 -c "import sys,json; items=json.load(sys.stdin)['data']['items']; po=[i for i in items if i['asset']['applicationId']=='$APP_ID' and i['asset']['status']=='to_purchase']; print(po[0]['asset']['id'] if po else '')")
echo "  Asset to purchase: $ASSET_ID"

if [ -n "$ASSET_ID" ]; then
  RES=$(curl -s -b /tmp/manggala-fin.cookie -X POST "$BASE/api/admin/warehouse/po" \
    -H "content-type: application/json" \
    -d "{\"assetId\":\"$ASSET_ID\",\"invoiceNo\":\"INV-E2E-$APP_ID\"}")
  check "Record purchase" "$RES"

  RES=$(curl -s -b /tmp/manggala-fin.cookie -X POST "$BASE/api/admin/warehouse/qc" \
    -H "content-type: application/json" \
    -d "{\"assetId\":\"$ASSET_ID\",\"result\":\"passed\",\"serialNumber\":\"SN-$APP_ID\",\"photoCount\":4}")
  check "QC pass" "$RES"
fi

# ============== ADMIN: DELIVERY ==============
echo
echo "== ADMIN DELIVERY"
RES=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/admin/deliveries")
check "List deliveries" "$RES"
DLV_ID=$(echo "$RES" | python3 -c "import sys,json; items=json.load(sys.stdin)['data']['items']; mine=[i for i in items if i['app']['id']=='$APP_ID' and i['d']['status']!='delivered']; print(mine[0]['d']['id'] if mine else '')")
echo "  Delivery: $DLV_ID"

RES=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/admin/users")
COURIER_ID=$(echo "$RES" | python3 -c "import sys,json; items=json.load(sys.stdin)['data']['items']; c=[u for u in items if u['role']=='courier']; print(c[0]['id'] if c else '')")
echo "  Courier: $COURIER_ID"

if [ -n "$DLV_ID" ] && [ -n "$COURIER_ID" ]; then
  RES=$(curl -s -b /tmp/manggala-admin.cookie -X POST "$BASE/api/admin/deliveries" \
    -H "content-type: application/json" \
    -d "{\"deliveryId\":\"$DLV_ID\",\"courierId\":\"$COURIER_ID\"}")
  check "Assign courier" "$RES"
fi

# ============== ADMIN: ASSETS / COLLECTION / FRAUD / USERS ==============
echo
echo "== ADMIN ASSETS"
RES=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/admin/assets")
check "List assets" "$RES"

RES=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/admin/assets?status=in_warehouse")
check "Filter assets by status" "$RES"

echo
echo "== ADMIN COLLECTION"
RES=$(curl -s -b /tmp/manggala-col.cookie "$BASE/api/admin/collection")
check "List overdue" "$RES"

echo
echo "== ADMIN FRAUD"
RES=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/admin/fraud")
check "List fraud alerts" "$RES"
FRAUD_ID=$(echo "$RES" | python3 -c "import sys,json; items=json.load(sys.stdin)['data']['items']; o=[i for i in items if i['f']['status']=='open']; print(o[0]['f']['id'] if o else '')")

if [ -n "$FRAUD_ID" ]; then
  RES=$(curl -s -b /tmp/manggala-admin.cookie -X POST "$BASE/api/admin/fraud" \
    -H "content-type: application/json" \
    -d "{\"fraudId\":\"$FRAUD_ID\",\"action\":\"review\"}")
  check "Resolve fraud" "$RES"
fi

echo
echo "== ADMIN USERS"
RES=$(curl -s -b /tmp/manggala-admin.cookie "$BASE/api/admin/users")
check "List team users" "$RES"

RES=$(curl -s -b /tmp/manggala-admin.cookie -X POST "$BASE/api/admin/users" \
  -H "content-type: application/json" \
  -d "{\"name\":\"E2E Test\",\"email\":\"e2etest-$$@manggala.id\",\"phone\":\"+62811199${RANDOM}\",\"password\":\"password123\",\"role\":\"surveyor\"}")
check "Create user" "$RES"
NEW_USER_ID=$(echo "$RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || echo "")

if [ -n "$NEW_USER_ID" ]; then
  RES=$(curl -s -b /tmp/manggala-admin.cookie -X PATCH "$BASE/api/admin/users" \
    -H "content-type: application/json" \
    -d "{\"userId\":\"$NEW_USER_ID\",\"status\":\"suspended\"}")
  check "Suspend user" "$RES"
fi

# ============== COURIER ==============
echo
echo "== COURIER"
RES=$(curl -s -b /tmp/manggala-cou.cookie "$BASE/api/courier/tasks")
check "Courier tasks" "$RES"

RES=$(curl -s -b /tmp/manggala-cou.cookie "$BASE/api/courier/stats")
check "Courier stats" "$RES"

RES=$(curl -s -b /tmp/manggala-cou.cookie "$BASE/api/courier/history")
check "Courier history" "$RES"

TASK_ID=$(curl -s -b /tmp/manggala-cou.cookie "$BASE/api/courier/tasks" | python3 -c "import sys,json; items=json.load(sys.stdin)['data']['items']; pending=[i for i in items if i['app']['id']=='$APP_ID' and i['d']['status']!='delivered']; print(pending[0]['d']['id'] if pending else '')")
echo "  Active task for app: $TASK_ID"

if [ -n "$TASK_ID" ]; then
  RES=$(curl -s -b /tmp/manggala-cou.cookie -X POST "$BASE/api/courier/deliveries/$TASK_ID/proof" \
    -H "content-type: application/json" \
    -d '{"photos":["p1","p2","p3"],"gpsLat":-6.2,"gpsLng":106.8,"signatureDataUrl":"data:image/png;base64,xxxx","qrVerified":true}')
  check "Submit proof of delivery" "$RES"
fi

# ============== INSTALLMENT PAYMENT ==============
echo
echo "== INSTALLMENT PAYMENT"
RES=$(curl -s -b /tmp/manggala-cust.cookie "$BASE/api/installments")
check "Installments after delivery" "$RES"

INS_ID=$(echo "$RES" | python3 -c "import sys,json; items=json.load(sys.stdin)['data']['items']; mine=[i for i in items if i['app']['id']=='$APP_ID' and i['ins']['status']!='paid']; print(mine[0]['ins']['id'] if mine else '')")
INS_AMOUNT=$(echo "$RES" | python3 -c "import sys,json; items=json.load(sys.stdin)['data']['items']; mine=[i for i in items if i['app']['id']=='$APP_ID' and i['ins']['status']!='paid']; print(mine[0]['ins']['amount'] if mine else 0)")
echo "  Installment: $INS_ID amount $INS_AMOUNT"

if [ -n "$INS_ID" ]; then
  PAY_RES=$(curl -s -b /tmp/manggala-cust.cookie -X POST "$BASE/api/payments" \
    -H "content-type: application/json" \
    -d "{\"applicationId\":\"$APP_ID\",\"installmentId\":\"$INS_ID\",\"type\":\"installment\",\"method\":\"qris\",\"amount\":$INS_AMOUNT}")
  check "Create installment payment" "$PAY_RES"
  PAY_ID=$(echo "$PAY_RES" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['paymentId'])")
  CONFIRM_RES=$(curl -s -b /tmp/manggala-cust.cookie -X POST "$BASE/api/payments/$PAY_ID/confirm")
  check "Confirm installment payment" "$CONFIRM_RES"
fi

# ============== LOGOUT ==============
echo
echo "== LOGOUT"
RES=$(curl -s -b /tmp/manggala-cust.cookie -X POST "$BASE/api/auth/logout")
check "Customer logout" "$RES"
RES=$(curl -s -b /tmp/manggala-admin.cookie -X POST "$BASE/api/auth/logout")
check "Admin logout" "$RES"
RES=$(curl -s -b /tmp/manggala-cou.cookie -X POST "$BASE/api/auth/logout")
check "Courier logout" "$RES"

echo
echo "================================================"
echo "  PASS: $OK  FAIL: $FAIL"
echo "================================================"
[ "$FAIL" -eq 0 ] && exit 0 || exit 1
