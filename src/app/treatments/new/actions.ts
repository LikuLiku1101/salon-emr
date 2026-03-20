"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createReservation(formData: FormData) {
  const supabase = await createClient();

  const is_new_customer = formData.get("is_new_customer") === "true";
  let customer_id = formData.get("customer_id") as string;
  const staff_id = formData.get("staff_id") as string;
  const visit_date = formData.get("visit_date") as string;
  const visit_time = formData.get("visit_time") as string;
  const reserved_content = formData.get("reserved_content") as string;
  const notes = formData.get("notes") as string;

  if (is_new_customer) {
    const new_name = formData.get("new_customer_name") as string;
    const new_kana = formData.get("new_customer_kana") as string;
    const new_phone = formData.get("new_customer_phone") as string;

    if (!new_name) throw new Error("Customer name is required");

    // 1. 新規顧客を作成
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert([{ 
        name: new_name, 
        name_kana: new_kana,
        phone: new_phone
      }])
      .select()
      .single();

    if (customerError) throw new Error("Failed to create customer");
    customer_id = newCustomer.id;
  }

  if (!customer_id || !visit_date) {
    throw new Error("Customer and Date are required");
  }

  // 来店回数の計算（顧客の過去の履歴数 + 1）
  const { count: pastCount } = await supabase
    .from("treatments")
    .select("id", { count: "exact" })
    .eq("customer_id", customer_id)
    .lte("visit_date", visit_date)
    .neq("status", "キャンセル");

  const visit_count = (pastCount || 0) + 1;

  const { data: treatment, error } = await supabase
    .from("treatments")
    .insert([{
      customer_id,
      staff_id: staff_id || null,
      visit_date,
      visit_time: visit_time || null,
      visit_count,
      reserved_content,
      notes
    }])
    .select()
    .single();

  if (error) {
    console.error("Failed to create reservation:", error);
    throw new Error("Failed to create reservation");
  }

  revalidatePath("/treatments");
  redirect("/treatments");
}

export async function createDetailedTreatment(customerId: string) {
  const supabase = await createClient();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0];

  // 来店回数の計算
  const { count: pastCount } = await supabase
    .from("treatments")
    .select("id", { count: "exact" })
    .eq("customer_id", customerId)
    .neq("status", "キャンセル");

  const visit_count = (pastCount || 0) + 1;

  const { data: treatment, error } = await supabase
    .from("treatments")
    .insert([{
      customer_id: customerId,
      visit_date: today,
      visit_time: currentTime,
      visit_count,
      status: "通常"
    }])
    .select()
    .single();

  if (error) {
    console.error("Failed to create detailed treatment:", error);
    throw new Error("Failed to create detailed treatment");
  }

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/treatments");
  redirect(`/treatments/${treatment.id}`);
}
