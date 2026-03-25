import { createClient } from "@/utils/supabase/server";
import ReservationForm from "@/components/reservation-form";

export default async function NewReservationPage({
  searchParams,
}: {
  searchParams: Promise<{ customer_id?: string }>
}) {
  const { customer_id } = await searchParams;
  const supabase = await createClient();

  // 1. 顧客リストを50音順に取得
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, name_kana, phone, line_user_id")
    .order("name_kana", { ascending: true });

  // 2. スタッフリストを取得
  const { data: staffList } = await supabase
    .from("staff")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <ReservationForm 
      customers={customers || []} 
      staffList={staffList || []} 
      initialCustomerId={customer_id}
    />
  );
}
