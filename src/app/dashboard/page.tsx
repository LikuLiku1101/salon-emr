import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, TrendingUp, CalendarCheck, FileSpreadsheet, DollarSign } from "lucide-react";
import Link from "next/link";
import { SyncButton } from "./sync-button";

const COURSE_PRICES: Record<string, number> = {
  "全身脱毛": 30000,
  "フェイスセット": 11500,
  "VIOセット": 20000,
  "腰から下セット": 25000,
  "首から下セット": 28000,
};

const PART_PRICES: Record<string, number> = {
  "おでこ": 2980, "ほほ": 2980, "口周り": 2980, "あご": 2980, "くび": 2980,
  "肩回り": 3300, "脇": 3300, "乳首": 3300, "ひざ": 3300, "足首から先": 3300,
  "胸": 4980, "お腹": 4980, "もも": 4980, "すね": 4980, "背中": 4980, "お尻": 4980,
  "Vライン": 5500, "Iライン": 5500, "Oライン": 5500, "睾丸": 5500, "陰茎": 5500,
};

function calculateEstimatedPrice(reservedContent: string | null, gender: string | undefined): number {
  if (!reservedContent) return 0;
  
  let price = 0;
  if (COURSE_PRICES[reservedContent]) {
    price = COURSE_PRICES[reservedContent];
  } else {
    // ポイント施術のカンマ（、）区切りの場合
    const parts = reservedContent.split('、');
    for (const part of parts) {
      if (PART_PRICES[part]) {
        price += PART_PRICES[part];
      }
    }
  }

  // 女性は10%オフ
  if (gender === '女性') {
    price = Math.floor(price * 0.9);
  }

  return price;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // 1. 今月の確定売上 (payments)
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .gte("payment_date", firstDay)
    .lte("payment_date", lastDay);
    
  const totalSales = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  // 2. 今月の見込み売上 (未来の予約)
  // 当月内の予約（今日以降）を取得
  const today = now.toISOString().split('T')[0];
  const { data: futureReservations } = await supabase
    .from("treatments")
    .select("id, reserved_content, customers(gender)")
    .gte("visit_date", today)
    .lte("visit_date", lastDay);
    
  const reservationCount = futureReservations?.length || 0;
  
  let estimatedSales = 0;
  if (futureReservations) {
    for (const res of futureReservations) {
      // SupabaseのJOIN結果はオブジェクトの配列または単一オブジェクトになる
      const gender = Array.isArray(res.customers) ? res.customers[0]?.gender : (res.customers as any)?.gender;
      estimatedSales += calculateEstimatedPrice(res.reserved_content, gender);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* ヘッダー */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-[var(--salon-purple)] transition-colors mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              メインメニューへ戻る
            </Link>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">経営者ダッシュボード</h1>
            <p className="text-sm font-bold text-gray-400 mt-1">{now.getFullYear()}年{now.getMonth() + 1}月の実績と見込み</p>
          </div>
          <SyncButton />
        </header>
        
        {/* KPIカード群 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* 売上カード */}
           <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-xl shadow-purple-900/20 group hover:shadow-2xl transition-all">
             <div className="absolute -top-10 -right-10 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
               <DollarSign className="w-48 h-48" />
             </div>
             <div className="relative z-10 space-y-4">
               <h2 className="text-sm font-bold uppercase tracking-widest text-purple-200">月間確定売上</h2>
               <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-black tracking-tighter">¥{totalSales.toLocaleString()}</span>
               </div>
               <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-md">
                 <TrendingUp className="w-3.5 h-3.5" />
                 当月の決済完了分
               </div>
             </div>
           </div>

           {/* 見込み売上カード */}
           <div className="relative overflow-hidden bg-white border-2 border-gray-100 rounded-3xl p-8 text-gray-900 shadow-xl shadow-gray-200/50 group hover:shadow-2xl transition-all">
             <div className="absolute -top-10 -right-10 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
               <CalendarCheck className="w-48 h-48" />
             </div>
             <div className="relative z-10 space-y-4">
               <div className="flex items-center justify-between">
                 <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">見込み売上 (未決済の予約分)</h2>
               </div>
               <div className="flex items-baseline gap-2">
                 <span className="text-5xl font-black tracking-tighter text-[var(--salon-purple)]">¥{estimatedSales.toLocaleString()}</span>
               </div>
               <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-[var(--salon-purple)] rounded-full text-xs font-bold">
                 <CalendarCheck className="w-3.5 h-3.5" />
                 今月の残り予約: {reservationCount}件
               </div>
               <div className="pt-2">
                 <p className="text-[10px] text-gray-400 font-bold bg-gray-50 inline-block px-2 py-1 rounded">※料金表ベースで算出（女性10%オフ適用）</p>
               </div>
             </div>
           </div>
        </div>

        {/* スプレッドシート連携エリア */}
        <div className="bg-white border-2 border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 border border-green-100">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">スプレッドシート自動連携</h3>
              <p className="text-sm font-bold text-gray-500">Google Sheetsへ最新の売上・顧客データを反映させます</p>
            </div>
          </div>
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-600 font-bold leading-relaxed">
              画面右上の「シートに反映」ボタンを押すことで、連携処理が走る設計になっています。<br/>
              本格的に書き込むためには、対象の<span className="text-gray-900 bg-white px-1 py-0.5 rounded shadow-sm border mx-1">スプレッドシートのURL</span>や、<span className="text-gray-900 bg-white px-1 py-0.5 rounded shadow-sm border mx-1">書き込み先の形式（列の並び）</span>を教えていただく必要があります。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
