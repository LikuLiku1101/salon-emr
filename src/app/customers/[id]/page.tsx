import { createClient } from "@/utils/supabase/server";
import { 
  ArrowLeft, 
  CreditCard, 
  History as HistoryIcon, 
  Plus, 
  User,
  AlertCircle,
  Calendar,
  Smartphone,
  Trash2,
  ChevronRight,
  FileText,
  Clock
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import DeleteCustomerButton from "./delete-customer-button";
import AddTreatmentSheetButton from "./add-treatment-button";
import DeleteContractButton from "./delete-contract-button";
import VisitHistoryList from "./visit-history-list";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. 顧客情報を取得
  const { data: customer } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) {
    return <div className="p-8">お客様情報が見つかりませんでした。</div>;
  }

  // 2. 契約（セット）情報を取得
  const { data: contracts } = await supabase
    .from("contracts")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  // 3. 全施術記録を取得
  const { data: treatments } = await supabase
    .from("treatments")
    .select(`
      id, visit_date, visit_time, visit_count, notes, contract_id,
      payment_status, payment_method, payment_amount, reserved_content,
      staff:staff_id ( name ),
      treatment_details ( body_part )
    `)
    .eq("customer_id", id)
    .order("visit_date", { ascending: false });

  // 4. 未来の予約と過去の履歴を分ける (文字列比較で安定化)
  const todayStr = format(new Date(), "yyyy-MM-dd");
  
  // 未来の予約 (明日以降)
  const futureReservations = (treatments || [])
    .filter(t => t.visit_date > todayStr)
    .sort((a, b) => a.visit_date.localeCompare(b.visit_date));
  
  // 過去の履歴 (今日を含む)
  const pastTreatments = (treatments || [])
    .filter(t => t.visit_date <= todayStr);

  // 5. 各契約ごとの利用回数を計算（未来の予約は含めない）
  const contractUsage = contracts?.map(contract => {
    const usageCount = pastTreatments.filter(t => t.contract_id === contract.id).length || 0;
    const remaining = Math.max(0, (contract.installments || 1) - usageCount);
    return {
      ...contract,
      usageCount,
      remaining,
      isCompleted: usageCount >= (contract.installments || 1)
    };
  }) || [];

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 bg-white min-h-screen pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="flex flex-col gap-2">
            <Link href="/customers" className="inline-flex items-center text-sm font-medium text-[var(--salon-purple)] hover:underline mb-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                顧客一覧へ戻る
            </Link>
            <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{customer.name} 様</h1>
                <div className="flex gap-2">
                    {customer.gender === '女性' && (
                        <Badge variant="outline" className="text-[var(--salon-magenta)] border-[var(--salon-magenta)] bg-[var(--salon-magenta)]/5 font-bold">女性</Badge>
                    )}
                    {customer.gender === '男性' && (
                        <Badge variant="outline" className="text-blue-500 border-blue-200 bg-blue-50 font-bold">男性</Badge>
                    )}
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm font-bold text-gray-500">
                <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 uppercase text-[10px] tracking-widest mr-1">フリガナ</span>
                    {customer.name_kana || "未登録"}
                </div>
                {customer.phone && (
                    <div className="flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        {customer.phone}
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <DeleteCustomerButton customerId={id} customerName={customer.name} className="w-full sm:w-auto order-2 sm:order-1" />
            <Button size="sm" variant="outline" className="h-10 px-4 font-bold border-gray-300 w-full sm:w-auto order-3 sm:order-2">
                <Smartphone className="w-4 h-4 mr-2" />
                LINE連携
            </Button>
            <AddTreatmentSheetButton customerId={id} className="w-full sm:w-auto col-span-2 sm:col-span-1 order-1 sm:order-3" />
        </div>
      </header>

      {/* 今後の予約一覧 */}
      {futureReservations.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--salon-purple)]">
            <Calendar className="h-5 w-5" />
            今後の予約
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {futureReservations.map((res) => (
              <div key={res.id} className="flex items-center justify-between p-4 bg-[var(--salon-purple)]/5 border border-[var(--salon-purple)]/20 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center justify-center bg-white border border-[var(--salon-purple)]/20 rounded-lg px-3 py-1 min-w-[60px]">
                    <span className="text-[10px] font-bold text-gray-400">{format(new Date(res.visit_date), "yyyy")}</span>
                    <span className="text-lg font-black text-[var(--salon-purple)]">{format(new Date(res.visit_date), "M/d")}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {res.visit_time ? res.visit_time.substring(0, 5) : "時間未定"}
                    </div>
                    <div className="text-xs font-bold text-gray-500 bg-white/50 px-2 py-0.5 rounded border border-gray-100">
                      {res.reserved_content || "施術内容未定"}
                    </div>
                  </div>
                </div>
                <Link href={`/treatments/${res.id}`}>
                  <Button variant="ghost" size="sm" className="font-bold text-[var(--salon-purple)] hover:bg-[var(--salon-purple)]/10">
                    詳細
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 契約・残り回数セクション */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
          <CreditCard className="h-5 w-5 text-[var(--salon-purple)]" />
          契約・残り回数
        </h2>
        
        {contractUsage.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contractUsage.map((c) => (
              <Card key={c.id} className={cn(
                  "border-2 overflow-hidden",
                  c.isCompleted ? "bg-gray-50 border-gray-200 opacity-80" : "bg-white border-[var(--salon-teal)]/20 shadow-sm"
              )}>
                <CardHeader className="pb-3 border-b bg-white">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-black text-gray-800">{c.course_name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <DeleteContractButton contractId={c.id} customerId={id} courseName={c.course_name} />
                      <Badge variant={c.isCompleted ? "secondary" : "default"} className={cn(
                          "font-bold",
                          !c.isCompleted && "bg-[var(--salon-teal-dark)]"
                      )}>
                          {c.isCompleted ? "完了" : "有効"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-end gap-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">消化回数</span>
                      <div className="flex items-end gap-1">
                        <span className={cn(
                          "text-4xl font-black",
                          c.isCompleted ? "text-gray-400" : "text-gray-900"
                        )}>{c.usageCount}</span>
                        <span className="text-gray-400 font-bold mb-1">/ {c.installments} 回完了</span>
                      </div>
                    </div>
                    <div className="flex-1 text-right mb-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">残り</div>
                        <span className={cn(
                            "text-2xl font-black",
                            c.remaining > 0 ? "text-[var(--salon-purple)]" : "text-gray-400"
                        )}>{c.remaining}</span>
                        <span className="text-sm font-bold text-gray-500"> 回</span>
                    </div>
                  </div>
                  
                  {/* 回数表示バー */}
                  <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    {Array.from({ length: c.installments }).map((_, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex-1 border-r border-white last:border-0",
                          i < c.usageCount ? "bg-[var(--salon-teal)]" : "bg-gray-100"
                        )} 
                      />
                    ))}
                  </div>

                  <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>契約日: {format(new Date(c.created_at), "yyyy/MM/dd")}</span>
                    <span>支払: {c.payment_type}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border-2 border-dashed p-8 text-center">
            <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 font-bold">有効な契約情報がありません</p>
          </div>
        )}
      </section>

      {/* 施術履歴リスト */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <HistoryIcon className="h-5 w-5 text-[var(--salon-purple)]" />
                過去の来店履歴
            </h2>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                合計 {pastTreatments.length} 回の来店
            </span>
        </div>

        <VisitHistoryList 
          treatments={pastTreatments} 
          customerId={id} 
        />
      </section>
    </div>
  );
}
