"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteTreatment(treatmentId: string, customerId: string) {
  const supabase = await createClient();

  // 1. treatment_details（子テーブル）の削除
  const { error: detailsError } = await supabase
    .from("treatment_details")
    .delete()
    .eq("treatment_id", treatmentId);

  if (detailsError) {
    console.error("Delete Treatment Details Error:", detailsError);
    return { success: false, error: "施術詳細の削除に失敗しました" };
  }

  // 2. treatments（親テーブル）の削除
  const { error: treatmentError } = await supabase
    .from("treatments")
    .delete()
    .eq("id", treatmentId);

  if (treatmentError) {
    console.error("Delete Treatment Error:", treatmentError);
    return { success: false, error: "施術記録の削除に失敗しました" };
  }

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/treatments");
  return { success: true };
}

export async function deleteCustomer(customerId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) {
    console.error("Delete Customer Error:", error);
    return { success: false, error: "お客様情報の削除に失敗しました" };
  }

  revalidatePath("/customers");
  return { success: true };
}
