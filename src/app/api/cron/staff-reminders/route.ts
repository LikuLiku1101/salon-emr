import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { sendLineMessage } from '@/lib/line';
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // 1. 今日の日付を取得 (JST固定)
    const todayJst = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const todayStr = format(todayJst, "yyyy-MM-dd");

    // 2. 本日の予約情報を取得 (スタッフ、顧客情報込み)
    const { data: treatments, error } = await supabase
      .from('treatments')
      .select(`
        visit_time,
        reserved_content,
        customers ( name ),
        staff ( id, name, line_user_id )
      `)
      .eq('visit_date', todayStr)
      .neq('status', 'キャンセル')
      .order('visit_time', { ascending: true });

    if (error) throw error;
    
    if (!treatments || treatments.length === 0) {
       return NextResponse.json({ success: true, message: `本日（${todayStr}）の予約はありませんでした` });
    }

    // 3. スタッフごとに予約をグループ分け
    const staffSchedules: Record<string, { staff: any, appointments: any[] }> = {};
    
    for (const t of treatments) {
      const staff = (t as any).staff;
      // スタッフ情報がない、またはLINE IDが未登録の場合はスキップ
      if (!staff || !staff.line_user_id) continue;

      if (!staffSchedules[staff.id]) {
        staffSchedules[staff.id] = { staff, appointments: [] };
      }
      staffSchedules[staff.id].appointments.push(t);
    }

    // 4. 各スタッフにリマインドを送信
    const results = [];
    let summaryMessage = "【本日スタッフへのリマインド送信完了】\n\n";

    for (const staffId in staffSchedules) {
      const { staff, appointments } = staffSchedules[staffId];
      const targetLineId = (staff.line_user_id as string)?.trim();
      if (!targetLineId) continue;
      
      const appointmentList = appointments.map(a => {
        const time = a.visit_time ? a.visit_time.substring(0, 5) : "--:--";
        const customerName = a.customers?.name || "お客様";
        const content = a.reserved_content || "内容未定";
        return `・${time} ${customerName}様 (${content})`;
      }).join('\n');

      const dateDisplay = format(todayJst, "M月d日(E)", { locale: ja });
      const message = `おはようございます、${staff.name}さん！😊\n本日（${dateDisplay}）の予約リストです。\n\n${appointmentList}\n\n今日も一日よろしくお願いします！✨`;

      try {
        await sendLineMessage(targetLineId, message);
        results.push({ staff: staff.name, status: 'success' });
        summaryMessage += `■ ${staff.name}様へ送信：\n${appointmentList}\n\n`;
      } catch (err: any) {
        console.error(`Failed to send reminder to ${staff.name}:`, err);
        results.push({ staff: staff.name, status: 'failed', error: err.message });
        summaryMessage += `× ${staff.name}様への送信失敗：${err.message}\n\n`;
      }
    }

    // 5. オーナー（守屋様）へのサマリー通知
    const ownerId = process.env.OWNER_LINE_USER_ID;
    if (ownerId && results.length > 0) {
      try {
        await sendLineMessage(ownerId, summaryMessage.trim());
        results.push({ staff: 'Owner Notification', status: 'success' });
      } catch (err: any) {
        console.error('Failed to send summary to owner:', err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      date: todayStr, 
      processed: results 
    });

  } catch (error: any) {
    console.error('Staff Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
