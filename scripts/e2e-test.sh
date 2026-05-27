#!/usr/bin/env bash
set -e
BASE="http://localhost:3001"
COOKIE="/tmp/manggala-cookie.txt"
rm -f "$COOKIE"

echo "==> Login as super admin (password)"
curl -s -c "$COOKIE" -b "$COOKIE" -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"identifier":"bagus@manggala.id","password":"password123"}' | head -200
echo

echo "==> /api/auth/me"
curl -s -b "$COOKIE" "$BASE/api/auth/me"
echo

echo "==> /api/admin/overview"
curl -s -b "$COOKIE" "$BASE/api/admin/overview"
echo

echo "==> /api/admin/finance"
curl -s -b "$COOKIE" "$BASE/api/admin/finance"
echo

echo "==> /api/applications"
curl -s -b "$COOKIE" "$BASE/api/applications" | head -300
echo

echo "==> /api/admin/warehouse/po"
curl -s -b "$COOKIE" "$BASE/api/admin/warehouse/po" | head -300
echo

echo "==> /api/admin/users"
curl -s -b "$COOKIE" "$BASE/api/admin/users" | head -300
echo

echo "==> Login as customer"
rm -f "$COOKIE"
curl -s -c "$COOKIE" -b "$COOKIE" -X POST "$BASE/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"identifier":"rafi@example.com","password":"password123"}' | head -200
echo

echo "==> /api/products/scrape"
curl -s -b "$COOKIE" -X POST "$BASE/api/products/scrape" \
  -H "content-type: application/json" \
  -d '{"url":"https://tokopedia.com/sample/iphone-15-pro"}' | head -200
echo

echo "==> /api/applications (customer)"
curl -s -b "$COOKIE" "$BASE/api/applications" | head -200
echo

echo "==> /api/installments (customer)"
curl -s -b "$COOKIE" "$BASE/api/installments" | head -200
echo

echo "==> /api/notifications (customer)"
curl -s -b "$COOKIE" "$BASE/api/notifications" | head -200
echo
