# Grapplehook-Extension
Browser extension that sends a YouTube video to the Grapplehook desktop app. Chromium and Firefox, Manifest V3.

On a YouTube or YouTube Music video page, click the toolbar button, pick a quality and press **Send to Grapplehook**. The Extension opens `grapplehook://open?url=<video>&quality=<best|audio|height>` (the contract in ADR 0003 of [Grapplehook](https://github.com/kitsupanic/Grapplehook)) and Grapplehook 0.3.0 or later does the download. On pages that aren't a single video, the button is greyed out.

On a youtube.com video page there's also a Grapplehook button next to Like and Share, and on YouTube Music one in the player bar next to Like, Dislike and ⋮ (it sends the track that's playing, whichever page you're on). Song lists on YouTube Music (artist pages, albums, playlists, search) also get a hook button on each row, next to ⋮ when you hover it; it sends that song at your saved quality. Click it to send the video at the quality it shows, or open its arrow to pick a quality: picking one sends right away and makes it the new default.

On any YouTube page you can also right-click a video link and choose **Send to Grapplehook**. It sends that video with the quality you last picked in the popup (Best if you haven't picked one).

If Send does nothing or the browser shows an error, Grapplehook is probably missing or older than 0.3.0. The popup's **Nothing happened?** link opens a help page with a download link; the same page opens once when you first install the Extension.

## Install

<p>
  <a href="https://addons.mozilla.org/addon/grapplehook/"><img src="docs/readme/extension-firefox.svg" height="64" alt="Add to Firefox (Firefox 121 or later)"></a>
  <a href="https://chromewebstore.google.com/detail/foxified/cldmemdnllncchfahbcnjijheaolemfk"><img src="docs/readme/extension-chromium.svg" height="64" alt="Get Foxified for Chrome, Edge, Brave and Arc"></a>
</p>

On **Chrome, Edge, Brave or Arc**, add [Foxified](https://chromewebstore.google.com/detail/foxified/cldmemdnllncchfahbcnjijheaolemfk) first. It's a free extension that runs Firefox add-ons. Then open [Grapplehook on Firefox Add-ons](https://addons.mozilla.org/addon/grapplehook/) and add it through Foxified. Rather not use Foxified? [Load it by hand](#load-it-by-hand).

## Privacy

The Extension collects no data and sends nothing anywhere. It reads the address of YouTube pages to build the link, keeps your last picked quality in the browser's own extension storage, and hands the link to Grapplehook on your computer. It has no access to sites other than YouTube and YouTube Music.

## Load it by hand

For development, or to skip Foxified on a Chromium browser.

**Chrome, Edge, Brave, Arc:** open `chrome://extensions` (or `edge://extensions`), turn on **Developer mode**, click **Load unpacked** and pick this folder.

**Firefox:** open `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on…** and pick `manifest.json` in this folder. Temporary add-ons are removed when Firefox quits.

## Run the tests

Needs Node 20 or later. No install step.

```bash
npm test
```

## Build the store zip

```bash
npm run build
```

This writes `dist/grapplehook-extension-<version>.zip` with only what the browser needs (`manifest.json`, `src/`, `icons/`, `LICENSE`). The same zip goes to the Chrome Web Store and Firefox Add-ons: Chrome reads `background.service_worker`, Firefox reads `background.scripts`. Bump `version` in `manifest.json` before each upload, since both stores refuse a version they've already seen.
