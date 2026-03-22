import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/main-nav";
import { createClient } from "@/utils/supabase/server";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // スタッフ名を取得 (email で紐付け)
  let staffName = user?.email || "";
  if (user?.email) {
    const { data: staff } = await supabase
      .from("staff")
      .select("name")
      .eq("email", user.email)
      .single();
    if (staff) staffName = staff.name;
  }

  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen`}
      >
        {user && <MainNav staffName={staffName} />}
        <main>{children}</main>
      </body>
    </html>
  );
}
