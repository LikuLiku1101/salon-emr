import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/main-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SHINE Salon EMR",
  description: "脱毛サロン向け 電子カルテ＆店舗管理システム",
  icons: {
    icon: "/icon.jpg",
    apple: "/icon.jpg",
  },
  appleWebApp: {
    title: "SHINE",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0D9488",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen`}
      >
        <MainNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
