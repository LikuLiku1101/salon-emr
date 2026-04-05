export async function sendLineMessage(to: string, text: string, skipBcc: boolean = false) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminId = process.env.OWNER_LINE_USER_ID || process.env.ADMIN_LINE_USER_ID;
  
  if (!channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
  }

  // 1. 本来の送信先へメッセージを送る
  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      to,
      messages: [
        {
          type: 'text',
          text
        }
      ]
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`LINE API error: ${JSON.stringify(error)}`);
  }

  // 2. オーナー（守屋様）へ BCC 通知（無限ループ防止のため skipBcc が false で、かつ送信先がオーナー自身でない場合のみ）
  if (!skipBcc && adminId && to !== adminId) {
    try {
      const bccText = `【送信控え】\n宛先ID: ${to}\n内容: ${text}`;
      // ここでは skipBcc を true にして自分自身への無限呼び出しを防ぐ
      await sendLineMessage(adminId, bccText, true);
    } catch (err) {
      console.error('Failed to send BCC to admin:', err);
    }
  }
  
  return await response.json();
}

/**
 * 管理者（オーナー）への通知用関数
 */
export async function sendAdminNotification(text: string) {
  const adminId = process.env.OWNER_LINE_USER_ID || process.env.ADMIN_LINE_USER_ID;
  if (!adminId) {
    console.warn('OWNER_LINE_USER_ID is not set. Admin notification skipped.');
    return;
  }
  
  try {
    // 管理者への通知時は BCC 通知をスキップ（skipBcc: true）
    await sendLineMessage(adminId, text, true);
  } catch (err) {
    console.error('Failed to send admin notification:', err);
  }
}
