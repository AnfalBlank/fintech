# User Flows

End-to-end flow tiap actor sesuai PRD §11 dan §20.

## 1. Customer Flow

### 1.1 Registration  (PRD §11 Step 1)

```
/register
  ↓ isi form (nama, email, HP) + 2 consent checkboxes (T&C, data)
  ↓ submit
[OTP step]
  ↓ kode 6 digit dikirim ke HP
  ↓ verify
[Email verify]
  ↓ link verifikasi dikirim ke email
  ↓ "Saya sudah verifikasi"
/dashboard
```

### 1.2 Apply Cicilan  (PRD §11 Step 2-8)

```
/dashboard
  ↓ "Mulai Pengajuan"
/apply  (Step 1: Paste Link)
  ↓ paste URL Tokopedia/Shopee/TikTok/Lazada (validated)
  ↓ system scrape → Product Preview Card (nama, harga, foto, rating, kategori, resale score)
  ↓ "Lanjut ke Simulasi"
/apply/simulate  (Step 2: Simulation)
  ↓ pilih tenor 3/6/12 bln
  ↓ system hitung margin (30/33/38%) + DP rule
  ↓ Ringkasan Pembiayaan
  ↓ "Lanjut Verifikasi"
/apply/verify  (Step 3: Verification)
  ↓ upload KTP (mandatory) + selfie liveness (mandatory)
  ↓ optional: slip gaji, rekening koran
  ↓ → "Lanjut" → form data pribadi
  ↓ centang 3 konsen (perjanjian cicilan, tanda tangan digital, data)
  ↓ "Kirim Pengajuan"
/apply/approval  (Step 4: Confirmation)
  ↓ countdown review (≈ 18 menit)
  ↓ "Ke Beranda" atau "Bayar DP" jika DP diperlukan
```

### 1.3 Pembayaran Cicilan

```
/dashboard atau /installments/[id]
  ↓ "Bayar Sekarang"
/payments
  ↓ pilih VA / QRIS / E-Wallet (+ pilih bank atau e-wallet)
  ↓ countdown 24h
  ↓ "Saya Sudah Bayar" → confirm modal → success modal
  ↓ redirect /installments
```

### 1.4 Track Cicilan

```
/installments
  ↓ klik salah satu cicilan
/installments/[id]
  ↓ progress bar + jadwal per bulan + bukti delivery
```

---

## 2. Admin Flow

### 2.1 Approval Workflow  (PRD §11 Step 7, §15-16)

```
/admin
  ↓ KPI overview, klik "Pending Approvals"
/admin/approvals
  ↓ filter status (Pending / Manual Review / Approved / Rejected)
  ↓ select pengajuan dari list
  ↓ Right pane: profil user + risk circle + 4 dokumen
  ↓ klik dokumen → modal preview
  ↓ pilih action:
       Approve  → confirm modal → status = approved + toast
       Reject   → reason wajib (≥5 char) → status = rejected + toast
       Hold     → status = manual_review (escalate ke supervisor)
```

### 2.2 Purchase + Warehouse  (PRD §11 Step 9-10)

```
/admin/warehouse  (tab: Purchase Orders)
  ↓ pilih PO status "to_purchase"
  ↓ "Record Purchase" → input invoice → status = purchased
  ↓ tunggu barang sampai gudang

/admin/warehouse  (tab: Warehouse / QC)
  ↓ pilih item dengan QC pending
  ↓ "Mulai QC" modal:
       upload 3 foto
       scan/input serial number / IMEI
       checklist kondisi
  ↓ "Lolos QC" → status = passed + toast
       atau "Tandai Gagal" → status = failed
```

### 2.3 Delivery Assignment  (PRD §11 Step 11)

```
/admin/delivery
  ↓ filter All / Assigned / In Transit / Delivered / Issue
  ↓ "Reassign" → modal pilih kurir → status update
  ↓ "Update Status" → assigned → in_transit → delivered (auto-fill proof)
  ↓ "Lihat Proof" → modal foto + GPS + signature
```

### 2.4 Collection Workflow  (PRD §13-14)

```
/admin/collection
  ↓ filter aging 0-30 / 30-60 / 60-90
  ↓ select multiple via checkbox
  ↓ "WA Massal" atau "Email Reminder" → modal compose → kirim
  ↓ per-row: call / WA / email / blacklist (modal konfirmasi)
```

### 2.5 Fraud Review  (PRD §17)

```
/admin/fraud
  ↓ heatmap aktivitas + top reasons + devices to watch
  ↓ alert table → "Review" (mark as reviewed) atau "Block" (blacklist)
  ↓ "Export CSV" untuk reporting
```

### 2.6 Asset Tracking  (PRD §18)

```
/admin/assets
  ↓ filter status fisik
  ↓ "Detail" → modal dengan timeline status (PO → Warehouse → QC → Delivered)
  ↓ "Export Registry" → CSV semua aset
```

### 2.7 User & Roles  (PRD §22)

```
/admin/users
  ↓ "Tambah User" → form + pilih role → buat akun
  ↓ "Edit Role" → ganti antara 5 role
  ↓ "Suspend / Aktifkan" → toggle status
```

---

## 3. Courier Flow  (PRD §20)

```
/courier  (mobile-first)
  ↓ greeting + jumlah pengiriman + rute hari ini
  ↓ klik salah satu task
/courier/delivery/[id]
  Task panel: alamat + tombol Telepon + Navigasi (open Google Maps)
  
  Step 1: Foto Bukti (3 angle wajib)
    ↓ tap setiap slot kamera
  Step 2: GPS
    ↓ "Capture GPS" → navigator.geolocation.getCurrentPosition()
  Step 3: Verifikasi User (QR)
    ↓ "Scan QR User" → modal kamera mock
  Step 4: Tanda Tangan
    ↓ "Ambil Tanda Tangan" → tap area → tersimpan
  
  Semua 4 step ✓ → "Selesaikan Pengiriman" enabled
  ↓ submit → toast → redirect /courier
```

---

## 4. Authentication & Logout

```
Top-right avatar (user app & admin)
  ↓ klik
[Dropdown menu]
  ↓ Profil / Pengaturan / Keluar
  ↓ "Keluar" → toast → redirect /login
```

Courier app: tombol logout di top bar.

## 5. Cross-cutting

### Search

User app: tombol search di topbar → modal global search dengan saran cepat (cicilan, bayar, ajukan, profil).

Admin: search modul Approval/Finance/Warehouse/dll.

### Notifications

Bell icon → popover dengan list notif unread/read + "Tandai semua dibaca". Badge dot menunjukkan unread.

### Toast

Setiap aksi penting (approve, reject, kirim WA, simpan QC, dst.) → toast 3.5s di pojok kanan atas.
