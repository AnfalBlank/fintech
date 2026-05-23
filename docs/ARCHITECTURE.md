# Architecture

High-level frontend architecture untuk Manggala Verified Financing Platform.

## App Router Layout

```
app/
├── layout.tsx                  Root layout + ToastProvider + Inter font
├── page.tsx                    Public landing
├── globals.css                 Tailwind base + design tokens
│
├── (auth)/                     Route group (no segment in URL)
│   ├── layout.tsx              Two-column auth layout
│   ├── login/page.tsx          OTP login
│   └── register/page.tsx       Multi-step registration
│
├── (user)/                     Route group — user app shell
│   ├── layout.tsx              UserAppShell (top bar + bottom nav)
│   ├── dashboard/page.tsx
│   ├── apply/
│   │   ├── page.tsx            Paste link
│   │   ├── simulate/page.tsx   Tenor + DP simulation
│   │   ├── verify/page.tsx     Doc upload + form + consent
│   │   └── approval/page.tsx   Confirmation
│   ├── installments/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── payments/page.tsx
│   └── profile/page.tsx
│
├── admin/                      Internal console
│   ├── layout.tsx              AdminShell (navy sidebar)
│   ├── page.tsx                Overview KPI
│   ├── approvals/page.tsx
│   ├── finance/page.tsx
│   ├── warehouse/page.tsx      PO + QC
│   ├── delivery/page.tsx
│   ├── collection/page.tsx
│   ├── fraud/page.tsx
│   ├── assets/page.tsx
│   └── users/page.tsx          Roles & permissions
│
└── courier/                    Mobile delivery app
    ├── layout.tsx              Mobile-first shell
    ├── page.tsx                Today route
    ├── delivery/[id]/page.tsx  Verified delivery flow
    ├── history/page.tsx
    └── profile/page.tsx
```

## Component Boundaries

```
components/
├── ui/        Generic primitives (used by all 3 apps)
├── user/      User-app-specific (shell, stepper)
├── admin/     Admin-specific (shell)
└── courier/   Courier-specific (shell)
```

## Data Flow

Currently all data lives in `lib/mock-data*.ts` and is rendered via:

1. Server Component reads mock array (e.g. `installments/page.tsx`)
2. Client Component does `useState` of the array for local mutation (e.g. `admin/approvals/page.tsx`)

When backend is ready, replace `lib/mock-data*.ts` with API client (suggested: TanStack Query + Zod).

## Styling

- All design tokens are mapped in `tailwind.config.ts` so component code uses semantic classes (`text-ink`, `bg-primary`, `rounded-3xl`)
- `app/globals.css` declares utility classes for common patterns (`btn-primary`, `card-base`, `input-base`, `glass`, `chip`, `skeleton`)

## Key UI Patterns

| Pattern | Implementation |
|---|---|
| Toast notifications | Global `ToastProvider` + `useToast()` hook (`components/ui/toast.tsx`) |
| Modal dialogs | `<Modal>` with backdrop, escape key, scroll lock, 3 sizes |
| Notifications popover | `<NotificationsPopover>` with unread tracking |
| Mobile bottom nav + desktop sidebar | `(user)/layout.tsx` switches via `md:` breakpoint |
| Split-view list ↔ detail | `admin/approvals/page.tsx` uses `lg:grid-cols-[400px_1fr]` |
| Multi-step flow | `apply/*` pages share `Stepper` component |

## Build Output

```
26 routes total:
- 23 static (○)
- 3 dynamic (ƒ): installments/[id], courier/delivery/[id], (none server-rendered yet)
```

First Load JS shared baseline: ~87 kB (Next.js + React).
