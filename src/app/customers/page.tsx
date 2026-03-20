import { createClient } from "@/utils/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CustomerList from "@/components/customer-list";

export default async function CustomersPage() {
  const supabase = await createClient();

  // 顧客一覧と、紐づく契約情報・施術履歴を取得
  const { data: customers } = await supabase
    .from("customers")
    .select(`
      id, name, name_kana,
      contracts ( id, course_name, status, installments, created_at ),
      treatments ( contract_id, status )
    `)
    .order("name_kana", { ascending: true });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-center justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--salon-purple)]">顧客・契約管理</h1>
          <p className="text-muted-foreground mt-2 font-bold">
            登録されているお客様と契約の一覧です。
          </p>
        </div>
        <Button className="bg-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/90 shadow-lg text-white font-black h-12 px-6 rounded-xl">
          <Link href="/customers/new" className="flex items-center gap-2 text-inherit">
            <Plus className="h-5 w-5" />
            新規顧客登録
          </Link>
        </Button>
      </header>

      <CustomerList customers={customers as any || []} />
    </div>
  );
}
