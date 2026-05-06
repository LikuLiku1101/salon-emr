import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();
    
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

    // 4. Supabaseから必要なデータを全て取得
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        id,
        customer_id,
        payment_date,
        amount,
        payment_method,
        customers ( name ),
        contracts ( course_name, installments )
      `)
      .order('payment_date', { ascending: true });

    if (paymentsError) throw paymentsError;

    const { data: treatments, error: treatmentsError } = await supabase
      .from('treatments')
      .select(`
        visit_date, 
        customer_id, 
        staff ( name )
      `);

    if (treatmentsError) throw treatmentsError;

    // 5. まだ同期されていない新しい支払いデータだけを抽出
    const newPayments = payments.filter(p => !existingIds.includes(p.id));

    if (newPayments.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: '新しいデータはありませんでした。' });
    }

    // 6. スプレッドシート用にデータを整形
    const rows = newPayments.map(p => {
      const treatment = treatments?.find(
        t => t.customer_id === p.customer_id && t.visit_date === p.payment_date
      );
      // @ts-ignore
      const staffName = treatment?.staff?.name || '';
      // @ts-ignore
      const customerName = p.customers?.name || '';
      // @ts-ignore
      const courseName = p.contracts?.course_name || '';
      // @ts-ignore
      const installments = p.contracts?.installments || 1;
      
      return [
        p.payment_date,        // A: 日付
        customerName,          // B: 氏名
        staffName,             // C: 担当者
        courseName,            // D: メニュー
        '',                    // E: (空欄)
        p.amount || 0,         // F: 売上金額
        p.payment_method || '',// G: 支払方法
        '',                    // H: (空欄)
        '',                    // I: (空欄)
        installments,          // J: 分割回数
        p.id                   // K: システム用ID（重複防止のため、画面外に記録）
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
