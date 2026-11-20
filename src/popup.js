import { toSendLink } from './sendLink.js';

const select = document.getElementById('quality');
const sendButton = document.getElementById('send');
const note = document.getElementById('note');

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const { quality } = await chrome.storage.local.get('quality');
if (quality && [...select.options].some((o) => o.value === quality)) select.value = quality;

// activeTab exposes the URL of any page; toSendLink gives null for everything but a single YouTube video.
const canSend = toSendLink(tab?.url, select.value) !== null;
sendButton.disabled = !canSend;
note.hidden = canSend;

select.addEventListener('change', () => chrome.storage.local.set({ quality: select.value }));

sendButton.addEventListener('click', () => {
  const link = toSendLink(tab.url, select.value);
  // Open from the popup, not the tab: navigating the tab fires the page's "leave page?" prompt
  // and, with no handler installed, replaces the video with an error page (seen in Firefox).
  if (!link) return;
  // Firefox draws its "open with Grapplehook?" prompt inside the popup; grow it so the buttons fit.
  // shortcut: fixed size guessed from one screenshot; measure if the prompt still clips.
  Object.assign(document.body.style, { width: '480px', minHeight: '320px' });
  location.href = link;
});
