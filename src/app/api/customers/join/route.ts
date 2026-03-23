import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, name_kana, phone, gender, line_user_id } = body;

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: "お名前と電話番号は必須です" }, { status: 400 });
    }

    // 1. 電話番号が一致する既存顧客がいるかチェック
    const { data: existing, error: fetchError } = await supabase
      .from('customers')
      .select('id, line_user_id')
      .eq('phone', phone)
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
          line_user_id: line_user_id || existing.line_user_id, // 新しいIDがあれば上書き
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) throw updateError;
      
      return NextResponse.json({ success: true, mode: 'updated', customerId: existing.id });
    } else {
      // 2b. 新規の場合：新しく作成
      const { data: newData, error: insertError } = await supabase
        .from('customers')
        .insert([{
          name,
          name_kana,
          phone,
          gender,
          line_user_id: line_user_id || null
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return NextResponse.json({ success: true, mode: 'created', customerId: newData.id });
    }

  } catch (error: any) {
    console.error('Join API Error:', error);
    return NextResponse.json({ success: false, error: 'サーバーエラーが発生しました' }, { status: 500 });
  }
}
