import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { sendLineMessage } from '@/lib/line';
import { format } from "date-fns";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  // セキュリティチェック（必要に応じて有効化）
  // const { searchParams } = new URL(request.url);
  // if (searchParams.get('secret') !== process.env.CRON_SECRET) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const results = [];

    // -----------------------------------------------------------------
    // 2. 初回の施術が終わった日の夜 (お礼メッセージ)
    // -----------------------------------------------------------------
    const { data: eveningTreatments } = await supabase
      .from('treatments')
      .select('id, customers ( name, line_user_id )')
      .eq('visit_date', todayStr)
      .eq('visit_count', 1)
      .eq('evening_notified', false)
      .neq('status', 'キャンセル');

    for (const t of (eveningTreatments || [])) {
      const customer = (t as any).customers;
      if (customer?.line_user_id) {
        const message = `${customer.name}様\n本日はご来店ありがとうございました。\n当店の施術はいかがだったでしょうか？何かお気づきの点がございましたら、こちらのLINEからご連絡頂ければと思います。\nまた、施術後は\n・過度な飲酒はお控えください。\n・赤みが出た場合は、固く搾ったタオルなどで冷やしていただき、十分に保湿をお願い致します。\n\n次回の施術は本日より概ね20日以降でのご予約をお願いします。\nご連絡をお待ちしております。`;
        await sendLineMessage(customer.line_user_id, message);
        await supabase.from('treatments').update({ evening_notified: true }).eq('id', t.id);
        results.push({ customer: customer.name, type: 'evening', status: 'success' });
      }
    }

    // -----------------------------------------------------------------
    // 3. 初回の施術から14日後 (フォローメッセージ)
    // -----------------------------------------------------------------
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysAgoStr = format(fourteenDaysAgo, "yyyy-MM-dd");

    const { data: followupTreatments } = await supabase
      .from('treatments')
      .select('id, customer_id, visit_date, customers ( name, line_user_id )')
      .eq('visit_date', fourteenDaysAgoStr)
      .eq('visit_count', 1)
      .eq('followup_notified', false)
      .neq('status', 'キャンセル');

    for (const t of (followupTreatments || [])) {
      const customer = (t as any).customers;
      if (customer?.line_user_id) {
        // 次の予約があるかチェック
        const { count } = await supabase
          .from('treatments')
          .select('id', { count: 'exact', head: true })
          .eq('customer_id', t.customer_id)
          .gt('visit_date', t.visit_date)
          .neq('status', 'キャンセル');

        if (count === 0) {
          const message = `${customer.name}さま\nお世話になります。SHINEです😊\n施術後のトラブルなどございませんでしたでしょうか？\n\n前回の脱毛から概ね2週間が経ちますので、そろそろ次回のご予約はいかがかなと思いご連絡させていただきました✨\n${customer.name}さまからのご連絡心よりお待ちしております😊`;
          await sendLineMessage(customer.line_user_id, message);
          results.push({ customer: customer.name, type: 'followup', status: 'success' });
        }
        await supabase.from('treatments').update({ followup_notified: true }).eq('id', t.id);
      }
    }

    // -----------------------------------------------------------------
    // 4. 全ての予約の24時間前 (リマインド)
    // -----------------------------------------------------------------
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = format(tomorrow, "yyyy-MM-dd");

    const { data: reminderTreatments } = await supabase
      .from('treatments')
      .select('id, visit_date, visit_time, reserved_content, customers ( name, line_user_id )')
      .eq('visit_date', tomorrowStr)
      .eq('reminder_notified', false)
      .neq('status', 'キャンセル');

    for (const t of (reminderTreatments || [])) {
      const customer = (t as any).customers;
      if (customer?.line_user_id) {
        const dateStr = format(new Date(t.visit_date), "M月d日");
        const timeStr = t.visit_time ? t.visit_time.substring(0, 5) : "--:--";
        const message = `${customer.name}様こんばんは😊\n脱毛サロンSHINEです。\n明日のご予約の確認を送らせていただきます☺︎ご返信不要です🌿\n\n日時：${dateStr} ${timeStr}～\n内容：${t.reserved_content || "施術内容未定"}\n部屋番号は【101】となります。お間違いの無いようにお気を付けください。\n\nお気をつけてお越しくださいませ😊`;
        await sendLineMessage(customer.line_user_id, message);
        await supabase.from('treatments').update({ reminder_notified: true }).eq('id', t.id);
        results.push({ customer: customer.name, type: 'reminder', status: 'success' });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, details: results });
  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
