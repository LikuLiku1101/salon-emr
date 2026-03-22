import { NextResponse } from 'next/server';
import { sendLineMessage } from '@/lib/line';

export async function GET() {
  const testUserId = process.env.TEST_LINE_USER_ID;
  
  if (!testUserId) {
    return NextResponse.json({ error: 'TEST_LINE_USER_ID is not set' }, { status: 400 });
  }

  try {
    const message = 'SHINE管理システムからのリマインドテストです！このメッセージが届いていれば、API連携は成功しています。';
    await sendLineMessage(testUserId, message);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test message sent successfully!',
      to: testUserId 
    });
  } catch (error: any) {
    console.error('Test Send Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
