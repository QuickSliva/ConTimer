document.getElementById('save').addEventListener('click', () => {
  const webhookUrl = document.getElementById('webhookUrl').value;
  const userId = document.getElementById('userId').value;

  chrome.storage.local.set({ webhookUrl, userId }, () => {
    document.getElementById('status').textContent = "Settings saved!";
  });
});

// Load existing settings
chrome.storage.local.get(['webhookUrl', 'userId'], (result) => {
  if (result.webhookUrl) document.getElementById('webhookUrl').value = result.webhookUrl;
  if (result.userId) document.getElementById('userId').value = result.userId;
});
