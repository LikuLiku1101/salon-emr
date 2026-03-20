"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteContract(contractId: string, customerId: string) {
  const supabase = await createClient();

  // 1. この契約に関連付けられている施術記録（treatments）の contract_id を null にリセットする（削除の前に一括更新）
  await supabase
    .from("treatments")
    .update({ contract_id: null })
    .eq("contract_id", contractId);

  // 2. 契約レコード自体を削除
  const { error } = await supabase
    .from("contracts")
    .delete()
    .eq("id", contractId);

  if (error) {
    console.error("Delete Contract Error:", error);
    return { success: false, error: "Failed to delete contract" };
  }

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/treatments");
  return { success: true };
}
