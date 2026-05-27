# PRD FINAL — PLATFORM TALANGAN PEMBELIAN CICILAN

## PT. Manggala Utama Indonesia

---

# 1. Product Overview

Platform pembiayaan/talangan pembelian barang berbasis web app dimana user dapat membeli barang dari marketplace menggunakan sistem cicilan melalui PT. Manggala Utama Indonesia.

User cukup:

* paste link produk marketplace,
* memilih tenor cicilan,
* upload data verifikasi,
* lalu sistem akan melakukan proses approval.

PT. Manggala Utama Indonesia akan:

* menalangi pembelian,
* menerima barang,
* melakukan quality control,
* menyerahkan langsung ke user,
* serta memonitor pembayaran cicilan.

---

# 2. Product Vision

Membangun:

## “Verified Delivery Financing Platform”

yang menggabungkan:

* financing,
* physical verification,
* anti fraud,
* delivery validation,
* dan collection monitoring

dalam satu ekosistem modern.

---

# 3. Business Goals

## Objectives

* Membuka bisnis financing internal
* Menghasilkan margin cicilan
* Menekan fraud & gagal bayar
* Membangun database credit scoring internal
* Membuat approval financing lebih fleksibel dibanding paylater tradisional

---

# 4. Target Users

## Primary Users

* Karyawan tetap
* Freelancer stabil
* Driver online
* UMKM
* Reseller online
* Pekerja lapangan

---

## Secondary Users

* Mahasiswa tertentu
* Komunitas internal
* Partner perusahaan

---

# 5. Core Business Model

## Financing Scheme

PT. Manggala Utama Indonesia akan:

* membeli barang terlebih dahulu,
* lalu user membayar cicilan bulanan.

---

# 6. Margin Structure

## Default Margin

### 30–35% total untuk tenor 3 bulan

---

## Example

### Barang

Rp 3.000.000

### Margin

30%

### Total Cicilan

Rp 3.900.000

### Cicilan

Rp 1.300.000/bulan

---

# 7. Down Payment Rules

## RULE 1 — NO DP

### Syarat:

* harga barang ≤ Rp 3 juta
* risk score bagus
* tenor maksimal 3 bulan

---

## RULE 2 — WAJIB DP

### Jika:

* harga barang > Rp 3 juta
* kategori high risk
* user baru
* risk score medium/high

---

## DP Structure

| Harga Barang | DP Minimum |
| ------------ | ---------- |
| Rp 3–5 juta  | 10%        |
| Rp 5–10 juta | 20%        |
| > Rp 10 juta | 30%        |

---

# 8. User Trust Level System

## Level 1 — New User

* limit max Rp 3 juta
* tenor max 3 bulan
* no DP hanya jika score bagus

---

## Level 2 — Trusted User

* limit naik Rp 5 juta
* DP lebih kecil
* approval lebih cepat

---

## Level 3 — Priority User

* limit besar
* margin lebih rendah
* fast approval

---

# 9. Approved Product Categories

## SAFE CATEGORY

### Elektronik Produktif

* smartphone
* laptop
* tablet
* printer

---

### Home Appliance

* AC
* kulkas
* mesin cuci

---

### Peralatan Usaha

* freezer
* mesin kopi
* mesin usaha
* alat kasir

---

# 10. Restricted Categories

## HIGH RISK

* luxury fashion
* sneakers hype
* gaming high-end
* jewelry
* collectibles
* crypto mining

---

# 11. User Flow

---

# STEP 1 — User Registration

## Features

* nomor HP
* OTP verification
* email verification
* device binding

---

# STEP 2 — Paste Product Link

User paste:

* Tokopedia
* Shopee
* TikTok Shop
* Lazada

---

# STEP 3 — Product Scraping

System mengambil:

* nama produk
* harga
* gambar
* toko
* rating toko
* kategori
* estimasi resale value

---

# STEP 4 — Installment Simulation

System menampilkan:

* total pembiayaan
* margin
* cicilan bulanan
* tenor
* due date

---

# STEP 5 — User Verification

## Required Data

* KTP
* selfie
* alamat
* pekerjaan
* penghasilan
* kontak darurat

---

## Optional Documents

* slip gaji
* rekening koran
* surat kerja

---

# STEP 6 — Risk Scoring

System menghitung:

* kemampuan bayar
* jenis pekerjaan
* kategori barang
* lokasi
* device trust
* histori user

---

# STEP 7 — Approval

## Auto Approve

Jika:

* limit kecil
* score bagus

---

## Manual Review

Jika:

* limit tinggi
* barang risky
* data kurang lengkap

---

## Auto Reject

Jika:

* fraud detected
* fake KTP
* suspicious device

---

# STEP 8 — DP Payment

Jika diperlukan:

* user bayar DP
* sistem generate invoice

---

# STEP 9 — Purchase Process

Tim internal:

* checkout barang
* simpan invoice
* simpan IMEI/serial number

---

# STEP 10 — Warehouse Verification

Barang masuk:

* kantor/gudang

---

## QC Process

* cek kondisi barang
* foto dokumentasi
* validasi serial number

---

# STEP 11 — Delivery Assignment

