import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "https://manggala.local"
  ),
  title: {
    default: "Manggala — Verified Financing Platform",
    template: "%s · Manggala",
  },
  description:
    "Platform talangan pembelian cicilan PT. Manggala Utama Indonesia. Beli sekarang, cicil dengan tenang.",
  applicationName: "Manggala",
  authors: [{ name: "PT. Manggala Utama Indonesia" }],
  keywords: [
    "fintech",
    "cicilan",
    "pembiayaan",
    "marketplace",
    "Tokopedia",
    "Shopee",
    "verified delivery",
  ],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Manggala — Verified Financing Platform",
    description:
      "Beli sekarang, cicil dengan tenang. Verified delivery + financing dalam satu platform.",
    siteName: "Manggala",
    type: "website",
    locale: "id_ID",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Manggala — Verified Financing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Manggala — Verified Financing Platform",
    description: "Beli sekarang, cicil dengan tenang.",
    images: ["/og-image.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Manggala",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
