# Grapplehook-Extension
Browser extension that sends a YouTube video to the Grapplehook desktop app. Chromium and Firefox, Manifest V3.

On a YouTube or YouTube Music video page, click the toolbar button, pick a quality and press **Send to Grapplehook**. The Extension opens `grapplehook://open?url=<video>&quality=<best|audio|height>` (the contract in ADR 0003 of [Grapplehook](https://github.com/kitsupanic/Grapplehook)) and Grapplehook 0.3.0 or later does the download. On pages that aren't a single video, the button is greyed out.

## Load it by hand

**Chrome, Edge, Brave, Arc:** open `chrome://extensions` (or `edge://extensions`), turn on **Developer mode**, click **Load unpacked** and pick this folder.

**Firefox:** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…** and pick `manifest.json` in this folder. Temporary add-ons are removed when Firefox quits.

## Run the tests

Needs Node 20 or later. No install step.

```bash
npm test
```
