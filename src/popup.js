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

sendButton.addEventListener('click', async () => {
  const link = toSendLink(tab.url, select.value);
  if (!link) return;
  await chrome.tabs.update(tab.id, { url: link });
  window.close();
});
