const DEFAULTS = {
  enabled: true,
  followSelection: true,
  color: '#ffd54f',
  opacity: 0.35,
};

const $ = (id) => document.getElementById(id);
const els = {
  enabled: $('enabled'),
  followSelection: $('followSelection'),
  color: $('color'),
  opacity: $('opacity'),
  opacityOut: $('opacityOut'),
  style: $('style'),
};

function render(s) {
  els.enabled.checked = s.enabled;
  els.followSelection.checked = s.followSelection;
  els.color.value = s.color;
  els.opacity.value = Math.round(s.opacity * 100);
  els.opacityOut.textContent = `${Math.round(s.opacity * 100)}%`;
  els.style.classList.toggle('disabled', !s.enabled);
  for (const b of document.querySelectorAll('.band')) {
    b.style.background = s.color;
    b.style.opacity = s.opacity;
  }
}

let state = { ...DEFAULTS };

// Keys with a write still in flight. Storage change events for those keys are
// echoes of our own (possibly older) writes, so ignore them to avoid the UI
// flicking back when a switch is clicked twice quickly.
const inflight = {};

function save(patch) {
  state = { ...state, ...patch };
  render(state);
  const keys = Object.keys(patch);
  for (const k of keys) inflight[k] = (inflight[k] || 0) + 1;
  chrome.storage.sync.set(patch).finally(() => {
    // Defer so the matching onChanged event is seen while still marked.
    setTimeout(() => { for (const k of keys) inflight[k]--; }, 50);
  });
}

// chrome.storage.sync allows only ~120 writes a minute, so while a slider or
// color picker is being dragged we stream values through chrome.storage.local
// (no rate limit) for a live preview in the sheet, and write to sync once the
// control is released.
function preview(patch) {
  state = { ...state, ...patch };
  render(state);
  chrome.storage.local.set({ preview: patch });
}

els.enabled.addEventListener('change', () => save({ enabled: els.enabled.checked }));
els.followSelection.addEventListener('change', () => save({ followSelection: els.followSelection.checked }));
els.color.addEventListener('input', () => preview({ color: els.color.value }));
els.color.addEventListener('change', () => save({ color: els.color.value }));
els.opacity.addEventListener('input', () => preview({ opacity: Number(els.opacity.value) / 100 }));
els.opacity.addEventListener('change', () => save({ opacity: Number(els.opacity.value) / 100 }));

chrome.storage.sync.get(DEFAULTS, (s) => {
  state = s;
  render(s);
});

// Keep the popup in sync if a shortcut flips a setting while it's open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const [k, v] of Object.entries(changes)) {
    if (!inflight[k]) state[k] = v.newValue;
  }
  render(state);
});

chrome.commands.getAll((cmds) => {
  const c = cmds.find((x) => x.name === 'toggle-focus');
  if (c && c.shortcut) $('shortcut').textContent = c.shortcut;
});

$('editShortcut').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
});
