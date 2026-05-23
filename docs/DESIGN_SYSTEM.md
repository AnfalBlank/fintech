# Design System

Implementasi tokens dari `desaign.md` untuk konsistensi di semua halaman.

## Color Tokens

Akses via Tailwind classes yang dideklarasikan di `tailwind.config.ts`:

| Token | Hex | Usage |
|---|---|---|
| `bg-primary` | `#2563EB` | CTA, primary button, active state, financial indicators |
| `bg-primary-50` … `bg-primary-900` | scale | Soft backgrounds, hover states |
| `bg-sky` | `#60A5FA` | Hover, soft accents |
| `bg-emerald` | `#10B981` | Success, paid, verified |
| `bg-warning` | `#F59E0B` | Pending, due today |
| `bg-danger` | `#EF4444` | Failed, overdue, rejected |
| `bg-bg` | `#F8FAFC` | Page background |
| `bg-card` | `#FFFFFF` | Card surface |
| `text-ink` | `#0F172A` | Primary text |
| `text-ink-muted` | `#64748B` | Secondary text, captions |
| `bg-navy` | `#0B1220` | Admin sidebar |

## Typography

```
text-hero      48px / line 1.05 / tracking -0.02em
text-page      32px / line 1.2  / tracking -0.01em
text-section   24px
text-cardtitle 18px
text-base      16px
text-sm        14px
text-xs        12px
```

Font: **Inter** loaded via `next/font/google`, exposed as `--font-inter` CSS var.

## Border Radius

```
rounded-2xl       16px   buttons, inputs, chips
rounded-3xl       24px   cards, modals
rounded-[32px]    32px   hero cards
rounded-full      pill   badges, status pills
```

## Shadows

```
shadow-soft   0 4px 20px rgba(15, 23, 42, 0.08)   default cards
shadow-float  0 10px 40px rgba(15, 23, 42, 0.12)  floating panels, modals
shadow-ring   0 0 0 4px rgba(37, 99, 235, 0.12)   focus state
```

## Glassmorphism

```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(226, 232, 240, 0.8);
}
```

Dipakai di top navbar, modals, dan beberapa floating cards. **Jangan berlebihan** — hanya untuk overlay.

## Animation

```
animate-fadeIn    240ms ease-out, opacity + translateY
animate-shimmer   1.6s linear infinite, background-position
```

Durasi standar: **150–300ms**. Hindari bounce dan flashy.

## Components Library

### Button (`components/ui/button.tsx`)

```tsx
<Button variant="primary | secondary | ghost | danger | success | outline"
        size="sm | md | lg | icon"
        block>
  Label
</Button>
```

### Card

```tsx
<Card className="...">
  <CardTitle>Section</CardTitle>
  <CardDescription>...</CardDescription>
  ...
</Card>
```

### Badge

```tsx
<Badge tone="primary | success | warning | danger | muted | info">
  Label
</Badge>
```

### Modal

```tsx
<Modal open={open} onClose={...} title="..." description="..." size="sm | md | lg">
  ...
</Modal>
```

### Toast

```tsx
const toast = useToast();
toast.success("Title", "Description");
toast.danger("Title", "Description");
```

### StatCard (KPI)

```tsx
<StatCard label="Outstanding"
          value={formatIDR(2_345_000_000)}
          delta="+12%"
          trend="up"
          Icon={Wallet}
          tone="primary" />
```

## Status Tone Mapping

| Status | Tone | Class |
|---|---|---|
| Approved, Paid, Verified | success | `bg-emerald/10 text-emerald` |
| Active, Primary | primary | `bg-primary-50 text-primary` |
| Pending, Due | warning | `bg-warning/10 text-warning` |
| Overdue, Rejected, Failed | danger | `bg-danger/10 text-danger` |
| Manual Review, Info | info | `bg-sky-100 text-sky-700` |
| Default | muted | `bg-slate-100 text-ink-muted` |

## Responsive Breakpoints

Standard Tailwind:
```
sm   640px
md   768px
lg   1024px
xl   1280px
2xl  1440px   ← container max
```

User app mobile-first; admin lg-first; courier always mobile.

## Accessibility Notes

- Minimum touch target: 44px (default Button height 48px ≥)
- High contrast: ink on bg, white on primary — both ≥ 4.5:1
- Focus visible: `shadow-ring` pada inputs and buttons
- Modals: trapped focus, escape key, ARIA `role="dialog" aria-modal`
- Notifications: `role="status"` for screen readers
