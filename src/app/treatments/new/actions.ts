"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

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

  // LINE自動送信
  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("name, line_user_id")
      .eq("id", customer_id)
      .single();

    if (customer?.line_user_id) {
      const { sendLineMessage } = await import("@/lib/line");
      const dateObj = new Date(visit_date);
      const dateStr = format(dateObj, "M月d日");
      const timeStr = visit_time ? visit_time.substring(0, 5).replace(":", "時") + "分" : "時間未定";

      let message = "";
      if (visit_count === 1) {
        // 初回予約
        message = `それでは下記の通りご予約を確定させていただきます。\n\n${dateStr} ${timeStr}スタート\n内容：${reserved_content || "未定"}\n\n24時間以内の剃毛と、こちらをご一読頂けますようお願い申し上げます🙇‍♀️\n\nhttps://menzu-datsumou.com/rule/\n\n📍サロン住所\n〒157-0072\n東京都世田谷区祖師谷3-36-28\nサン-ルミエール101\n\n①祖師ヶ谷大蔵駅の改札を出て右に曲がり商店街を北に向かいます。\n②商店街を真っすぐ進み、左手にサンドラッグを超えた1階に[生鮮大関屋 祖師谷店]が入るマンションが当サロンです。\n③部屋番号は101号室です。お間違いの無いようにお気を付けください。`;
      } else {
        // 2回目以降
        message = `【ご予約確定のご連絡】\n${customer.name}様、ご予約を承りました！✨\n\n日時：${dateStr} ${timeStr}スタート\n内容：${reserved_content || "未定"}\n\n当日お会いできるのを楽しみにしております。`;
      }

      await sendLineMessage(customer.line_user_id, message);
      
      // 送信済みフラグを更新
      await supabase.from("treatments").update({ line_notified: true }).eq("id", treatment.id);
    }
  } catch (err) {
    console.error("Failed to send automatic LINE message:", err);
    // 自動送信の失敗は、予約自体の成功を妨げないようにエラーを握り潰すかログのみにする
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
