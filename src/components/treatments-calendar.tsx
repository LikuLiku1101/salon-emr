"use client";

import { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import * as JapaneseHolidays from "japanese-holidays";
import { cn } from "@/lib/utils";

// 日本語のローカライズ設定
const locales = {
  "ja": ja,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function TreatmentsCalendar({ treatments }: { treatments: any[] }) {
  const router = useRouter();
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  // Supabaseのデータをカレンダー用のイベント形式（開始・終了時間など）に変換
  const events = useMemo(() => {
    if (!treatments) return [];
    
    const now = new Date();

    return treatments.map((t) => {
      const visitDateStr = t.visit_date;
      const visitTimeStr = t.visit_time || "10:00:00"; // 時間未定の場合は仮に10時とする
      
      const start = new Date(`${visitDateStr}T${visitTimeStr}`);
      // カルテなので一旦1時間の枠として表示
      const end = new Date(start.getTime() + 60 * 60 * 1000); 

      // 施術内容の構築
      let displayContent = "";
      const isPast = start < now;
      const courseName = t.contracts?.course_name;
      const reserved = t.reserved_content;

      if (courseName) {
        // セット（契約）がある場合はそれを優先表示
        displayContent = courseName;
      } else if (reserved) {
        // 予約・記入時の内容（全身脱毛など）があれば次点に優先
        displayContent = reserved;
      } else if (isPast) {
        // 過去の予定で詳細データがあれば表示
        if (t.treatment_details && t.treatment_details.length > 0) {
          const parts = t.treatment_details.map((d: any) => d.body_part);
          const fullContent = parts.join("、");
          displayContent = fullContent.length > 8 ? fullContent.substring(0, 8) + "..." : fullContent;
        } else {
          displayContent = `(${t.visit_count}回目)`;
        }
      } else {
        // 未来の予定かつ内容がない場合
        displayContent = `(${t.visit_count}回目)`;
      }

      return {
        id: t.id,
        title: `${t.customers?.name || "登録なし"}\n[${displayContent}]`,
        start,
        end,
        resource: {
          ...t,
          isPast,
          status: t.status
        },
        allDay: !t.visit_time, // 時間がない場合は終日扱い
      };
    });
  }, [treatments]);

  // カレンダーのイベントをクリックしたときの処理
  const handleSelectEvent = (event: any) => {
    router.push(`/treatments/${event.id}`);
  };

  // スタッフごとのカラー設定（プレミアムな配色）
  const STAFF_COLORS: Record<string, { bg: string, text: string, border: string }> = {
    // 大谷: Blue
    "280b61fe-3b23-44ab-91d0-08916f07c88f": { 
      bg: "#e0f2fe", // sky-100
      text: "#0369a1", // sky-700
      border: "#0ea5e9" // sky-500
    },
    // 須原: Teal
    "377e02bb-7aea-4eb7-9328-ee9d57ec85e1": { 
      bg: "#f0fdf4", // green-50
      text: "#15803d", // green-700
      border: "#22c55e" // green-500
    },
    // その他: Purple
    "default": { 
      bg: "#f5f3ff", // purple-50
      text: "#7e22ce", // purple-700
      border: "#a855f7" // purple-500
    }
  };

  // カレンダーのイベントを見た目のカスタマイズ
  const eventStyleGetter = (event: any) => {
    const staffId = event.resource?.staff?.id || "default";
    const colors = STAFF_COLORS[staffId] || STAFF_COLORS.default;
    const isPast = event.resource?.isPast;
    const isCancelled = event.resource?.status === 'キャンセル';
    
    // キャンセル時の赤色設定
    const cancelStyles = {
      bg: "#fef2f2", // red-50
      text: "#b91c1c", // red-700
      border: "#ef4444" // red-500
    };
    
    const finalColors = isCancelled ? cancelStyles : colors;

    return {
      style: {
        backgroundColor: finalColors.bg,
        color: finalColors.text,
        borderRadius: "6px",
        opacity: isPast ? 0.7 : 1,
        border: "none",
        display: "block",
        fontSize: "0.65rem",
        fontWeight: "900",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        overflow: "hidden",
      }
    };
  };

  // 1. 土日・祝日の色分け
  const dayPropGetter = (date: Date) => {
    const day = date.getDay();
    const holiday = JapaneseHolidays.isHoliday(date);
    
    if (holiday || day === 0) return { className: "bg-red-50/40" }; // 祝日または日曜日
    if (day === 6) return { className: "bg-blue-50/40" }; // 土曜日
    return {};
  };

  // カスタム日付ヘッダー（日付の数字部分）
  const CustomDateHeader = ({ label, date }: { label: string, date: Date }) => {
    const holiday = JapaneseHolidays.isHoliday(date);
    const day = date.getDay();
    const isRedDay = !!holiday || day === 0;
    const isBlueDay = day === 6;

    return (
      <div className="flex flex-col items-end pr-1 pt-1">
        <button 
          type="button"
          className={cn(
            "text-[11px] font-bold hover:underline",
            isRedDay ? "text-red-500" : isBlueDay ? "text-blue-500" : "text-gray-500"
          )}
        >
          {label}
        </button>
        {holiday && (
          <span className="text-[8px] text-red-400 font-bold leading-none mt-0.5 scale-90 origin-right truncate max-w-full">
            {holiday}
          </span>
        )}
      </div>
    );
  };

  // カスタムイベントコンポーネント
  const CustomEvent = ({ event }: { event: any }) => {
    const title = event.title || "";
    const [name, content] = title.split('\n');
    
    // 名字の取得（スペースで区切られている場合）
    const lastName = name.split(/[ 　]/)[0];

    return (
      <div className="rbc-event-custom-content">
        <div className="event-name-container">{lastName}</div>
        {content && <div className="event-details-container">{content}</div>}
      </div>
    );
  };

  // 2. カスタムツールバー（横並び + 凡例）
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToToday = () => toolbar.onNavigate('TODAY');

    return (
      <div className="flex flex-col gap-3 mb-4 px-1">
        {/* メインアクション行 */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
          {/* ナビゲーション */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg border shrink-0">
            <button onClick={goToBack} className="px-3 py-1 text-xs font-bold hover:bg-white rounded-md transition-all active:scale-95">前</button>
            <button onClick={goToToday} className="px-3 py-1 text-xs font-bold hover:bg-white rounded-md transition-all active:scale-95 border-x">今日</button>
            <button onClick={goToNext} className="px-3 py-1 text-xs font-bold hover:bg-white rounded-md transition-all active:scale-95">次</button>
          </div>

          {/* 日付表示 */}
          <div className="text-sm font-black text-gray-800 tracking-tight whitespace-nowrap">
            {toolbar.label}
          </div>

          {/* ビュー切り替え */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg border shrink-0">
            <button onClick={() => toolbar.onView('month')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${toolbar.view === 'month' ? 'bg-[var(--salon-purple)] text-white shadow-sm' : 'hover:bg-white text-gray-600'}`}>月</button>
            <button onClick={() => toolbar.onView('week')} className={`px-2 py-1 text-xs font-bold rounded-md transition-all border-x ${toolbar.view === 'week' ? 'bg-[var(--salon-purple)] text-white shadow-sm' : 'hover:bg-white text-gray-600'}`}>週</button>
            <button onClick={() => toolbar.onView('day')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${toolbar.view === 'day' ? 'bg-[var(--salon-purple)] text-white shadow-sm' : 'hover:bg-white text-gray-600'}`}>日</button>
          </div>
        </div>

        {/* 凡例 (Legend) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-green-200"></div>
            <span className="text-[10px] font-black text-gray-500">須原</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-sky-500 border-2 border-sky-200"></div>
            <span className="text-[10px] font-black text-gray-500">大谷</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-200"></div>
            <span className="text-[10px] font-black text-gray-500">キャンセル</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-purple-500 border-2 border-purple-200"></div>
            <span className="text-[10px] font-black text-gray-500">その他</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[750px] w-full bg-white dark:bg-zinc-950 p-1 rounded-xl border shadow-sm flex flex-col">
      <style jsx global>{`
        .rbc-month-view { border-color: var(--color-zinc-100); border-radius: 8px; overflow: hidden; border: none !important; }
        .rbc-month-row { border-top: 1px solid #f1f1f1 !important; }
        .rbc-day-bg { border-left: 1px solid #f1f1f1 !important; }
        .rbc-header { padding: 4px; font-weight: 800; font-size: 0.7rem; border-bottom: 1px solid #f1f1f1 !important; border-left: 1px solid #f1f1f1 !important; }
        .rbc-header:first-child { border-left: none !important; }
        
        /* 土日のヘッダー色 */
        .rbc-header:nth-child(1) { color: #ef4444; } /* 日 */
        .rbc-header:nth-child(7) { color: #3b82f6; } /* 土 */
        
        .rbc-off-range-bg { background-color: #fafafa !important; }
        .rbc-today { background-color: rgba(149, 21, 179, 0.03) !important; }
        .rbc-event { min-height: 24px; margin-bottom: 2px; border-radius: 6px !important; }
        .rbc-event-label { display: none; }
        .rbc-event-content { padding: 0 !important; height: 100%; }
        .rbc-date-cell { padding: 0 !important; }
        
        /* モバイル用の横書き・コンパクト設定 */
        @media (max-width: 639px) {
          .rbc-event { 
            min-height: 18px;
            margin: 0.5px 0 !important;
            padding: 0 !important;
          }
          .rbc-event-custom-content {
            display: flex;
            align-items: center;
            gap: 2px;
            padding: 0px 4px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            width: 100%;
          }
          .event-name-container {
            font-size: 0.65rem;
            font-weight: 900;
            flex-shrink: 0;
          }
          .event-details-container {
            font-size: 0.55rem;
            opacity: 0.8;
            font-weight: 500;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        /* デスクトップ用 */
        @media (min-width: 640px) {
          .rbc-event {
            min-height: 24px;
          }
          .rbc-event-custom-content {
            display: flex;
            flex-direction: column;
            padding: 2px 4px;
            overflow: hidden;
          }
          .event-name-container {
            font-size: 0.7rem;
            font-weight: 800;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .event-details-container {
            font-size: 0.6rem;
            opacity: 0.7;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
        
        .rbc-toolbar { display: none; } /* デフォルトのツールバーを隠す */
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ flex: 1 }}
        views={["month", "week", "day"]}
        view={view}
        date={date}
        onView={(v) => setView(v)}
        onNavigate={(d) => setDate(d)}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        dayPropGetter={dayPropGetter}
        components={{
          toolbar: CustomToolbar,
          event: CustomEvent,
          month: {
            dateHeader: CustomDateHeader
          }
        }}
        culture="ja"
        messages={{
          next: "次",
          previous: "前",
          today: "今日",
          month: "月",
          week: "週",
          day: "日",
          agenda: "一覧",
          noEventsInRange: "なし",
          showMore: (count) => `+${count}`
        }}
      />
    </div>
  );
}


