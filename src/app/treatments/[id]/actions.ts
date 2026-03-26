"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export async function saveTreatmentDetails(
  treatmentId: string, 
  formData: FormData,
  details: { body_part: string, machine_type: string, power_level: string }[]
) {
  const supabase = await createClient();

  // 0. 現在のレコード情報を取得
  const { data: current, error: fetchError } = await supabase
    .from("treatments")
    .select("*")
    .eq("id", treatmentId)
    .single();

  if (fetchError || !current) {
    console.error("Fetch Error:", fetchError);
    return { success: false, error: "Treatment not found" };
  }

  const notes = formData.get("notes") as string;
  const next_reservation_date = formData.get("next_reservation_date") as string;
  const next_reservation_time = formData.get("next_reservation_time") as string;
  
  const payment_status = formData.get("payment_status") as string;
  const payment_method = formData.get("payment_method") as string;
  const payment_amountStr = formData.get("payment_amount") as string;
  const handpiece_ipl_countStr = formData.get("handpiece_ipl_count") as string;
  const handpiece_shr_countStr = formData.get("handpiece_shr_count") as string;
  const staff_id = formData.get("staff_id") as string;
  const visit_date = formData.get("visit_date") as string;
  const is_next_reservation_line = formData.get("is_next_reservation_line") === "on";
  const status = formData.get("status") as string;
  const cancellation_feeStr = formData.get("cancellation_fee") as string;
  const new_selected_set = formData.get("new_selected_set") as string;
  const new_set_installments = formData.get("new_set_installments") as string;
  const image_paths_str = formData.get("image_paths") as string;
  const reserved_content = formData.get("reserved_content") as string;

  let image_paths: string[] = [];
  try {
    image_paths = image_paths_str ? JSON.parse(image_paths_str) : [];
  } catch (e) {
    console.error("Failed to parse image_paths:", e);
  }
  
  // 1. treatmentsテーブルの更新
  const updateData: Record<string, any> = {};
  if (notes !== null) updateData.notes = notes;
  if (reserved_content !== null) updateData.reserved_content = reserved_content;
  if (visit_date) updateData.visit_date = visit_date;
  if (next_reservation_date) updateData.next_reservation_date = next_reservation_date;
  if (next_reservation_time) updateData.next_reservation_time = next_reservation_time;
  
  updateData.is_next_reservation_line = is_next_reservation_line;
  if (payment_status) updateData.payment_status = payment_status;
  if (payment_method) updateData.payment_method = payment_method;
  
  if (payment_amountStr !== null) {
    updateData.payment_amount = payment_amountStr === "" ? null : parseInt(payment_amountStr, 10);
  }
  
  if (status) updateData.status = status;
  if (cancellation_feeStr) updateData.cancellation_fee = parseInt(cancellation_feeStr, 10);
  if (handpiece_ipl_countStr) updateData.handpiece_ipl_count = parseInt(handpiece_ipl_countStr, 10);
  if (handpiece_shr_countStr) updateData.handpiece_shr_count = parseInt(handpiece_shr_countStr, 10);
  updateData.image_paths = image_paths;
  if (staff_id) updateData.staff_id = staff_id;
  else updateData.staff_id = null;
  
  // 契約の作成または更新
  if (payment_status === '本日一括支払い' && new_selected_set) {
    if (current.contract_id) {
       // 既存の契約を更新（二重作成防止）
       await supabase.from("contracts").update({
         course_name: new_selected_set,
         installments: parseInt(new_set_installments, 10) || 1,
         total_amount: parseInt(payment_amountStr, 10) || 0,
         payment_type: payment_method || '未定'
       }).eq("id", current.contract_id);
    } else {
       // 新規契約を作成（契約日は来店日に合わせる）
       const { data: newContract, error: contractError } = await supabase
         .from("contracts")
         .insert({
           customer_id: current.customer_id,
           course_name: new_selected_set,
           total_amount: parseInt(payment_amountStr, 10) || 0,
           installments: parseInt(new_set_installments, 10) || 1,
           payment_type: payment_method || '未定',
           created_at: visit_date || current.visit_date // 来店日を契約日とする
         })
         .select().single();
       if (!contractError && newContract) updateData.contract_id = newContract.id;
    }
  } else if (payment_status === '一括支払い済み' && !current.contract_id) {
    // 最新の契約に紐付ける
    const { data: latestContract } = await supabase
      .from("contracts").select("id").eq("customer_id", current.customer_id).order("created_at", { ascending: false }).limit(1).single();
    if (latestContract) updateData.contract_id = latestContract.id;
  }

  const visit_time = formData.get("visit_time") as string;
  if (visit_time) updateData.visit_time = visit_time;

  const { error: treatmentError } = await supabase.from("treatments").update(updateData).eq("id", treatmentId);
  if (treatmentError) return { success: false, error: "Failed to update treatment" };

  // 2. treatment_detailsの更新
  await supabase.from("treatment_details").delete().eq("treatment_id", treatmentId);
  if (details.length > 0) {
    const insertData = details.map(d => ({
      treatment_id: treatmentId,
      body_part: d.body_part,
      machine_type: d.machine_type as 'IPL' | 'SHR',
      power_level: d.power_level
    }));
    await supabase.from("treatment_details").insert(insertData);
  }

  // 3. 次回予約日の自動作成
  // ガード追加: 次回予約日が「現在の来店日」と同じ場合は作成しない（二重作成や誤作成を完全に防ぐ）
  if (next_reservation_date && next_reservation_date !== (visit_date || current.visit_date)) {
    // 同じ日に既にレコードがあるかチェック
    const { data: existing } = await supabase
      .from("treatments")
      .select("id")
      .eq("customer_id", current.customer_id)
      .eq("visit_date", next_reservation_date)
      .maybeSingle();

    if (!existing) {
      const nextVisitCount = (current.visit_count || 1) + 1;
      const { data: nextTreatment } = await supabase.from("treatments").insert({
        customer_id: current.customer_id,
        visit_date: next_reservation_date,
        visit_time: next_reservation_time || null,
        visit_count: nextVisitCount,
        reserved_content: reserved_content || current.reserved_content,
        contract_id: updateData.contract_id || current.contract_id,
        status: "通常"
      }).select().single();

      // LINE自動送信（次回予約が作成された場合）
      try {
        const { data: customer } = await supabase
          .from("customers")
          .select("name, line_user_id")
          .eq("id", current.customer_id)
          .single();

        if (customer?.line_user_id && nextTreatment) {
          const { sendLineMessage } = await import("@/lib/line");
          
          const nextDateObj = new Date(next_reservation_date);
          const nextDateStr = format(nextDateObj, "yyyy年M月d日");
          const nextTimeStr = next_reservation_time ? next_reservation_time.substring(0, 5).replace(":", "時") + "分スタート" : "時間未定";

          const nextMessage = `${customer.name}様、本日はご来店ありがとうございました！✨\n\n次回のご予約を以下の通り承っております：\n日時：${nextDateStr} ${nextTimeStr}\n\nまたのお越しを心よりお待ちしております。`;
          await sendLineMessage(customer.line_user_id, nextMessage);
          
          // 次回予約に対しても通知済みフラグを付与
          await supabase.from("treatments").update({ line_notified: true }).eq("id", nextTreatment.id);
        }
      } catch (err) {
        console.error("Failed to send automatic reservation LINE message:", err);
      }
      
      revalidatePath(`/customers/${current.customer_id}`);
    }
  }

  revalidatePath(`/treatments/${treatmentId}`);
  revalidatePath("/treatments");
  return { success: true };
}

