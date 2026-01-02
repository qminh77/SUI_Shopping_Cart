import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SuiProviders } from "@/providers/SuiProviders";
import { CartProvider } from "@/contexts/CartContext";
import { GeistProviders } from "@/providers/GeistProviders";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SUI Shopping Cart - Web3 Marketplace",
  description: "Decentralized marketplace on Sui blockchain - Buy and sell verifiable digital assets with instant settlement",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  openGraph: {
    title: "SUI Shopping Cart",
    description: "Decentralized marketplace on Sui blockchain",
    type: "website",
  },
  icons: {
    icon: '/vercel.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <GeistProviders>
          <SuiProviders>
            <CartProvider>
              {children}
            </CartProvider>
          </SuiProviders>
        </GeistProviders>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
