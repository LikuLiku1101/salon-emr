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

    // 電話番号の正規化（ハイフンやスペースを除去）
    const normalizedPhone = phone.replace(/[-\s]/g, '');

    // 1. 電話番号が一致する既存顧客がいるかチェック
    const { data: existing, error: fetchError } = await supabase
      .from('customers')
      .select('id, line_user_id')
      .or(`phone.eq.${normalizedPhone},phone.eq.${phone}`)
      .maybeSingle();

    if (fetchError) throw fetchError;

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
          const { sendLineMessage } = await import("@/lib/line");
          const welcomeMsg = `${name}様、LINE連携ありがとうございます！✨\nサロン「SHINE」の公式アカウントです😊\n\n今後はリマインドやご予約の確認などをこちらのLINEからお届けします🌿\n何かございましたら、いつでもこちらのチャットからご連絡くださいませ✨`;
          await sendLineMessage(line_user_id, welcomeMsg);
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
          const { sendLineMessage } = await import("@/lib/line");
          const welcomeMsg = `${name}様、はじめまして！✨\nサロン「SHINE」へのご登録・LINE連携ありがとうございます😊\n\nこちらのLINEでは予約の確認やリマインドを配信しております🌿\nどうぞよろしくお願いいたします！`;
          await sendLineMessage(line_user_id, welcomeMsg);
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
