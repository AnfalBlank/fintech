1. Design Vision

Membangun pengalaman UI/UX modern bergaya fintech premium yang:

cepat dipahami user,
meningkatkan trust,
mempermudah proses cicilan,
memberikan kesan aman & profesional,
serta mendukung operasional internal dengan workflow yang efisien.

Platform harus terasa seperti kombinasi:

Kredivo
Akulaku
Stripe Dashboard
Linear
dan modern SaaS fintech.
2. Design Principles
2.1 Trust First

Karena platform berkaitan dengan financing:

UI harus clean,
professional,
stabil,
dan terpercaya.

Hindari:

terlalu banyak warna mencolok,
animasi berlebihan,
desain terlalu playful.
2.2 Fast Interaction

User harus dapat:

submit link,
melihat simulasi,
dan mengajukan pembiayaan

kurang dari 3 menit.

2.3 Mobile First

Mayoritas user akan menggunakan smartphone.

Semua flow utama:

paste link,
upload dokumen,
pembayaran,
tracking cicilan

harus dioptimalkan untuk mobile.

2.4 Operational Efficiency

Dashboard internal harus:

cepat,
minim klik,
mudah monitoring,
dan mudah digunakan tim operasional.
3. Brand Personality
Personality
Professional
Secure
Modern
Efficient
Trustworthy
Premium
Smart Financing
4. Color System
Primary Color
Royal Blue
#2563EB

Digunakan untuk:

primary button
active state
highlights
CTA
financial indicators
Secondary Color
Sky Blue
#60A5FA

Digunakan untuk:

hover state
cards
soft background
Accent Color
Emerald Green
#10B981

Digunakan untuk:

success
payment success
approved status
Warning Color
#F59E0B
Danger Color
#EF4444
Neutral Colors
Background
#F8FAFC
Card
#FFFFFF
Border
#E2E8F0
Text Primary
#0F172A
Text Secondary
#64748B
5. Typography
Font Family

Recommended:

Inter

Alternative:

Plus Jakarta Sans
Geist
Typography Scale
Usage	Size
Hero Title	48px
Page Title	32px
Section Title	24px
Card Title	18px
Body	14–16px
Caption	12px
6. Layout System
Grid System

Desktop:

12 columns

Tablet:

8 columns

Mobile:

4 columns
Container Width
max-width: 1440px;
Spacing System

Use consistent spacing:

4
8
12
16
20
24
32
40
48
64
7. Border Radius
Main Radius
24px

Digunakan untuk:

cards
modal
dashboard panel
Small Radius
16px

Digunakan untuk:

input
buttons
tags
8. Shadow System
Soft Shadow
box-shadow:
0 4px 20px rgba(15, 23, 42, 0.08)
Floating Card Shadow
box-shadow:
0 10px 40px rgba(15, 23, 42, 0.12)
9. Glassmorphism Style

Gunakan subtle glass effect.

backdrop-filter: blur(20px)

Dipakai hanya untuk:

floating cards
top navigation
modal tertentu

Jangan berlebihan.

10. Animation Guidelines
Animation Style

Gunakan:

smooth
soft
responsive

Hindari:

bounce berlebihan
flashy animation
Animation Duration
150ms – 300ms
Recommended Motion
fade in
subtle slide
scale hover
loading shimmer
11. UI Component Guidelines
11.1 Buttons
Primary Button
blue background
white text
bold
height 48–56px
rounded 16px
Secondary Button
white background
border gray
text dark
Danger Button
red background
white text
11.2 Input Fields

Style:

rounded-xl
soft border
large touch area
clear focus state
Input Height
56px
11.3 Cards

Card style:

white
soft shadow
subtle border
rounded-3xl
spacious padding
11.4 Tables

Dashboard tables harus:

mudah dibaca
sticky header
zebra row optional
responsive
12. User App UI
12.1 Home Dashboard
Sections
greeting
active installment
quick financing input
recent transactions
trust level
payment reminder
Hero Card

Menampilkan:

total cicilan aktif
due date
payment status

Style:

gradient blue
rounded 32px
premium look
12.2 Paste Link Section

Fokus utama platform.

UI harus:

