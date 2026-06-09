// ==========================================
// 1. THEME & NAVIGATION
// ==========================================
const themeToggle = document.getElementById('theme-toggle');
const bodyElement = document.getElementById('body-element');

chrome.storage.local.get(['darkMode'], (result) => {
  if (result.darkMode) bodyElement.classList.add('dark-mode');
});

themeToggle.addEventListener('click', () => {
  const isDark = bodyElement.classList.toggle('dark-mode');
  chrome.storage.local.set({ darkMode: isDark });
});

const navItems = {
  'nav-config': { title: 'Settings', section: 'section-config' },
  'nav-create': { title: 'Add Timer', section: 'section-create' },
  'nav-list': { title: 'Active Timers', section: 'section-list' },
  'nav-intel': { title: 'Intelligence', section: 'section-intel' },
  'nav-help': { title: 'Technical Guide', section: 'section-help' },
};

Object.keys(navItems).forEach(id => {
  document.getElementById(id).addEventListener('click', () => {
    document.querySelectorAll('.rail-item').forEach(item => item.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('header-title').textContent = navItems[id].title;
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(navItems[id].section).classList.add('active');
  });
});

// ==========================================
// 2. INTELLIGENCE DATABASE (STRATEGIC DOSSIER)
// ==========================================
let currentEditingEnemy = null;

async function updateIntelList() {
  const listElement = document.getElementById('intelList');
  const data = await chrome.storage.local.get('con_intel');
  const enemies = data.con_intel || {};
  
  listElement.innerHTML = "";
  const enemyNames = Object.keys(enemies).sort();

  if (enemyNames.length === 0) {
    listElement.innerHTML = `<div style="color: var(--text-dim); font-size: 12px; text-align: center; padding: 20px;">No intelligence logged</div>`;
    return;
  }

  enemyNames.forEach(name => {
    const enemy = enemies[name];
    const row = document.createElement('div');
    row.className = 'intel-item';
    row.innerHTML = `
      <div class="intel-info">
        <span class="intel-name">${name}</span>
        <span class="intel-preview">${enemy.coalition || 'No Coalition'} | ${enemy.rank || 'Unknown Rank'}</span>
      </div>
    `;
    row.onclick = () => openEnemyDetails(name);
    listElement.appendChild(row);
  });
}

function openEnemyDetails(name) {
  currentEditingEnemy = name;
  chrome.storage.local.get('con_intel', (data) => {
    const enemy = (data.con_intel || {})[name];
    document.getElementById('edit-enemy-name').value = name;
    document.getElementById('edit-enemy-coalition').value = enemy.coalition || "";
    document.getElementById('edit-enemy-rank').value = enemy.rank || "";
    document.getElementById('edit-enemy-research').value = enemy.research || "";
    document.getElementById('edit-enemy-events').value = enemy.events || "";
    document.getElementById('edit-enemy-notes').value = enemy.notes || "";
    
    document.getElementById('intel-list-view').style.display = 'none';
    document.getElementById('intel-detail-view').classList.add('active');
  });
}

document.getElementById('back-to-intel').addEventListener('click', () => {
  document.getElementById('intel-list-view').style.display = 'block';
  document.getElementById('intel-detail-view').classList.remove('active');
  currentEditingEnemy = null;
});

document.getElementById('add-enemy-btn').addEventListener('click', async () => {
  const name = document.getElementById('new-enemy-name').value.trim();
  if (!name) return;
  
  const data = await chrome.storage.local.get('con_intel');
  const enemies = data.con_intel || {};
  enemies[name] = { coalition: "", rank: "", research: "", events: "", notes: "" };
  
  await chrome.storage.local.set({ con_intel: enemies });
  document.getElementById('new-enemy-name').value = "";
  updateIntelList();
});

document.getElementById('save-enemy-btn').addEventListener('click', async () => {
  if (!currentEditingEnemy) return;
  
  const newName = document.getElementById('edit-enemy-name').value.trim();
  const coalition = document.getElementById('edit-enemy-coalition').value;
  const rank = document.getElementById('edit-enemy-rank').value;
  const research = document.getElementById('edit-enemy-research').value;
  const events = document.getElementById('edit-enemy-events').value;
  const notes = document.getElementById('edit-enemy-notes').value;
  
  const data = await chrome.storage.local.get('con_intel');
  const enemies = data.con_intel || {};
  
  if (newName !== currentEditingEnemy) delete enemies[currentEditingEnemy];
  
  enemies[newName] = { coalition, rank, research, events, notes };
  await chrome.storage.local.set({ con_intel: enemies });
  
  document.getElementById('back-to-intel').click();
  updateIntelList();
});

document.getElementById('delete-enemy-btn').addEventListener('click', async () => {
  if (!currentEditingEnemy) return;
  if (!confirm(`Delete intel for ${currentEditingEnemy}?`)) return;
  
  const data = await chrome.storage.local.get('con_intel');
  const enemies = data.con_intel || {};
  delete enemies[currentEditingEnemy];
  await chrome.storage.local.set({ con_intel: enemies });
  document.getElementById('back-to-intel').click();
  updateIntelList();
});

// ==========================================
// 3. TIMER & CALCULATOR LOGIC
// ==========================================
const calcBtn = document.getElementById('calc-btn');
const calcOutput = document.getElementById('calc-output');

calcBtn.addEventListener('click', () => {
  const h = parseFloat(document.getElementById('calc-hrs').value) || 0;
  const m = parseFloat(document.getElementById('calc-mins').value) || 0;
  const s = parseFloat(document.getElementById('calc-secs').value) || 0;
  const totalSeconds = (h * 3600) + (m * 60) + s;
  const res = totalSeconds / 4;
  const rh = Math.floor(res / 3600), rm = Math.floor((res % 3600) / 60), rs = Math.floor(res % 60);
  calcOutput.textContent = `${rh.toString().padStart(2, '0')}:${rm.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
});

const elements = {
  webhookUrl: document.getElementById('webhookUrl'),
  userId: document.getElementById('userId'),
  roleId: document.getElementById('roleId'),
  saveSettings: document.getElementById('saveSettings'),
  clearAll: document.getElementById('clearAll'),
  saveStatus: document.getElementById('saveStatus'),
  enableNotifications: document.getElementById('enableNotifications'),
  eventName: document.getElementById('eventName'),
  eventNotes: document.getElementById('eventNotes'),
  pingTarget: document.getElementById('pingTarget'),
  hrs: document.getElementById('hrs'),
  mins: document.getElementById('mins'),
  secs: document.getElementById('secs'),
  startTimer: document.getElementById('startTimer'),
  timerList: document.getElementById('timerList'),
};

chrome.storage.local.get(['webhookUrl', 'userId', 'roleId'], (result) => {
  if (result.webhookUrl) elements.webhookUrl.value = result.webhookUrl;
  if (result.userId) elements.userId.value = result.userId;
  if (result.roleId) elements.roleId.value = result.roleId;
});

elements.enableNotifications.addEventListener('click', () => {
  chrome.notifications.create({
    type: 'basic', iconUrl: 'icon128.png', title: 'System Check',
    message: 'Browser alerts are working!', priority: 2
  }, () => showStatus("Test Notification Sent"));
});

elements.saveSettings.addEventListener('click', () => {
  const config = {
    webhookUrl: elements.webhookUrl.value.trim(),
    userId: elements.userId.value.trim(),
    roleId: elements.roleId.value.trim(),
  };
  if (!config.webhookUrl || !config.userId) { alert("Webhook URL and User ID are required."); return; }
  chrome.storage.local.set(config, () => showStatus("Configuration Saved"));
});

elements.clearAll.addEventListener('click', async () => {
  if (!confirm("Wipe all settings and timers?")) return;
  const data = await chrome.storage.local.get(null);
  const timers = Object.keys(data).filter(key => key.startsWith('con_timer_'));
  for (const id of timers) { await chrome.alarms.clear(id); }
  await chrome.storage.local.clear();
  elements.webhookUrl.value = ""; elements.userId.value = ""; elements.roleId.value = "";
  updateTimerList(); updateIntelList(); showStatus("Data wiped");
});

elements.startTimer.addEventListener('click', () => {
  const name = elements.eventName.value.trim() || "Unnamed Event";
  const notes = elements.eventNotes.value.trim() || "No details.";
  const target = elements.pingTarget.value;
  const h = Math.max(0, parseFloat(elements.hrs.value) || 0);
  const m = Math.max(0, parseFloat(elements.mins.value) || 0);
  const s = Math.max(0, parseFloat(elements.secs.value) || 0);

  const totalSeconds = (h * 3600) + (m * 60) + s;
  if (totalSeconds <= 0) { alert("Please set a duration."); return; }

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
  const ts = Math.floor(ms / 1000);
  return `${Math.floor(ts/3600).toString().padStart(2,'0')}:${Math.floor((ts%3600)/60).toString().padStart(2,'0')}:${(ts%60).toString().padStart(2,'0')}`;
}

async function updateTimerList() {
  const listElement = elements.timerList;
  const data = await chrome.storage.local.get(null) || {};
  const timers = Object.keys(data).filter(key => key.startsWith('con_timer_'));

  if (timers.length === 0) {
    listElement.innerHTML = `<div style="color: var(--text-dim); font-size: 12px; text-align: center; padding: 20px;">No active timers</div>`;
    return;
  }

  timers.forEach(id => {
    const timer = data[id];
    const timeLeft = timer.endTime - Date.now();
    let row = document.getElementById(id);
    if (row) {
      const span = row.querySelector('.timer-time');
      if (span) span.textContent = formatTimeLeft(timeLeft);
    } else {
      row = document.createElement('div');
      row.className = 'timer-item';
      row.id = id;
      row.innerHTML = `
        <div class="timer-info">
          <span class="timer-name">${timer.name}</span>
          <span class="timer-time">${formatTimeLeft(timeLeft)}</span>
        </div>
        <button class="btn-remove">Remove</button>
      `;
      row.querySelector('.btn-remove').onclick = () => cancelTimer(id);
      listElement.appendChild(row);
    }
  });
  listElement.querySelectorAll('.timer-item').forEach(row => { if (!timers.includes(row.id)) row.remove(); });
}

function showStatus(text) {
  elements.saveStatus.textContent = text;
  setTimeout(() => { elements.saveStatus.textContent = ""; }, 2000);
}

function resetTimerInputs() {
  elements.eventName.value = ""; elements.eventNotes.value = "";
  elements.hrs.value = 0; elements.mins.value = 0; elements.secs.value = 0;
}

setInterval(updateTimerList, 1000);
updateTimerList();
updateIntelList();