export async function sendTreatmentLineMessage(treatmentId: string) {
  const supabase = await createClient();
  const { data: treatment, error } = await supabase
    .from("treatments")
    .select(`
      *,
      customers ( name, line_user_id )
    `)
    .eq("id", treatmentId)
    .single();

  if (error || !treatment) return { success: false, error: "カルテが見つかりませんでした" };
  if (!treatment.customers?.line_user_id) return { success: false, error: "LINE IDが登録されていません" };

  const customerName = treatment.customers.name;
  const nextDate = treatment.next_reservation_date;
  
  let message = `${customerName}様、本日はご来店ありがとうございました！✨\n\n`;
  if (nextDate) {
    const nextDateObj = new Date(nextDate);
    const nextDateStr = format(nextDateObj, "yyyy年M月d日");
    const nextTimeStr = treatment.next_reservation_time ? treatment.next_reservation_time.substring(0, 5).replace(":", "時") + "分スタート" : "時間未定";
    message += `次回のご予約は ${nextDateStr} ${nextTimeStr} に承っております。お気をつけてお越しくださいませ。`;
  } else {
    message += `またのご来店をスタッフ一同、心よりお待ちしております。`;
  }

  try {
    const { sendLineMessage } = await import("@/lib/line");
    await sendLineMessage(treatment.customers.line_user_id, message);
    
    // 通知済みフラグを更新
    await supabase
      .from("treatments")
      .update({ line_notified: true })
      .eq("id", treatmentId);

    revalidatePath(`/treatments/${treatmentId}`);
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: "LINE送信に失敗しました" };
  }
}
