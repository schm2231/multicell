// Multicell: draws row/column focus bands over the Google Sheets grid.
//
// Sheets renders cells on a canvas, so there are no cell elements to style.
// Instead we read the geometry of the selection borders Sheets draws as DOM
// elements (.active-cell-border and .selection-border) and paint our own
// translucent bands on top of the cell area.

(() => {
  // Skip if a working copy is already running in this world (e.g. injected
  // twice). A copy left over from before an extension reload reports not alive.
  if (typeof window.__multicellAlive === 'function' && window.__multicellAlive()) return;

  // When the extension is reloaded or updated, Chrome leaves the old copy of
  // this script running in open tabs, cut off from storage events. The
  // background worker injects a fresh copy; each copy claims the page with a
  // unique id, and an older copy that sees a newer claim (or loses its
  // extension context) removes its overlay and stops.
  const INSTANCE = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  document.documentElement.dataset.multicellInstance = INSTANCE;
  for (const old of document.querySelectorAll('#multicell-overlay')) old.remove();
  let dead = false;

  const DEFAULTS = {
    enabled: true,
    followSelection: true,
    color: '#ffd54f',
    opacity: 0.35,
  };

  let settings = { ...DEFAULTS };
  let root = null;
  let bands = null;
  let frame = 0;
  let observer = null;
  let observedGrid = null;

  // ---- geometry -----------------------------------------------------------

  function visibleRects(selector) {
    const out = [];
    for (const el of document.querySelectorAll(selector)) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) out.push(r);
    }
    return out;
  }

  function union(rects) {
    if (!rects.length) return null;
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const r of rects) {
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    }
    return { left, top, right, bottom };
  }

  // The area that holds cells: right of the row headers, below the column
  // headers, and inside the scrollable wrapper (which excludes scrollbars).
  function cellArea() {
    const grid = document.getElementById('waffle-grid-container');
    if (!grid) return null;
    const g = grid.getBoundingClientRect();
    const rowHeaders = grid.querySelector('.row-headers-background');
    const colHeaders = grid.querySelector('.column-headers-background');
    const scroller = grid.querySelector('.grid-scrollable-wrapper');
    const s = scroller ? scroller.getBoundingClientRect() : g;
    return {
      grid,
      g,
      left: rowHeaders ? rowHeaders.getBoundingClientRect().right : g.left,
      top: colHeaders ? colHeaders.getBoundingClientRect().bottom : g.top,
      right: s.right,
      bottom: s.bottom,
    };
  }

  function targetRect() {
    if (settings.followSelection) {
      const sel = union(visibleRects('.selection-border'));
      if (sel) return sel;
    }
    return union(visibleRects('.active-cell-border'));
  }

  // ---- drawing ------------------------------------------------------------

  function ensureRoot(grid) {
    if (root && root.parentElement === grid) return;
    if (root) root.remove();
    root = document.createElement('div');
    root.id = 'multicell-overlay';
    Object.assign(root.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '3',
      overflow: 'hidden',
    });
    bands = {};
    // Row band spans the full width; the column band is split above and
    // below it so the overlap isn't drawn twice (which would double opacity).
    for (const name of ['row', 'colAbove', 'colBelow']) {
      const b = document.createElement('div');
      b.style.position = 'absolute';
      b.style.pointerEvents = 'none';
      root.appendChild(b);
      bands[name] = b;
    }
    if (getComputedStyle(grid).position === 'static') grid.style.position = 'relative';
    grid.appendChild(root);
  }

  function place(el, left, top, right, bottom, origin) {
    const w = right - left;
    const h = bottom - top;
    if (w <= 0 || h <= 0) {
      el.style.display = 'none';
      return;
    }
    Object.assign(el.style, {
      display: 'block',
      left: `${left - origin.left}px`,
      top: `${top - origin.top}px`,
      width: `${w}px`,
      height: `${h}px`,
      background: settings.color,
      opacity: String(settings.opacity),
    });
  }

  function hide() {
    if (root) root.style.display = 'none';
  }

  function isStale() {
    if (dead) return true;
    let contextGone = false;
    try {
      contextGone = typeof chrome !== 'undefined' && chrome.runtime && !chrome.runtime.id;
    } catch (e) {
      contextGone = true;
    }
    if (contextGone || document.documentElement.dataset.multicellInstance !== INSTANCE) {
      teardown();
      return true;
    }
    return false;
  }

  function draw() {
    frame = 0;
    if (isStale()) return;
    if (!settings.enabled) return hide();
    const area = cellArea();
    if (!area) return hide();
    watchGrid(area.grid);
    const t = targetRect();
    if (!t) return hide();

    ensureRoot(area.grid);
    root.style.display = 'block';

    // Clip the target to the cell area.
    const top = Math.max(t.top, area.top);
    const bottom = Math.min(t.bottom, area.bottom);
    const left = Math.max(t.left, area.left);
    const right = Math.min(t.right, area.right);
    const o = area.g;

    place(bands.row, area.left, top, area.right, bottom, o);
    // If the row band is scrolled out of view, the column band runs the
    // full height through the "above" piece.
    const rowVisible = bottom > top;
    place(bands.colAbove, left, area.top, right, rowVisible ? top : area.bottom, o);
    place(bands.colBelow, left, rowVisible ? bottom : area.bottom, right, area.bottom, o);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(draw);
  }

  // ---- change tracking ----------------------------------------------------

  function watchGrid(grid) {
    if (observedGrid === grid) return;
    if (observer) observer.disconnect();
    observedGrid = grid;
    observer = new MutationObserver((records) => {
      // Ignore our own overlay updates.
      for (const r of records) {
        if (!root || !root.contains(r.target)) return schedule();
      }
    });
    observer.observe(grid, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }

  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  document.addEventListener('mouseup', schedule, true);
  document.addEventListener('keyup', schedule, true);

  // The grid container can be replaced (e.g. switching sheet tabs), so
  // re-check periodically. This also notices when this copy has gone stale.
  const poll = setInterval(() => {
    if (isStale()) return;
    const grid = document.getElementById('waffle-grid-container');
    if (grid && grid !== observedGrid) schedule();
  }, 1000);

  window.__multicellAlive = () => !isStale();

  function teardown() {
    if (dead) return;
    dead = true;
    clearInterval(poll);
    if (frame) cancelAnimationFrame(frame);
    if (observer) observer.disconnect();
    window.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
    document.removeEventListener('mouseup', schedule, true);
    document.removeEventListener('keyup', schedule, true);
    if (root) root.remove();
    root = null;
  }

  // ---- settings -----------------------------------------------------------

  function applySettings(next) {
    settings = { ...DEFAULTS, ...next };
    schedule();
  }

  const hasStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;
  if (hasStorage) {
    chrome.storage.sync.get(DEFAULTS, applySettings);
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.preview && changes.preview.newValue) {
        // Live values streamed by the popup while a control is dragged.
        return applySettings({ ...settings, ...changes.preview.newValue });
      }
      if (area !== 'sync') return;
      const next = { ...settings };
      for (const [k, v] of Object.entries(changes)) next[k] = v.newValue;
      applySettings(next);
    });
  } else {
    // Injected outside the extension (testing): expose a setter.
    window.__multicellSet = (s) => applySettings({ ...settings, ...s });
    schedule();
  }
})();