Admin assign:

* kurir internal
* jadwal pengiriman

---

# STEP 12 — Verified Delivery

Kurir wajib:

* verifikasi user
* upload foto
* capture GPS
* ambil tanda tangan digital

---

# 12. Delivery Verification System

## Mandatory Evidence

### Foto

* user pegang barang
* depan rumah
* kurir + user

---

### GPS

* latitude
* longitude
* timestamp

---

### Signature

* tanda tangan digital

---

# 13. Installment Monitoring

System:

* reminder otomatis
* due tracking
* overdue monitoring
* penalty system

---

# 14. Collection System

## Collection Dashboard

Menampilkan:

* overdue list
* aging payment
* collection status
* blacklist

---

## Reminder Automation

* WhatsApp
* email
* push notification

---

# 15. Risk Scoring System

## Risk Components

| Faktor          | Bobot |
| --------------- | ----- |
| Penghasilan     | 25%   |
| Jenis pekerjaan | 20%   |
| Barang          | 20%   |
| DP              | 15%   |
| Lokasi          | 10%   |
| Device trust    | 10%   |

---

# 16. Risk Grade

| Grade | Status            |
| ----- | ----------------- |
| A     | Auto approve      |
| B     | Semi manual       |
| C     | Supervisor review |
| D     | Reject            |

---

# 17. Fraud Detection System

## Detection

* multiple accounts
* same device
* fake KTP
* edited document
* suspicious behavior

---

# 18. Asset Tracking System

Tracking:

* IMEI
* serial number
* invoice
* resale value
* asset status

---

# 19. Admin Dashboard Modules

---

# APPROVAL DASHBOARD

Features:

* review pengajuan
* risk score
* approve/reject
* document viewer

---

# FINANCE DASHBOARD

KPI:

* modal keluar
* outstanding
* profit
* overdue
* NPL
* collection rate

---

# COLLECTION DASHBOARD

Features:

* due today
* overdue monitoring
* payment tracking
* blacklist

---

# DELIVERY DASHBOARD

Features:

* kurir tracking
* delivery status
* proof verification
* GPS logs

---

# FRAUD DASHBOARD

Features:

* suspicious account
* device duplication
* fake identity detection

---

# ASSET DASHBOARD

Features:

* active asset
* serial tracking
* resale estimate

---

# 20. Mobile Delivery App

## Features

* login kurir
* route assignment
* QR verification
* upload foto
* digital signature
* GPS tracking

---

# 21. Security System

## Security Features

* OCR KTP
* selfie matching
* liveness detection
* device fingerprinting
* HTTPS SSL
* AES encryption
* audit logs

---

# 22. Roles & Permissions

## Super Admin

Full access

---

## Finance Admin

Approval & finance

---

## Collection Team

Collection monitoring

---

## Delivery Team

Delivery verification

---

## Surveyor

Field validation

---

# 23. Technical Stack

## Frontend

* Next.js App Router
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion

---

## Backend

* NestJS
* PostgreSQL
* Redis Queue

---

## Storage

* Cloudflare R2 / S3

---

## Payments

* Midtrans
* Xendit

---

## Notification

* WhatsApp API
* Email
* Push Notification

---

# 24. Database Core Tables

* users
* applications
* products
* installments
* payments
* deliveries
* delivery_proofs
* risk_scores
* fraud_logs
* assets
* devices
* blacklists
* notifications

---

# 25. Operational Rules

## Maximum Installment

Maksimal:
35% dari penghasilan bulanan

---

## Initial User Limit

Rp 1–3 juta

---

## Initial Tenor

3 bulan

---

## Coverage Area MVP

Disarankan:

* Jabodetabek
* Bandung
* Bekasi

---

# 26. KPI Targets

| KPI             | Target     |
| --------------- | ---------- |
| Approval SLA    | < 30 menit |
| Delivery SLA    | < 24 jam   |
| Default Rate    | < 5%       |
| Collection Rate | > 90%      |

---

# 27. Development Phases

# PHASE 1 — MVP

Features:

* paste link
* manual approval
* DP
* installment tracking
* verified delivery
* admin dashboard

---

# PHASE 2

Features:

* AI scoring
* AI fraud detection
* auto reminder
* analytics dashboard

---

# PHASE 3

Features:

* merchant integration
* financing API
* AI collection prediction
* marketplace ecosystem

---

# 28. UI/UX Direction

## Style

* fintech modern
* premium clean
* responsive
* light theme
* glassmorphism
* blue + white tone

---

# 29. Legal & Compliance

Disarankan:

* Terms & Conditions
* Privacy Policy
* Perjanjian cicilan digital
* Persetujuan tanda tangan digital
* Persetujuan pengambilan data

---

# 30. Success Metrics

## Indicators

* repayment rate
* low fraud rate
* repeat customer
* operational efficiency
* profit margin
* approval speed

---

# Final Vision

Membangun:

## “Smart Verified Financing Ecosystem”

yang menggabungkan:

* financing,
* delivery verification,
* anti fraud,
* collection monitoring,
* dan AI risk scoring

dalam satu platform modern milik PT. Manggala Utama Indonesia.
