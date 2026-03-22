"use client";

import { LoadingLink } from "@/components/loading-link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays, User, LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";

const navItems = [
  { name: "ダッシュボード", href: "/", icon: LayoutDashboard },
  { name: "顧客・管理", href: "/customers", icon: Users },
  { name: "予約・カルテ", href: "/treatments", icon: CalendarDays },
];

export function MainNav({ staffName }: { staffName?: string }) {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white dark:bg-zinc-950 px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4 sm:gap-8">
          <LoadingLink href="/" className="flex items-center">
            <img 
              src="https://menzu-datsumou.com/wp-content/uploads/2022/06/cropped-favicon.png" 
              alt="SHINE Logo" 
              className="h-7 sm:h-8 w-auto object-contain"
            />
          </LoadingLink>
          <div className="flex gap-4 sm:gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <LoadingLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm font-bold transition-all hover:text-[var(--salon-purple)] ${
                    isActive ? "text-[var(--salon-purple)]" : "text-zinc-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.name}</span>
                </LoadingLink>
              );
            })}
          </div>
        </div>

        {/* ユーザー情報 & ログアウト */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Logged in as</span>
            <span className="text-sm font-black text-gray-800">{staffName || "Staff"}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-50 border rounded-full pl-1 pr-3 py-1 scale-95 sm:scale-100">
            <div className="h-7 w-7 rounded-full bg-[var(--salon-purple)] text-white flex items-center justify-center text-[10px] font-black shadow-sm">
               {staffName?.charAt(0) || <User className="w-4 h-4" />}
            </div>
            <button 
              onClick={() => logout()}
              className="text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors"
              title="ログアウト"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
