import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) {
    let val = rest.join('=').trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    envVars[key.trim()] = val;
  }
});

async function run() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: envVars['GOOGLE_CLIENT_EMAIL'],
        private_key: envVars['GOOGLE_PRIVATE_KEY']?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = envVars['GOOGLE_SPREADSHEET_ID'];

    console.log('Fetching meta for Spreadsheet:', spreadsheetId);
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetTitle = meta.data.sheets?.[0].properties?.title || 'シート1';
    console.log('Sheet Title:', sheetTitle);

    const existingIdsRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}!K:K`,
    });
    
    console.log('K Column Values:', existingIdsRes.data.values);
    
    // Test append
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTitle}!A:K`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [['Test Date', 'Test Name', 'Test Staff', 'Test Menu', '', 1000, 'Cash', '', '', 1, 'test-id']],
      },
    });
    console.log('Successfully appended test row!');
    
  } catch (error) {
    console.error('Error in sync script:', error);
  }
}

run();
