import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();
    
    // 1. Supabaseから必要なデータを全て取得
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
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

    // 2. スプレッドシート用にデータを整形
    // A列: 日付, B列: 氏名, C列: 担当者, D列: メニュー, E列: -, F列: 売上金額, G列: 支払方法, H列: -, I列: -, J列: 分割回数
    // ※実際のシートの列順に合わせてここで調整可能です。
    const rows = payments.map(p => {
      // 支払い日と同じ日の来店記録を探して担当者を特定
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
        installments           // J: 分割回数
      ];
    });

    // 3. Google Sheets APIの認証設定
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // 4. シートの情報を取得（1つ目のシートの名前を取得）
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitle = meta.data.sheets?.[0].properties?.title || 'シート1';

    // 5. 既存のデータ（2行目以降）をクリア
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `${sheetTitle}!A2:Z`,
    });

    // 6. 新しいデータを書き込み
    if (rows.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetTitle}!A2`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: rows,
        },
      });
    }

    return NextResponse.json({ success: true, count: rows.length });

  } catch (error: any) {
    console.error('Spreadsheet sync error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '同期に失敗しました' },
      { status: 500 }
    );
  }
}
