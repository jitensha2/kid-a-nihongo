# Kid あ

A small study app for Japanese 1–3 vocabulary and kanji. Plain HTML/CSS/JS, no build step.
Progress is stored only on the phone (localStorage); nothing is sent anywhere.

## Files
- `index.html`, `styles.css`, `app.js`: the app
- `data.js`: word and kanji lists, generated from the spreadsheet (don't edit by hand)
- `sw.js`, `manifest.webmanifest`, `icons/`: offline support and home-screen install
- `tools/`: scripts for updating the data, rendering icons, and local testing

## Updating the word lists
1. Update `Japanese Vocab by Year.xlsx` (one folder up).
2. Run `powershell -ExecutionPolicy Bypass -File tools\build-data.ps1`
3. Bump `VERSION` in `sw.js` so phones pick up the change.

## Testing locally
`powershell -ExecutionPolicy Bypass -File tools\serve.ps1`, then open http://localhost:8787

## Hosting
Netlify serves this folder as-is (`netlify.toml`), at kid-a-nihongo.netlify.app.
