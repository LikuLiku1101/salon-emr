import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // 1. Google Sheets APIの認証設定
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // 2. シートの情報を取得（1つ目のシートの名前を取得）
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitle = meta.data.sheets?.[0].properties?.title || 'シート1';

    // 3. すでに同期済みのシステムID（K列）を取得して重複を防ぐ
    const existingIdsRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!K:K`,
    });
    // K列にあるIDを配列にする（空の場合は空配列）
    const existingIds = existingIdsRes.data.values?.flat().filter(id => id) || [];

    // 4. Supabaseから必要なデータを全て取得 (カルテから支払金額があるものを抽出)
    const { data: treatments, error: treatmentsError } = await supabase
      .from('treatments')
      .select(`
        id,
        customer_id,
        visit_date,
        payment_amount,
        payment_method,
        reserved_content,
        customers ( name ),
        contracts ( course_name, installments ),
        staff ( name )
      `)
      .gt('payment_amount', 0)
      .order('visit_date', { ascending: true });

    if (treatmentsError) throw treatmentsError;

    // 5. まだ同期されていない新しい支払いデータだけを抽出
    const newPayments = treatments.filter(t => !existingIds.includes(t.id));

    if (newPayments.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: '新しいデータはありませんでした。' });
    }

    // 6. スプレッドシート用にデータを整形
    const rows = newPayments.map(t => {
      // @ts-ignore
      const staffName = Array.isArray(t.staff) ? t.staff[0]?.name : (t.staff as any)?.name || '';
      // @ts-ignore
      const customerName = t.customers?.name || '';
      // @ts-ignore
      const courseName = t.contracts?.course_name || t.reserved_content || '';
      // @ts-ignore
      const installments = t.contracts?.installments || 1;
      
      return [
        t.visit_date,          // A: 日付
        customerName,          // B: 氏名
        staffName,             // C: 担当者
        courseName,            // D: メニュー
        '',                    // E: (空欄)
        t.payment_amount || 0, // F: 売上金額
        t.payment_method || '',// G: 支払方法
        '',                    // H: (空欄)
        '',                    // I: (空欄)
        installments,          // J: 分割回数
        t.id                   // K: システム用ID（重複防止のため、画面外に記録）
      ];
    });

    // 7. 新しいデータを既存データの下に追記（append）する
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:K`, // A列〜K列の末尾に追加
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows,
      },
    });

    return NextResponse.json({ success: true, count: rows.length });

  } catch (error: any) {
    console.error('Spreadsheet sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '同期に失敗しました' },
      { status: 500 }
    );
  }
}
