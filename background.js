chrome.alarms.onAlarm.addListener(async (alarm) => {
  try {
    const data = await chrome.storage.local.get(null);
    const timer = data[alarm.name]; 
    if (!timer) return;
    
    const { webhookUrl, userId, roleId } = data;

    // 1. Browser Notification
    chrome.notifications.create({
      type: 'basic', iconUrl: 'icon128.png',
      title: 'CoN Strategic Alert',
      message: `Event: ${timer.name}`,
      priority: 2
    });

    // 2. Discord Webhook (Alliance Priority Logic)
    if (webhookUrl && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      const timestamp = new Date().toLocaleTimeString();
      let ping = "";

      if (timer.pingTarget === 'role' && roleId) {
        ping = `<@&${roleId}>`; // Alliance Role Ping
      } else if (timer.pingTarget === 'me' && userId) {
        ping = `<@${userId}>`; // Personal Ping
      }

      // Formatting as a high-visibility "Military Briefing"
      const content = `${ping}\n\n**🚨 STRATEGIC ALERT**\n**EVENT:** ${timer.name}\n**DETAILS:** ${timer.notes}\n**TIME:** ${timestamp}\n*Action required immediately.*`;

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content }),
      });
    }
  } catch (error) {
    console.error("Alarm failed:", error);
  } finally {
    await chrome.storage.local.remove(alarm.name);
  }
});