besar,
sederhana,
dan mudah dipahami.
Input Style
large input
paste icon
instant preview
auto loading animation
12.3 Product Preview Card

Menampilkan:

foto produk
nama produk
harga
rating toko
kategori
resale score
12.4 Installment Simulation

User dapat memilih:

tenor
DP

Tampilkan:

total cicilan
monthly payment
margin
due date
UI Style
card selection
active blue border
large numbers
easy comparison
12.5 Verification Upload

Upload flow harus:

simple
guided
mobile friendly
Upload Components
upload KTP
selfie camera
slip gaji
rekening koran
UX Notes

Gunakan:

step indicator
upload success state
auto crop preview
12.6 Payment Screen

Menampilkan:

invoice
VA number
QRIS
countdown timer
12.7 Installment Tracking

Menampilkan:

progress pembayaran
due date
overdue warning
payment history
13. Admin Dashboard UI
13.1 Dashboard Layout
Sidebar

Style:

dark navy
clean icons
compact
collapsible
Topbar

Menampilkan:

search
notifications
profile
quick actions
13.2 KPI Cards

Menampilkan:

outstanding
overdue
total profit
active users
collection rate
KPI Style
large numbers
small graph
status indicator
soft shadow
13.3 Approval Dashboard
Layout

Split view:

Left
application list
Right
detail application
documents
risk score
actions
Risk Score Display

Gunakan:

circular progress
grade badge
risk indicator color
13.4 Fraud Dashboard

Tampilkan:

suspicious accounts
duplicate devices
fake KTP detection
fraud heatmap
13.5 Collection Dashboard
Features
overdue aging
reminder status
collection notes
blacklist status
13.6 Asset Dashboard

Tracking:

IMEI
serial number
delivery proof
resale estimate
14. Delivery App UI
14.1 Courier Dashboard

Menampilkan:

delivery today
route list
pending verification
14.2 Delivery Verification

Kurir wajib:

upload foto
capture GPS
scan QR
ambil signature
UX Priority

Harus:

cepat
offline-friendly
minim klik
15. Status System
Success
#10B981
Pending
#F59E0B
Failed
#EF4444
Active
#2563EB
16. Empty States

Gunakan:

illustration minimalis
friendly message
CTA button
17. Loading States

Gunakan:

skeleton loading
shimmer effect
progress indicator
18. Error Handling UX

Error message harus:

jelas
singkat
actionable

Contoh:

❌ Hindari: "Error 500"

✅ Gunakan: "Upload gagal, coba gunakan foto yang lebih jelas"

19. Accessibility

Gunakan:

high contrast
minimum touch target 44px
keyboard accessible
readable typography
20. Responsive Rules
Mobile

Prioritas:

bottom navigation
floating CTA
simplified layout
Desktop

Prioritas:

monitoring
analytics
multi panel dashboard
21. Recommended Stack
Frontend
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Framer Motion
lucide-react
22. Icon Guidelines

Gunakan:

lucide-react

Style:

outline icons
clean
consistent stroke
23. Chart Design

Charts harus:

minimalis
mudah dibaca
smooth
tidak terlalu ramai

Recommended:

line chart
bar chart
donut chart
24. UX Strategy
Goal Utama

User harus merasa:

mudah,
aman,
cepat,
dan dipercaya.
25. Design Inspiration
UI References
Stripe Dashboard
Linear
Ramp
Brex
Kredivo
Atome
Akulaku
26. Final Design Direction

Platform harus terasa seperti:

“Modern Verified Financing Platform”

yang:

premium,
secure,
operationally powerful,
dan scalable untuk fintech ecosystem modern.

Saya sudah buatkan design.md lengkap khusus UI/UX untuk platform talangan cicilan Anda.

Isinya meliputi:

Design vision
Design system
Color palette fintech premium
Typography
Layout & spacing
Dashboard UI guidelines
Mobile app UX
Delivery verification app UI
Component system
Animation guidelines
Responsive rules
UX strategy
Design inspiration
Frontend stack recommendation

Style diarahkan ke:

fintech modern,
clean premium,
trust-oriented,
scalable seperti Stripe/Kredivo/Linear.