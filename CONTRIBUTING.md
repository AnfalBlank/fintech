# Contributing

Panduan singkat untuk kontributor.

## Dev Setup

```bash
git clone https://github.com/AnfalBlank/fintech.git
cd fintech
npm install
npm run dev
```

## Konvensi

- **TypeScript strict** — semua file `.ts` / `.tsx`
- **App Router only** — tidak menggunakan `pages/`
- **Server Components by default** — gunakan `"use client"` hanya saat butuh state, effect, atau event handler
- **Path alias** `@/*` → root project
- **Format**: gunakan Prettier config bawaan (atau Tailwind class-sorting plugin saat tersedia)

## Branch Naming

```
feat/<scope>-<short-desc>     contoh: feat/courier-signature-pad
fix/<scope>-<short-desc>      contoh: fix/payments-countdown-tz
chore/<short-desc>            contoh: chore/upgrade-next
docs/<short-desc>
```

## Commit Messages

Gunakan [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(admin): add bulk WA reminder
fix(payments): correct countdown timer
docs: update README with mobile flow
chore: bump tailwind to 3.5
```

## Pull Request Checklist

Sebelum buka PR:

- [ ] `npm run build` sukses tanpa warning
- [ ] Tidak ada `console.log` yang tertinggal
- [ ] Setiap button punya handler — tidak ada dead button
- [ ] Tambahan halaman didaftarkan di nav (sidebar admin / bottom nav user)
- [ ] Toast feedback di setiap mutasi state penting
- [ ] Mobile responsive sampai breakpoint `sm` (640px)
- [ ] Update `README.md` atau `docs/*` jika menambah modul baru

## Adding a New Admin Module

1. Buat folder `app/admin/<modul>/page.tsx`
2. Tambah nav item di `components/admin/admin-shell.tsx`:
   ```ts
   { href: "/admin/<modul>", label: "<Label>", Icon: <LucideIcon> }
   ```
3. Tambah mock data di `lib/mock-data.ts` atau `lib/mock-data-extra.ts`
4. Pastikan setiap action button connect ke `useToast()` dan/atau `<Modal>` untuk feedback

## Adding Backend Integration

Saat backend siap:

1. Buat `lib/api/<resource>.ts` dengan TanStack Query atau fetch wrapper
2. Replace import dari `lib/mock-data*` dengan hook API
3. Tambah loading state (gunakan `<Skeleton>`) dan error toast
4. Provider auth → wrap di `app/layout.tsx`

## Testing (Future)

Belum ada test runner. Saat ditambahkan, prefer:

- **Vitest** untuk unit (logic di `lib/financing.ts`)
- **Playwright** untuk E2E (apply flow, courier flow)

Tempatkan tests di `tests/` mirror struktur source.

## Reporting Issues

Buka issue di GitHub dengan template:

```
**What happened**
**What did you expect**
**Steps to reproduce**
**Screenshots / video**
**Browser & device**
```
