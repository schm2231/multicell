# Privacy Policy for Multicell

_Last updated: November 24, 2026_

Multicell ("the extension") is a Chrome extension that highlights the row and column of the selected cell in Google Sheets.

## Summary

Multicell does not collect, transmit, sell or share any personal data. It makes no network requests.

## What the extension accesses

- **Google Sheets pages** (`https://docs.google.com/spreadsheets/*`). The extension reads the on-screen position of the selection outline that Google Sheets draws, so that it can draw a highlight in the same place. It does not read, store or send the contents of your spreadsheets, cell values, file names or any account information.
- **Extension storage** (`storage` permission). The extension saves its own settings: whether the highlight is on, whether it follows multi-cell selections, the highlight color and the opacity. These are stored with Chrome's `chrome.storage.sync`, which Chrome may sync across your signed-in browsers through your Google account under [Google's privacy policy](https://policies.google.com/privacy). While you drag a slider, a temporary copy of the color and opacity is kept in `chrome.storage.local` on your device.

- **Scripting** (`scripting` permission). Used only to re-run the extension's own packaged script in Google Sheets tabs that were open when the extension was installed or updated.

## What the extension does not do

- It does not collect analytics, telemetry or crash reports.
- It does not use cookies or tracking technologies.
- It does not send any data to the developer or any third party.
- It does not load or run remote code.

## Data retention and deletion

All settings stay in your browser. Removing the extension from Chrome deletes them.

## Changes

If this policy changes, the updated version will be published at this same address with a new "Last updated" date.

## Contact

Questions about this policy can be raised as an issue on the project's GitHub repository: https://github.com/schm2231/multicell/issues
