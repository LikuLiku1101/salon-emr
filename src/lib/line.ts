export async function sendLineMessage(to: string, text: string) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!channelAccessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not set');
  }

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
  
  return await response.json();
}

/**
 * 管理者（オーナー）への通知用関数
 */
export async function sendAdminNotification(text: string) {
  const adminId = process.env.ADMIN_LINE_USER_ID;
  if (!adminId) {
    console.warn('ADMIN_LINE_USER_ID is not set. Admin notification skipped.');
    return;
  }
  
  try {
    await sendLineMessage(adminId, text);
  } catch (err) {
    console.error('Failed to send admin notification:', err);
  }
}
