import { toSendLink } from './sendLink.js';

// "*.youtube.com" also matches youtube.com itself. toSendLink still rejects anything that isn't one video.
const YOUTUBE_PAGES = ['*://*.youtube.com/*'];
const VIDEO_LINKS = ['*://*.youtube.com/watch*', '*://*.youtube.com/shorts/*', '*://youtu.be/*'];

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'send',
    title: 'Send to Grapplehook',
    contexts: ['link'],
    documentUrlPatterns: YOUTUBE_PAGES,
    targetUrlPatterns: VIDEO_LINKS,
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const { quality = 'best' } = await chrome.storage.local.get('quality');
  const link = toSendLink(info.linkUrl, quality);
  if (!link || !tab) return;
  // The service worker can't open a link itself, so hand it to the tab. With Grapplehook installed the
  // browser shows its "open with" prompt and the page stays put.
  // shortcut: without a handler Firefox swaps the page for an error page; issue #3 adds the help page.
  await chrome.tabs.update(tab.id, { url: link });
});
