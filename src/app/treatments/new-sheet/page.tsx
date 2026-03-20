import { createClient } from "@/utils/supabase/server";
import SheetRegistrationForm from "@/components/sheet-registration-form";

export default async function NewSheetPage() {
  const supabase = await createClient();

  // 1. 顧客リストを取得
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, name_kana, phone")
    .order("name_kana", { ascending: true });

  return (
    <div className="p-8 bg-zinc-50 min-h-[calc(100vh-64px)]">
      <SheetRegistrationForm customers={customers || []} />
    </div>
  );
}
