# Grapplehook-Extension
Browser extension that sends a YouTube video to the Grapplehook desktop app. Chromium and Firefox, Manifest V3.

On a YouTube or YouTube Music video page, click the toolbar button, pick a quality and press **Send to Grapplehook**. The Extension opens `grapplehook://open?url=<video>&quality=<best|audio|height>` (the contract in ADR 0003 of [Grapplehook](https://github.com/kitsupanic/Grapplehook)) and Grapplehook 0.3.0 or later does the download. On pages that aren't a single video, the button is greyed out.

On a youtube.com video page there's also a Grapplehook button next to Like and Share, and on YouTube Music one in the player bar next to Like, Dislike and ⋮. Click it to send the video at the quality it shows, or open its arrow to pick a quality: picking one sends right away and makes it the new default.

On any YouTube page you can also right-click a video link and choose **Send to Grapplehook**. It sends that video with the quality you last picked in the popup (Best if you haven't picked one).

If Send does nothing or the browser shows an error, Grapplehook is probably missing or older than 0.3.0. The popup's **Nothing happened?** link opens a help page with a download link; the same page opens once when you first install the Extension.

Firefox needs version 121 or later.

## Load it by hand

**Chrome, Edge, Brave, Arc:** open `chrome://extensions` (or `edge://extensions`), turn on **Developer mode**, click **Load unpacked** and pick this folder.

**Firefox:** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…** and pick `manifest.json` in this folder. Temporary add-ons are removed when Firefox quits.

## Run the tests

Needs Node 20 or later. No install step.

```bash
npm test
```
