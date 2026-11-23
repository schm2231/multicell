# Multicell

A Chrome extension that gives Google Sheets a "focus cell" effect: the row and column of your selection are highlighted so you can follow them across a big sheet.

- Highlights the active cell's row and column
- Optional: follow multi-cell selections (highlights every selected row and column)
- Color picker and opacity slider, with live preview in the sheet
- Toggle from the toolbar popup or with **Alt+Shift+Q** (change it at `chrome://extensions/shortcuts`). A second shortcut for "follow multi-cell selections" can be assigned there too.
- Settings are saved with `chrome.storage.sync`, so they apply in every tab and survive restarts

## Install (unpacked)

1. Clone or download this repo.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick the repo folder.
4. Open any Google Sheet and click a cell.

## How it works

Google Sheets draws cells on a `<canvas>`, so there are no cell elements to style. The content script (`src/content.js`) reads the on-screen position of the selection outlines Sheets draws as DOM elements (`.active-cell-border` and `.selection-border`), then paints translucent bands over the cell area inside `#waffle-grid-container`. A `MutationObserver` plus scroll and resize listeners keep it in sync.

This depends on Google's internal class names. If Google changes them, the highlight will stop appearing (it fails safe: nothing breaks in Sheets). The selectors are all in `cellArea()` and `targetRect()` in `src/content.js`.

## Files

| Path | What it is |
| --- | --- |
| `manifest.json` | Manifest V3 config, permissions, shortcuts |
| `src/content.js` | Draws the highlight on Sheets pages |
| `src/background.js` | Handles keyboard shortcuts and the "off" badge |
| `src/popup.*` | Toolbar popup: switches, color, opacity |
| `icons/` | Icons (regenerate with `python3 tools/make_icons.py icons`) |
| `PRIVACY.md` | Privacy policy for the Web Store listing |
| `store/listing.md` | Text to paste into the Web Store dashboard |
| `tools/package.sh` | Builds `dist/multicell-<version>.zip` for upload |

## Publishing

1. Run `tools/package.sh`.
2. Pay the one-time $5 fee at the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) and upload the zip.
3. Fill in the listing from `store/listing.md`, set visibility to **Unlisted** if it's only for friends, and submit for review.
