import { toSendLink } from './sendLink.js';

// "*.youtube.com" also matches youtube.com itself. toSendLink still rejects anything that isn't one video.
const YOUTUBE_PAGES = ['*://*.youtube.com/*'];
const VIDEO_LINKS = ['*://*.youtube.com/watch*', '*://*.youtube.com/shorts/*', '*://youtu.be/*'];
const openHelp = () => chrome.tabs.create({ url: chrome.runtime.getURL('src/help.html') });

chrome.runtime.onInstalled.addListener(({ reason }) => {
  // Only on first install, so the note isn't shown again after updates.
  if (reason === 'install') openHelp();
  // onInstalled also fires on browser updates, when the menu may still exist; clear it to avoid a duplicate-id error.
  chrome.contextMenus.removeAll(() => chrome.contextMenus.create({
    id: 'send',
    title: 'Send to Grapplehook',
    contexts: ['link'],
    documentUrlPatterns: YOUTUBE_PAGES,
    targetUrlPatterns: VIDEO_LINKS,
  }));
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { quality = 'best' } = await chrome.storage.local.get('quality');
  const link = toSendLink(info.linkUrl, quality);
  if (!link || !tab) return;
  // The service worker can't open a link itself, so hand it to the tab. With Grapplehook installed the
  // browser shows its "open with" prompt and the page stays put.
  // shortcut: a page with a beforeunload guard shows "leave page?", and without a handler Firefox swaps
  // the page for an error page without telling us; the popup avoids both. Detecting that needs the
  // webNavigation permission (a "browsing activity" warning), so only an outright rejection opens help;
  // add webNavigation if users report silent failures from the menu.
  try {
    await chrome.tabs.update(tab.id, { url: link });
  } catch {
    await openHelp();
  }
});
