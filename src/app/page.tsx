import { createClient } from "@/utils/supabase/server";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Calendar, Users, Ban } from "lucide-react";

export default async function Dashboard() {
  const supabase = await createClient();

  // 今日の日付を取得 (YYYY-MM-DD形式)
  const today = format(new Date(), "yyyy-MM-dd");

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
      <header className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base font-bold" suppressHydrationWarning>
            今日（{format(new Date(), "yyyy年MM月dd日(E)", { locale: ja })}）の営業状況
          </p>
        </div>
      </header>



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
                  <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{t.customers?.name || "登録なし"} 様</h3>
                        <span className="bg-[var(--salon-teal)]/10 text-[var(--salon-teal-dark)] text-xs font-bold px-2 py-0.5 rounded-full">
                          {t.visit_count}回目
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>担当: {t.staff?.name || "未定"}</span>
                        </div>
                        { (t.treatment_details?.length > 0 || t.reserved_content) && (
                          <div className="px-2 py-0.5 bg-gray-100 rounded text-[11px] border border-gray-200 text-gray-600">
                            {t.treatment_details?.length > 0 
                              ? t.treatment_details.map((d: any) => d.body_part).join("、")
                              : t.reserved_content
                            }
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <a 
                        href={`/treatments/${t.id}`} 
                        className="inline-flex items-center gap-1.5 bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm active:scale-95 transition-all"
                      >
                        カルテ入力
                        <span className="text-lg leading-none">→</span>
                      </a>
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
