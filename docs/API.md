# API Reference

Backend Manggala diimplementasikan sebagai Next.js Route Handlers di `app/api/**`. Database: **Turso (libSQL)** via Drizzle ORM. Auth: JWT cookie session.

Semua response berbentuk:

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "..." }
```

## Auth

| Method | Path | Roles | Body | Description |
|---|---|---|---|---|
| POST | `/api/auth/register` | public | `{ name, email, phone, consentTnc, consentData }` | Buat akun customer (PRD §11 Step 1). Mengembalikan OTP di dev. |
| POST | `/api/auth/login` | public | `{ identifier, password }` | Login email/HP + password. |
| POST | `/api/auth/otp/request` | public | `{ phone }` | Kirim OTP (PRD §11 Step 1). |
| POST | `/api/auth/otp/verify` | public | `{ phone, code }` | Verifikasi OTP, set session. |
| GET | `/api/auth/me` | any | — | Profil user yang login. |
| POST | `/api/auth/logout` | any | — | Hapus session cookie. |

## Customer

| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/api/products/scrape` | `{ url }` | Scrape marketplace + 3 simulasi tenor (PRD §11 Step 2-4). |
| POST | `/api/applications` | `{ productUrl, tenor, occupation?, income?, city?, address?, ktpNumber?, ... }` | Buat pengajuan + auto-compute risk + status (PRD §11 Step 5-7, §15). |
| GET | `/api/applications` | — | List pengajuan customer (atau semua untuk admin). |
| GET | `/api/applications/[id]` | — | Detail pengajuan: app + product + user + risk + installments + payments + delivery + asset. |
| GET | `/api/installments` | — | Cicilan customer (sync overdue otomatis). |
| POST | `/api/payments` | `{ applicationId, installmentId?, type, method, channel?, amount }` | Buat payment intent → VA/QRIS/E-Wallet. |
| GET | `/api/payments?applicationId=...` | — | List payments. |
| POST | `/api/payments/[id]/confirm` | — | Konfirmasi pembayaran (mock; di prod: webhook Midtrans/Xendit). |
| GET | `/api/notifications` | — | List notifikasi user. |
| PATCH | `/api/notifications` | `{ ids? }` | Tandai dibaca (default: semua unread). |

## Admin (RBAC enforced)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/admin/overview` | admin* | KPI top-level: pending, qcDone, riskDistribution. |
| GET | `/api/admin/finance` | admin* | Outstanding, profit, NPL, collection rate. |
| POST | `/api/applications/[id]/decide` | super_admin, finance_admin | Approve / reject / hold (PRD §11 Step 7). |
| GET | `/api/admin/warehouse/po` | super_admin, finance_admin | Asset records di stage PO/warehouse. |
| POST | `/api/admin/warehouse/po` | super_admin, finance_admin | Record purchase invoice (PRD §11 Step 9). |
| POST | `/api/admin/warehouse/qc` | super_admin, finance_admin | Mark QC pass/fail + serial + foto count (PRD §11 Step 10). |
| GET | `/api/admin/deliveries` | super_admin, delivery_team | List semua pengiriman. |
| POST | `/api/admin/deliveries` | super_admin, delivery_team | Assign kurir ke delivery (PRD §11 Step 11). |
| GET | `/api/admin/collection` | super_admin, collection_team | List installment overdue. |
| POST | `/api/admin/collection` | super_admin, collection_team | Bulk reminder via WA/email (PRD §14). |
| GET | `/api/admin/fraud` | admin* | Fraud alerts. |
| POST | `/api/admin/fraud` | super_admin, finance_admin, surveyor | Review / block / mark false_positive (PRD §17). |
| GET | `/api/admin/assets` | admin* | Asset registry (filter ?status=). |
| GET | `/api/admin/users` | super_admin | List admin/courier team. |
| POST | `/api/admin/users` | super_admin | Buat user team baru. |
| PATCH | `/api/admin/users` | super_admin | Update role/status (PRD §22). |

`admin*` = `super_admin`, `finance_admin`, `collection_team`, `delivery_team`, `surveyor`.

## Courier

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/courier/tasks` | courier | Task pengiriman milik courier yang login. |
| POST | `/api/courier/deliveries/[id]/proof` | courier | Submit proof (3 photos + GPS + signature + QR). Auto-update delivery → delivered, application → active, generate installment schedule (PRD §12). |

## Side Effects per Endpoint

Setiap endpoint mutating side effect penting otomatis:

- **POST /applications**: insert product, application, risk_scores, notification.
- **POST /applications/[id]/decide**:
  - `approve` → status `approved` atau `dp_pending`, insert asset, notify.
  - `reject` → status `rejected`, save reason, notify.
  - `hold` → status `manual_review`, notify.
- **POST /admin/warehouse/qc** (passed): asset `in_warehouse`, auto-create delivery row, application → `warehouse`, notify customer.
- **POST /courier/deliveries/[id]/proof**: insert delivery_proofs, delivery → delivered, asset → delivered, application → active, generate installments, notify.
- **POST /payments/[id]/confirm**:
  - DP type → application → purchasing.
  - Installment type → installment paid; if all paid → app `completed` + trust level upgrade + limit raised.
- **POST /admin/fraud** (block): user `status=blacklisted`, insert blacklists row.
- All admin actions write to `audit_logs` (PRD §21).

## Database Schema

15 tabel di `db/schema.ts`:

- `users` — customers + courier + admin team (PRD §22)
- `devices` — fingerprint per device (PRD §17)
- `products` — scraped marketplace items
- `applications` — pengajuan + tenor + status + risk grade
- `risk_scores` — breakdown per komponen (PRD §15)
- `installments` — schedule per bulan + penalty
- `payments` — VA/QRIS/E-Wallet intents + status
- `assets` — IMEI/serial + invoice + QC + resale (PRD §18)
- `deliveries` — kurir + jadwal + status
- `delivery_proofs` — photos JSON, GPS, signature (PRD §12)
- `fraud_logs` — alerts + severity (PRD §17)
- `blacklists` — user/KTP/device denylist
- `notifications` — in-app feed (PRD §13-14)
- `otps` — short-lived OTP codes
- `audit_logs` — immutable trail (PRD §21)

Constraint dan index sudah dipasang via Drizzle.

## Auth Cookie

JWT signed dengan HS256 disimpan di cookie `manggala_session`:
- httpOnly: true
- sameSite: lax
- maxAge: 7 hari

`JWT_SECRET` env var wajib diset di produksi.

## Curl Quickstart

```bash
# Login
curl -c cookie.txt -X POST http://localhost:3000/api/auth/login \
  -H "content-type: application/json" \
  -d '{"identifier":"rafi@example.com","password":"password123"}'

# Get applications
curl -b cookie.txt http://localhost:3000/api/applications

# Scrape
curl -b cookie.txt -X POST http://localhost:3000/api/products/scrape \
  -H "content-type: application/json" \
  -d '{"url":"https://tokopedia.com/sample/ac-daikin"}'
```

Lihat `scripts/e2e-test.sh` untuk contoh skrip yang menjalankan flow lengkap.
