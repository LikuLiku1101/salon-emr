"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createNewCustomerAndTreatment(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const name_kana = formData.get("name_kana") as string;
  const gender = formData.get("gender") as string;
  const phone = formData.get("phone") as string;

  if (!name) throw new Error("Name is required");

  // 1. 新規顧客を作成
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert([{
      name,
      name_kana,
      gender,
      phone: phone || null
    }])
    .select()
    .single();

  if (customerError || !customer) {
    console.error("Customer creation error:", customerError);
    throw new Error(`Failed to create customer: ${customerError?.message || 'Unknown error'}`);
  }

  // 2. そのまま本日の施術シートを作成
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0];

  const { data: treatment, error: treatmentError } = await supabase
    .from("treatments")
    .insert([{
      customer_id: customer.id,
      visit_date: today,
      visit_time: currentTime,
      visit_count: 1, // 新規なので初回来店
      status: "通常"
    }])
    .select()
    .single();

  if (treatmentError || !treatment) {
    console.error("Treatment creation error:", treatmentError);
    throw new Error(`Failed to create treatment: ${treatmentError?.message || 'Unknown error'}`);
  }

  revalidatePath("/treatments");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customer.id}`);
  
  // 3. 入力画面にリダイレクト
  redirect(`/treatments/${treatment.id}`);
}
