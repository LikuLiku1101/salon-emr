import { createClient } from "@/utils/supabase/server";
import TreatmentForm from "@/components/treatment-form";

export default async function TreatmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. 該当のカルテ情報とスタッフ一覧を並列で取得（依存関係なし）
  const [
    { data: treatment },
    { data: staffList }
  ] = await Promise.all([
    supabase.from("treatments").select(`*, customers (*), contracts (*), treatment_details (*)`).eq("id", id).single(),
    supabase.from("staff").select("id, name").order("name", { ascending: true })
  ]);

  if (!treatment) {
    return <div className="p-8">カルテが見つかりませんでした。</div>;
  }

  // 2. カルテの情報に依存するデータをすべて並列で取得（過去の履歴、前回の来店日、同じ日のカルテ、前後のカルテ）
  const [
    { data: pastTreatments },
    { data: previousVisit },
    { data: sameDayTreatments },
    { data: prevDayTreatments },
    { data: nextDayTreatments }
  ] = await Promise.all([
    supabase.from("treatments").select("id, contract_id, visit_date, status").eq("customer_id", treatment.customer_id).lte("visit_date", treatment.visit_date).neq("status", "キャンセル").order("visit_date", { ascending: true }),
    supabase.from("treatments").select("id, visit_date").eq("customer_id", treatment.customer_id).lt("visit_date", treatment.visit_date).order("visit_date", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("treatments").select("id, visit_time, created_at").eq("visit_date", treatment.visit_date).order("visit_time", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("treatments").select("id").lt("visit_date", treatment.visit_date).order("visit_date", { ascending: false }).order("visit_time", { ascending: false }).limit(1),
    supabase.from("treatments").select("id").gt("visit_date", treatment.visit_date).order("visit_date", { ascending: true }).order("visit_time", { ascending: true }).limit(1)
  ]);

  const totalVisitsCount = pastTreatments?.length || 1;
  let contractVisitCount = null;
  if (treatment.contract_id && pastTreatments) {
    contractVisitCount = pastTreatments.filter(t => t.contract_id === treatment.contract_id).length;
  }

  // 前後の施術記録（ページネーション）のIDを計算
  let prevId = null;
  let nextId = null;

  if (sameDayTreatments) {
    const currentIndex = sameDayTreatments.findIndex(t => t.id === treatment.id);
    if (currentIndex > 0) prevId = sameDayTreatments[currentIndex - 1].id;
    if (currentIndex < sameDayTreatments.length - 1) nextId = sameDayTreatments[currentIndex + 1].id;
  }

  if (!prevId && prevDayTreatments && prevDayTreatments.length > 0) {
    prevId = prevDayTreatments[0].id;
  }

  if (!nextId && nextDayTreatments && nextDayTreatments.length > 0) {
    nextId = nextDayTreatments[0].id;
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
      pagination={{ prevId, nextId }}
    />
  );
}
