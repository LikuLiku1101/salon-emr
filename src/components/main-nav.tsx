"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays } from "lucide-react";

const navItems = [
  { name: "ダッシュボード", href: "/", icon: LayoutDashboard },
  { name: "顧客・契約管理", href: "/customers", icon: Users },
  { name: "予約・カルテ", href: "/treatments", icon: CalendarDays },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white dark:bg-zinc-950 px-6 py-4">
      <div className="flex items-center gap-8 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center">
          <img 
            src="https://menzu-datsumou.com/wp-content/uploads/2022/06/cropped-favicon.png" 
            alt="SHINE Logo" 
            className="h-8 w-auto object-contain"
          />
        </Link>
        <div className="flex gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--salon-purple)] ${
                  isActive ? "text-[var(--salon-purple)]" : "text-zinc-500"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
