import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Users, Plus, UserPlus, FilePlus, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { LoadingLink } from "@/components/loading-link";
import { LineJoinDialog } from "@/components/line-join-dialog-wrapper";

const COURSE_NAMES = ["全身脱毛", "フェイスセット", "VIOセット", "腰から下セット", "首から下セット"];

export default async function Dashboard() {
  const supabase = await createClient();

  // 今日の日付を取得 (JST固定)
  const todayJst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const today = format(todayJst, "yyyy-MM-dd");

  // 本日の予約情報(treatments)を取得する (担当者名、顧客名付き)
  const { data: todayTreatments, error } = await supabase
    .from("treatments")
    .select(
      `
      id, visit_time, visit_count, next_reservation_date, line_notified, notes, reserved_content,
      customers ( name ),
      staff ( name ),
      treatment_details ( body_part )
    `
    )
    .eq("visit_date", today)
    .order("visit_time", { ascending: true });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1 text-sm font-bold" suppressHydrationWarning>
            今日（{format(todayJst, "yyyy年MM月dd日(E)", { locale: ja })}）の営業状況
          </p>
        </div>
      </header>

      {/* クイックアクションボタン */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LoadingLink href="/treatments/new-sheet" className="group">
          <div className="h-24 sm:h-32 bg-[var(--salon-purple)] text-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-lg shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-1 transition-all active:scale-95 relative overflow-hidden">
            <Sparkles className="absolute -right-2 -top-2 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform" />
            <FilePlus className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-base sm:text-lg font-black leading-tight">施術シート<br className="sm:hidden" />登録</span>
          </div>
        </LoadingLink>

        <LoadingLink href="/treatments/new" className="group">
          <div className="h-24 sm:h-32 bg-white border-2 border-[var(--salon-purple)] text-[var(--salon-purple)] rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-md hover:shadow-lg hover:bg-purple-50 hover:-translate-y-1 transition-all active:scale-95 relative overflow-hidden">
            <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-base sm:text-lg font-black leading-tight">新規予約<br className="sm:hidden" />登録</span>
          </div>
        </LoadingLink>

        <Link href="/customers/new" className="group">
          <div className="h-24 sm:h-32 bg-[var(--salon-teal)] text-white rounded-2xl p-4 sm:p-6 flex flex-col justify-between shadow-lg shadow-teal-100 hover:shadow-teal-200 hover:-translate-y-1 transition-all active:scale-95 relative overflow-hidden">
            <UserPlus className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-base sm:text-lg font-black leading-tight">新規顧客<br className="sm:hidden" />登録</span>
          </div>
        </Link>
        <LineJoinDialog />
      </div>

      {/* 今日のスケジュール（モバイル対応カードレイアウト） */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[var(--salon-purple)]" />
          本日の予約スケジュール
        </h2>

        {todayTreatments && todayTreatments.length > 0 ? (
          <div className="grid gap-3">
            {todayTreatments.map((t: any) => (
              <div 
                key={t.id} 
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="flex items-stretch">
                  {/* 時間帯（左側のアクセント） */}
                  <div className="w-20 sm:w-24 bg-gray-50 flex flex-col items-center justify-center border-r border-gray-100 py-4">
                    <span className="text-lg sm:text-xl font-black text-gray-800">
                      {t.visit_time?.substring(0, 5) || "--:--"}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">TIME</span>
                  </div>

                  {/* コンテンツエリア */}
                  <div className="flex-1 px-4 py-3 flex items-center justify-between min-w-0">
                    <div className="flex flex-col gap-1.5 min-w-0">
                      {/* 上段: 名前と来店回数 */}
                      <div className="flex items-center gap-2 overflow-hidden">
                        <h3 className="text-base sm:text-lg font-black text-gray-900 truncate">
                          {t.customers?.name || "登録なし"} 様
                        </h3>
                        <span className="shrink-0 bg-[var(--salon-teal)]/10 text-[var(--salon-teal-dark)] text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                          {t.visit_count}回目
                        </span>
                      </div>
                      
                      {/* 下段: 担当とメニュー */}
                      <div className="flex items-center gap-3 text-[11px] sm:text-xs text-gray-500 font-bold whitespace-nowrap overflow-hidden">
                        <div className="flex items-center gap-1 shrink-0">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>担当: {t.staff?.name || "未定"}</span>
                        </div>
                        { (t.treatment_details?.length > 0 || t.reserved_content) && (
                          <div className="px-1.5 py-0.5 bg-gray-50 rounded border border-gray-100 text-gray-500 truncate">
                            {COURSE_NAMES.includes(t.reserved_content)
                              ? t.reserved_content
                              : (t.treatment_details?.length > 0 
                                  ? t.treatment_details.map((d: any) => d.body_part).join("、")
                                  : t.reserved_content
                                )
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-4">
                      <LoadingLink 
                        href={`/treatments/${t.id}`} 
                        className="inline-flex items-center justify-center bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 text-white w-24 sm:w-28 py-2.5 rounded-lg font-black text-xs sm:text-sm shadow-md active:scale-95 transition-all gap-1"
                      >
                        カルテ入力
                        <ChevronRight className="w-4 h-4" />
                      </LoadingLink>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                <Calendar className="h-8 w-8 text-gray-300" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-400">本日の予約はありません</p>
                <p className="text-sm text-gray-400">登録された予約がここに表示されます</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
