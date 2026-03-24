import { createClient } from "@/utils/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LoadingLink } from "@/components/loading-link";
import CustomerList from "@/components/customer-list";

export default async function CustomersPage() {
  const supabase = await createClient();

  // 顧客一覧と、紐づく契約情報・施術履歴を取得
  const { data: customers } = await supabase
    .from("customers")
    .select(`
      id, name, name_kana, line_user_id,
      contracts ( id, course_name, status, installments, created_at ),
      treatments ( contract_id, status )
    `)
    .order("name_kana", { ascending: true });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--salon-purple)]">顧客・契約管理</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 font-bold text-sm sm:text-base">
            登録されているお客様と契約の一覧です。
          </p>
        </div>
        <LoadingLink href="/customers/new">
          <Button className="bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 shadow-lg text-white font-black h-12 px-6 rounded-xl w-full sm:w-auto shrink-0 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            新規顧客登録
          </Button>
        </LoadingLink>
      </header>

      <CustomerList customers={customers as any || []} />
    </div>
  );
}
