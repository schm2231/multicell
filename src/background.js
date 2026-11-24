// Keyboard shortcuts flip settings in chrome.storage.sync; content scripts
// and the popup listen for storage changes, so every tab updates at once.

const DEFAULTS = { enabled: true, followSelection: true };

async function flip(key) {
  const cur = await chrome.storage.sync.get(DEFAULTS);
  const next = !cur[key];
  await chrome.storage.sync.set({ [key]: next });
  if (key === 'enabled') updateBadge(next);
}

function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? '' : 'off' });
  chrome.action.setBadgeBackgroundColor({ color: '#777' });
}

chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-focus') flip('enabled');
  if (command === 'toggle-follow-selection') flip('followSelection');
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) updateBadge(changes.enabled.newValue);
});

async function syncBadge() {
  const { enabled } = await chrome.storage.sync.get(DEFAULTS);
  updateBadge(enabled);
}
// After an install, update or reload, Sheets tabs that were already open are
// still running the old content script, which no longer receives setting
// changes. Inject the current one; it replaces the old copy's overlay.
async function refreshOpenSheets() {
  const tabs = await chrome.tabs.query({ url: 'https://docs.google.com/spreadsheets/*' });
  for (const tab of tabs) {
    chrome.scripting
      .executeScript({ target: { tabId: tab.id }, files: ['src/content.js'] })
      .catch(() => {}); // e.g. tab discarded or still loading
  }
}

chrome.runtime.onStartup.addListener(syncBadge);
chrome.runtime.onInstalled.addListener(() => {
  syncBadge();
  refreshOpenSheets();
});
