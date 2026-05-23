# Manggala — Verified Financing Platform

> Frontend MVP untuk platform talangan pembelian cicilan **PT. Manggala Utama Indonesia**.

Platform pembiayaan berbasis web app dimana user dapat membeli barang dari marketplace (Tokopedia, Shopee, TikTok Shop, Lazada) menggunakan sistem cicilan. Manggala menalangi pembelian → menerima barang → melakukan QC → mengantar langsung ke user → memonitor pembayaran cicilan.

Built sesuai [`prd.md`](./prd.md) dan [`desaign.md`](./desaign.md).

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwindcss)
![Status](https://img.shields.io/badge/Phase-MVP-green)

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS dengan design tokens dari `desaign.md` |
| Komponen | shadcn-style (Button, Card, Input, Badge, Progress, Modal, Toast, Skeleton) |
| Animasi | Framer Motion |
| Ikon | lucide-react (outline icons) |
| Font | Inter (Google Fonts) |

Stack ini siap di-pair dengan backend NestJS + PostgreSQL + Redis Queue + Cloudflare R2 sesuai PRD §23.

---

## Quick Start

```bash
git clone https://github.com/AnfalBlank/fintech.git
cd fintech
npm install
npm run dev      # http://localhost:3000
```

Build production:

```bash
npm run build
npm start
```

---

## Struktur Aplikasi

Tiga app terintegrasi dalam satu monorepo Next.js:

### 1. Public + User App  `app/(user)/`

| Route | Halaman |
|---|---|
| `/` | Landing premium fintech (hero, cara kerja, kategori, trust panel) |
| `/login` | OTP login (phone → 6-digit OTP) |
| `/register` | Multi-step: form + konsen → OTP → verifikasi email |
| `/dashboard` | Hero gradient cicilan aktif, quick apply, transaksi terbaru |
| `/apply` | **Step 1**: Paste link produk + scraping preview |
| `/apply/simulate` | **Step 2**: Pilih tenor 3/6/12 bln, simulasi DP & cicilan |
| `/apply/verify` | **Step 3**: Upload KTP, selfie, slip + form pribadi + 3 konsen |
| `/apply/approval` | **Step 4**: Konfirmasi pengajuan + countdown review |
| `/installments` | Daftar cicilan + progress bar |
| `/installments/[id]` | Jadwal pembayaran + verified delivery proof |
| `/payments` | VA / QRIS / E-Wallet picker dengan countdown timer |
| `/profile` | Trust level, limit, menu (data, payment, security, legal, help, logout) |

### 2. Admin Console  `app/admin/`

| Route | Halaman |
|---|---|
| `/admin` | KPI overview + chart disbursement vs repayment, risk distribution |
| `/admin/approvals` | Split-view list ↔ detail, circular risk score, approve/reject/hold |
| `/admin/finance` | Cashflow line chart, outstanding by tenor, top categories, aging |
| `/admin/warehouse` | Purchase Orders + QC tab — record invoice, scan serial, foto |
| `/admin/delivery` | Tracking pengiriman, assign/reassign kurir, lihat proof |
| `/admin/collection` | Tabel overdue + bulk WA/email reminder + blacklist |
| `/admin/fraud` | Heatmap, top reasons, devices to watch, review/block actions |
| `/admin/assets` | Registry IMEI/serial + status timeline + export CSV |
| `/admin/users` | Manage 5 role: Super Admin, Finance, Collection, Delivery, Surveyor |

### 3. Mobile Delivery App (Courier)  `app/courier/`

Dirancang mobile-first sesuai PRD §20.

| Route | Halaman |
|---|---|
| `/courier` | Tugas hari ini + rute list dengan numbering |
| `/courier/delivery/[id]` | Foto wajib (3 angle), GPS capture, QR scan, signature |
| `/courier/history` | Riwayat pengiriman selesai |
| `/courier/profile` | Profil kurir + performa bulanan |

---

## Logika Bisnis (Frontend Mock)

[`lib/financing.ts`](./lib/financing.ts) — implementasi PRD §6, §7, §8:

```ts
// Margin per tenor
3 bulan  → 30%
6 bulan  → 33%
12 bulan → 38%

// DP rules
Harga ≤ 3jt + risk bagus + tenor ≤ 3 → No DP
Harga 3–5jt   → 10%
Harga 5–10jt  → 20%
Harga > 10jt  → 30%
```

[`lib/mock-data.ts`](./lib/mock-data.ts) & [`lib/mock-data-extra.ts`](./lib/mock-data-extra.ts) — data demo: applications, installments, deliveries, fraud alerts, assets, collections, purchase orders, warehouse items, role users, courier tasks.

---

## Design System

Mengikuti [`desaign.md`](./desaign.md):

### Color Tokens

```ts
primary       #2563EB   (Royal Blue)
sky           #60A5FA
emerald       #10B981
warning       #F59E0B
danger        #EF4444
bg            #F8FAFC
card          #FFFFFF
ink           #0F172A
ink-muted     #64748B
navy          #0B1220   (admin sidebar)
```

### Spasi & Radius

| Element | Radius |
|---|---|
| Cards / Modal | `rounded-3xl` (24px) |
| Input / Button | `rounded-2xl` (16px) |
| Hero Card | `rounded-[32px]` |

### Shadows

```css
soft   →  0 4px 20px rgba(15, 23, 42, 0.08)
float  →  0 10px 40px rgba(15, 23, 42, 0.12)
ring   →  0 0 0 4px rgba(37, 99, 235, 0.12)
```

### Typography

| Token | Size |
|---|---|
| `text-hero` | 48px |
| `text-page` | 32px |
| `text-section` | 24px |
| `text-cardtitle` | 18px |
| body | 14–16px |

### Glassmorphism

Class `glass` dipakai untuk navbar dan beberapa card mengambang dengan `backdrop-filter: blur(20px)`.

---

## Reusable Components

```
components/
├── ui/
│   ├── button.tsx        — variant: primary, secondary, ghost, danger, success, outline
│   ├── card.tsx          — Card, CardTitle, CardDescription
│   ├── input.tsx         — Input + Label
│   ├── badge.tsx         — 6 tones
│   ├── progress.tsx      — 4 tones
│   ├── modal.tsx         — escape key, backdrop click, 3 sizes
│   ├── toast.tsx         — global ToastProvider, 4 tones, auto dismiss
│   ├── notifications.tsx — popover dengan unread tracking
│   ├── stat-card.tsx     — KPI cards untuk dashboard
│   ├── skeleton.tsx      — shimmer loading
│   └── empty.tsx         — empty state with icon + CTA
├── user/
│   ├── app-shell.tsx     — top bar + bottom nav mobile + sidebar desktop
│   └── stepper.tsx       — 4-step apply flow indicator
├── admin/
│   └── admin-shell.tsx   — navy sidebar + glass topbar
└── courier/
    └── courier-shell.tsx — mobile-first 3-tab nav
```

---

## Coverage vs PRD

| PRD Section | Coverage |
|---|---|
| §1 Product Overview | ✅ |
| §6 Margin Structure | ✅ — `lib/financing.ts` |
| §7 DP Rules | ✅ — auto-computed di simulation |
| §8 Trust Level | ✅ — di profile, dashboard, approvals |
| §9 Safe Categories | ✅ — di landing |
| §10 High Risk | ✅ — auto-flag di scraping |
| §11 User Flow (12 step) | ✅ — semua tahap punya UI |
| §12 Delivery Verification | ✅ — admin + courier app |
| §13 Installment Monitoring | ✅ |
| §14 Collection System | ✅ — bulk reminder + blacklist |
| §15 Risk Scoring | ✅ — circular score visual |
| §16 Risk Grade A/B/C/D | ✅ |
| §17 Fraud Detection | ✅ — heatmap + alert table |
| §18 Asset Tracking | ✅ — registry + IMEI + timeline |
| §19 Admin Dashboard (6) | ✅ + Warehouse + Users |
| §20 Mobile Delivery App | ✅ — `/courier/*` |
| §21 Security Features | ✅ — UI ready (OCR/liveness mocked) |
| §22 Roles & Permissions | ✅ — `/admin/users` |
| §28 UI/UX Direction | ✅ — design tokens applied |
| §29 Legal & Compliance | ✅ — consent checkbox + legal docs menu |
| §30 Success Metrics | ✅ — KPI cards di overview |

---

## Phase Roadmap

### Phase 1 — MVP ✅ (current)
Paste link · manual approval · DP · installment tracking · verified delivery · admin dashboard.

### Phase 2 (next)
Hubungkan ke backend NestJS, integrasi Midtrans/Xendit, marketplace scraping API, OCR KTP, WhatsApp API untuk reminder otomatis, AI risk scoring.

### Phase 3
Merchant integration, public financing API, AI collection prediction, marketplace ecosystem.

---

## Catatan Implementasi

- Semua data masih mock (di `lib/mock-data*.ts`) — siap diganti dengan API layer
- Auth, OTP, file upload, dan payment dimock dengan `setTimeout` untuk demo flow
- State management masih lokal (`useState`) — bisa di-upgrade ke Zustand / TanStack Query saat hubung ke backend
- Tidak ada test runner setup; siap di-pair dengan Vitest atau Playwright

---

## License

MIT — © 2026 PT. Manggala Utama Indonesia.

---

## Contact

Repo: <https://github.com/AnfalBlank/fintech>
