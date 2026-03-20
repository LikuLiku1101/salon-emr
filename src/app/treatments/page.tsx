import { createClient } from "@/utils/supabase/server";
import { Plus, FilePlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import TreatmentsCalendar from "@/components/treatments-calendar";

export default async function TreatmentsPage() {
  const supabase = await createClient();

  // 予約（カルテ）一覧を全て取得
  const { data: treatments } = await supabase
    .from("treatments")
    .select(
      `
      id, visit_date, visit_time, visit_count, next_reservation_date, reserved_content, status,
      customers ( name, name_kana ),
      staff ( id, name ),
      contracts ( course_name ),
      treatment_details ( body_part )
    `
    )
    .order("visit_date", { ascending: false });

  return (
    <div className="p-2 max-w-7xl mx-auto">
      <div className="flex justify-end items-center gap-2 mb-2 pt-2 pr-2">
        <Link href="/treatments/new-sheet">
          <Button size="sm" variant="outline" className="border-[var(--salon-purple)] text-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/5 font-black h-9 px-4 rounded-lg shadow-sm">
            <FilePlus className="h-4 w-4 mr-1.5" />
            施術シート登録
          </Button>
        </Link>
        <Link href="/treatments/new">
          <Button size="sm" className="bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 text-white font-black h-9 px-4 rounded-lg shadow-md border-none">
            <Plus className="h-4 w-4 mr-1.5" />
            新規予約登録
          </Button>
        </Link>
      </div>

      {/* カレンダー表示 */}
      <TreatmentsCalendar treatments={treatments || []} />
    </div>
  );
}
