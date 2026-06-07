// Cache DOM elements to avoid repeated lookups
const elements = {
  webhookUrl: document.getElementById('webhookUrl'),
  userId: document.getElementById('userId'),
  roleId: document.getElementById('roleId'),
  saveSettings: document.getElementById('saveSettings'),
  clearAll: document.getElementById('clearAll'), // Added
  saveStatus: document.getElementById('saveStatus'),
  enableNotifications: document.getElementById('enableNotifications'),
  toggleHelp: document.getElementById('toggleHelp'),
  helpContent: document.getElementById('helpContent'),
  eventName: document.getElementById('eventName'),
  eventNotes: document.getElementById('eventNotes'),
  pingTarget: document.getElementById('pingTarget'),
  hrs: document.getElementById('hrs'),
  mins: document.getElementById('mins'),
  secs: document.getElementById('secs'),
  startTimer: document.getElementById('startTimer'),
  timerList: document.getElementById('timerList'),
};

// Initialize Settings
chrome.storage.local.get(['webhookUrl', 'userId', 'roleId'], (result) => {
  if (result.webhookUrl) elements.webhookUrl.value = result.webhookUrl;
  if (result.userId) elements.userId.value = result.userId;
  if (result.roleId) elements.roleId.value = result.roleId;
});

// Test Notifications
elements.enableNotifications.addEventListener('click', () => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon128.png', 
    title: 'System Check',
    message: 'Browser alerts are working!',
    priority: 2
  }, (id) => {
    if (chrome.runtime.lastError) {
      alert("Notification failed. Ensure icon128.png exists.");
    } else {
      showStatus("Test Notification Sent");
    }
  });
});

// Save Settings
elements.saveSettings.addEventListener('click', () => {
  const config = {
    webhookUrl: elements.webhookUrl.value.trim(),
    userId: elements.userId.value.trim(),
    roleId: elements.roleId.value.trim(),
  };

  if (!config.webhookUrl || !config.userId) { 
    alert("Webhook URL and User ID are required."); 
    return; 
  }

  chrome.storage.local.set(config, () => showStatus("Configuration Saved"));
});

// NEW: Clear All Data Logic
elements.clearAll.addEventListener('click', async () => {
  const confirmed = confirm("This will delete all saved settings and cancel all active timers. Are you sure?");
  if (!confirmed) return;

  try {
    // 1. Get all current data to find active alarms
    const data = await chrome.storage.local.get(null);
    const timers = Object.keys(data).filter(key => key.startsWith('con_timer_'));

    // 2. Cancel every active alarm first
    for (const alarmId of timers) {
      await chrome.alarms.clear(alarmId);
    }

    // 3. Wipe all storage
    await chrome.storage.local.clear();

    // 4. Reset UI
    elements.webhookUrl.value = "";
    elements.userId.value = "";
    elements.roleId.value = "";
    updateTimerList();
    showStatus("All data wiped successfully");
  } catch (error) {
    console.error("Clear all failed:", error);
    alert("An error occurred while clearing data.");
  }
});

// Timer Management
elements.startTimer.addEventListener('click', () => {
  const name = elements.eventName.value.trim() || "Unnamed Event";
  const notes = elements.eventNotes.value.trim() || "No details provided.";
  const target = elements.pingTarget.value;
  
  const h = Math.max(0, parseFloat(elements.hrs.value) || 0);
  const m = Math.max(0, parseFloat(elements.mins.value) || 0);
  const s = Math.max(0, parseFloat(elements.secs.value) || 0);

  const totalSeconds = (h * 3600) + (m * 60) + s;
  if (totalSeconds <= 0) { alert("Please set a valid duration."); return; }

  const alarmId = `con_timer_${Date.now()}`;
  const endTime = Date.now() + (totalSeconds * 1000);
  
  const timerData = { name, notes, endTime, pingTarget: target };

  chrome.storage.local.set({ [alarmId]: timerData }, () => {
    chrome.alarms.create(alarmId, { delayInMinutes: totalSeconds / 60 });
    updateTimerList(); 
    resetTimerInputs();
  });
});

async function cancelTimer(id) {
  await chrome.alarms.clear(id);
  await chrome.storage.local.remove(id);
  updateTimerList();
}

function formatTimeLeft(ms) {
  if (ms < 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

async function updateTimerList() {
  const listElement = elements.timerList;
  const data = await chrome.storage.local.get(null) || {};
  const timers = Object.keys(data).filter(key => key.startsWith('con_timer_'));

  if (timers.length === 0) {
    if (listElement.innerHTML !== "") {
      listElement.innerHTML = `<div id="empty-msg" style="color: var(--text-dim); font-size: 11px; text-align: center; padding: 20px 0;">No pending alerts</div>`;
    }
    return;
  }

  const emptyMsg = document.getElementById('empty-msg');
  if (emptyMsg) emptyMsg.remove();

  timers.forEach(id => {
    const timer = data[id];
    const timeLeft = timer.endTime - Date.now();
    let row = document.getElementById(id);
    
    if (row) {
      const countdownSpan = row.querySelector('.timer-countdown');
      if (countdownSpan) countdownSpan.textContent = formatTimeLeft(timeLeft);
    } else {
      row = document.createElement('div');
      row.className = 'timer-row';
      row.id = id;
      row.innerHTML = `
        <div style="display: flex; flex-direction: column;">
          <span class="timer-name">${timer.name}</span>
          <span class="timer-countdown" style="font-size: 10px; color: var(--accent);">${formatTimeLeft(timeLeft)}</span>
        </div>
        <button class="btn-cancel">Remove</button>
      `;
      row.querySelector('.btn-cancel').onclick = () => cancelTimer(id);
      listElement.appendChild(row);
    }
  });

  listElement.querySelectorAll('.timer-row').forEach(row => {
    if (!timers.includes(row.id)) row.remove();
  });
}

function showStatus(text) {
  elements.saveStatus.textContent = text;
  setTimeout(() => { elements.saveStatus.textContent = ""; }, 2000);
}

function resetTimerInputs() {
  elements.eventName.value = "";
  elements.eventNotes.value = "";
  elements.hrs.value = 0;
  elements.mins.value = 0;
  elements.secs.value = 0;
}

elements.toggleHelp.addEventListener('click', () => {
  elements.helpContent.style.display = elements.helpContent.style.display === "flex" ? "none" : "flex";
});

setInterval(updateTimerList, 1000);
updateTimerList();
