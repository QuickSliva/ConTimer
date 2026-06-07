chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    const data = await chrome.storage.local.get(null);
    const timer = data[alarm.name]; 
    
    if (!timer) return;
    
    const { webhookUrl, userId, roleId } = data;

    // 1. Browser Push Notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon128.png',
      title: 'CoN Timer Alert',
      message: `Event Complete: ${timer.name}`,
      priority: 2
    });

    // 2. Discord Webhook Notification
    if (webhookUrl && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      const timestamp = new Date().toLocaleTimeString();
      let pingString = "";

      if (timer.pingTarget === 'role' && roleId) {
        pingString = `<@&${roleId}>`; 
      } else if (userId) {
        pingString = `<@${userId}>`;
      }

      const message = `${pingString}\n\n🔔 **CON TIMER ALERT**\n**Event:** ${timer.name}\n**Details:** ${timer.notes}\n**Time:** ${timestamp}`;

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });
    }
  } catch (error) {
    console.error("Alarm execution failed:", error);
  } finally {
    // Always remove the alarm from storage so it doesn't trigger again
    await chrome.storage.local.remove(alarm.name);
  }
});
