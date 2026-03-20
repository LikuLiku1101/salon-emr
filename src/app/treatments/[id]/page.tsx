import { createClient } from "@/utils/supabase/server";
import TreatmentForm from "@/components/treatment-form";

export default async function TreatmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. 該当のカルテ情報と、紐づく顧客情報、詳細（部位ごと）を取得
  const { data: treatment } = await supabase
    .from("treatments")
    .select(`
      *,
      customers (*),
      contracts (*),
      treatment_details (*)
    `)
    .eq("id", id)
    .single();

  // 1.5. スタッフ一覧を取得（担当者選択用）
  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name")
    .order("name", { ascending: true });

  if (!treatment) {
    return <div className="p-8">カルテが見つかりませんでした。</div>;
  }

  // 2. この顧客の、今回の日付以前の全来店履歴を取得して「回数」を計算する
  const { data: pastTreatments } = await supabase
    .from("treatments")
    .select("id, contract_id, visit_date, status")
    .eq("customer_id", treatment.customer_id)
    .lte("visit_date", treatment.visit_date)
    .neq("status", "キャンセル")
    .order("visit_date", { ascending: true });

  const totalVisitsCount = pastTreatments?.length || 1;

  // 3. 前回の来店日を取得（今回の来店日より前で最新のもの）
  const { data: previousVisit } = await supabase
    .from("treatments")
    .select("id, visit_date")
    .eq("customer_id", treatment.customer_id)
    .lt("visit_date", treatment.visit_date)
    .order("visit_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  let contractVisitCount = null;
  if (treatment.contract_id && pastTreatments) {
    // 同じ契約IDの来店数をカウント
    contractVisitCount = pastTreatments.filter(t => t.contract_id === treatment.contract_id).length;
  }

  // クライアントコンポーネント（スマホ最適化UI）にデータを渡して描画
  return (
    <TreatmentForm 
      treatment={treatment} 
      treatmentDetails={treatment.treatment_details || []}
      staffList={staffList || []}
      visitInfo={{
        totalVisitsCount,
        contractVisitCount,
        contractName: treatment.contracts?.course_name,
        contractInstallments: treatment.contracts?.installments,
        lastVisitDate: previousVisit?.visit_date || null,
        lastVisitId: previousVisit?.id || null
      }}
    />
  );
}
