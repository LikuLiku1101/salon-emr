import { NextResponse } from 'next/server';
import { createAdminClient } from "@/utils/supabase/server";
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();
    const { name, name_kana, phone, gender, line_user_id } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: "お名前と電話番号は必須です" }, { status: 400 });
    }

    // 電話番号の正規化（数字以外を全て除去）
    const normalizedPhone = phone.replace(/\D/g, '');

    // 一旦、電話番号で候補を取得
    const { data: candidates, error: fetchError } = await supabase
      .from('customers')
      .select('id, name, phone, line_user_id');

    if (fetchError) throw fetchError;

    // 名前と電話番号の両方を見て、既存顧客を特定する
    const existing = candidates?.find(c => {
      const dbPhone = c.phone?.replace(/\D/g, '');
      const dbName = c.name?.replace(/\s/g, '');
      const inputName = name.replace(/\s/g, '');
      
      // 電話番号が一致、または（お名前(スペース抜き)と電話番号の両方が一致）
      return dbPhone === normalizedPhone || (dbName === inputName && dbPhone === normalizedPhone);
    });

    if (existing) {
      // 2a. 既存の場合：情報を更新（特にLINE IDを紐付け）
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          name,
          name_kana,
          gender,
          line_user_id: line_user_id || existing.line_user_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
      
      // 3a. LINE連携の挨拶メッセージ
      if (line_user_id) {
        try {
          const { sendLineMessage, sendAdminNotification } = await import("@/lib/line");
          const welcomeMsg = `${name}様\nありがとうございます。LINE連携が完了いたしました😊`;
          await sendLineMessage(line_user_id, welcomeMsg);
          await sendAdminNotification(`【お客様がLINE連携を完了しました】\n対象：${name}様 (既存顧客からの紐付け)`);
        } catch (err) {
          console.error("Welcome message failed:", err);
        }
      }
      
      revalidatePath(`/customers/${existing.id}`);
      revalidatePath('/customers');
      
      return NextResponse.json({ success: true, mode: 'updated', customerId: existing.id });
    } else {
      // 2b. 新規の場合：新しく作成
      const { data: newData, error: insertError } = await supabase
        .from('customers')
        .insert([{
          name,
          name_kana,
          phone: normalizedPhone,
          gender,
          line_user_id: line_user_id || null
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // 3b. 新規登録の感謝メッセージ
      if (line_user_id) {
        try {
          const { sendLineMessage, sendAdminNotification } = await import("@/lib/line");
          const welcomeMsg = `${name}様\nありがとうございます。LINE連携が完了いたしました😊`;
          await sendLineMessage(line_user_id, welcomeMsg);
          await sendAdminNotification(`【新規顧客が自分で登録しました】\nお名前：${name}様 (${gender || "性別不明"})\n電話番号：${phone}`);
        } catch (err) {
          console.error("Welcome message failed:", err);
        }
      }

      revalidatePath('/customers');

      return NextResponse.json({ success: true, mode: 'created', customerId: newData.id });
    }

  } catch (error: any) {
    console.error('Join API Error:', error);
    return NextResponse.json({ success: false, error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
