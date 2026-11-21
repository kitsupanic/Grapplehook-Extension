// Adds a "send to Grapplehook" split button to the action row under a YouTube video.
// Classic script (content scripts can't be modules); the background script builds and opens the link.

// Same list as popup.html; keep them in step.
const QUALITIES = [
  ['best', 'Best'], ['2160', '2160p'], ['1440', '1440p'], ['1080', '1080p'],
  ['720', '720p'], ['480', '480p'], ['360', '360p'], ['audio', 'Audio only'],
];
const label = (value) => (QUALITIES.find(([v]) => v === value) ?? QUALITIES[0])[1];
const HOST_ID = 'grapplehook-button';

// YouTube enforces Trusted Types, so nothing here goes through innerHTML: elements are built one by one.
const SVG_NS = 'http://www.w3.org/2000/svg';
function svg([tag, attrs, ...kids]) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...kids.map(svg));
  return node;
}
const icon = (width, ...kids) => svg(['svg', {
  viewBox: '0 0 24 24', width: 20, height: 20, 'aria-hidden': 'true', fill: 'none', stroke: 'currentColor',
  'stroke-width': width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
}, ...kids]);
// The app's hook mark (HookMark.svelte in Grapplehook).
const hook = () => icon(1.75,
  ['circle', { cx: 12, cy: 3.2, r: 1.4 }],
  ['path', { d: 'M11.9 4.6c-.2 1.1-.6 1.7-.5 2.4.2.6 2 1.3 2.1 2.7.1 1.2-.7 1.9-1.6 2.2' }],
  ['g', { transform: 'translate(11.8 11.8) rotate(-18)' },
    ['path', { d: 'M-1.6 -2.4H1.6L3.8 .6V9.6H-3.8V.6Z' }], ['circle', { r: 1.1 }]]);
const chevron = () => icon(1.75, ['path', { d: 'm7 10 5 5 5-5' }]);
const check = () => icon(2, ['path', { d: 'm5 12.5 4.5 4.5L19 7.5' }]);

function el(tag, attrs, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...kids);
  return node;
}

// YouTube's own colour variables reach into the shadow root, so the pill follows its light and dark themes.
const CSS = `
:host { display: inline-flex; align-self: center; height: 36px; margin-left: 8px; flex: none; font-family: Roboto, Arial, sans-serif; }
.pill { display: flex; height: 36px; border-radius: 18px; background: var(--yt-spec-badge-chip-background, rgba(0,0,0,.05)); color: var(--yt-spec-text-primary, #0f0f0f); }
button { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-size: 14px; font-weight: 500; line-height: 36px; white-space: nowrap; }
.pill > button:hover, .pill > button[aria-expanded="true"] { background: var(--yt-spec-10-percent-layer, rgba(0,0,0,.1)); }
.send { padding: 0 12px 0 10px; border-radius: 18px 0 0 18px; }
.send svg { color: #ff8a3d; }
.more { padding: 0 8px 0 6px; border-radius: 0 18px 18px 0; position: relative; }
.more::before { content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 1px; background: var(--yt-spec-10-percent-layer, rgba(0,0,0,.1)); }
button:focus-visible { outline: 2px solid var(--yt-spec-call-to-action, #065fd4); outline-offset: 2px; }
/* Fixed, not absolute: YouTube's action row clips overflow. */
.menu { position: fixed; z-index: 2300; min-width: 200px; padding: 8px 0; border-radius: 12px; background: var(--yt-spec-menu-background, #fff); color: var(--yt-spec-text-primary, #0f0f0f); box-shadow: 0 4px 32px rgba(0,0,0,.1); }
.menu[hidden] { display: none; }
.menu p { margin: 0; padding: 4px 16px 8px; font-size: 12px; color: var(--yt-spec-text-secondary, #606060); }
.menu button { display: flex; width: 100%; height: 36px; padding: 0 16px 0 12px; gap: 12px; font-weight: 400; }
.menu button:hover, .menu button:focus-visible { background: var(--yt-spec-10-percent-layer, rgba(0,0,0,.1)); outline: none; }
.menu button svg { visibility: hidden; }
.menu button[aria-checked="true"] svg { visibility: visible; }
`;

let quality = 'best';

function build() {
  const host = document.createElement('div');
  host.id = HOST_ID;
  const root = host.attachShadow({ mode: 'open' });
  const name = el('span', {});
  const sendButton = el('button', { class: 'send' }, hook(), name);
  const more = el('button', { class: 'more', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-label': 'Pick a Grapplehook quality' }, chevron());
  const items = QUALITIES.map(([v, text]) => el('button', { role: 'menuitemradio', 'data-quality': v }, check(), text));
  const menu = el('div', { class: 'menu', role: 'menu', hidden: '' }, el('p', {}, 'Send to Grapplehook'), ...items);
  root.append(el('style', {}, CSS), el('div', { class: 'pill' }, sendButton, more), menu);

  const render = () => {
    name.textContent = label(quality);
    sendButton.title = `Send to Grapplehook (${label(quality)})`;
    sendButton.setAttribute('aria-label', sendButton.title);
    for (const item of items) item.setAttribute('aria-checked', item.dataset.quality === quality);
  };
  const toggle = (open) => {
    menu.hidden = !open;
    more.setAttribute('aria-expanded', open);
    const r = more.getBoundingClientRect();
    Object.assign(menu.style, { top: `${r.bottom + 8}px`, right: `${document.documentElement.clientWidth - r.right}px` });
    if (open) (items.find((i) => i.dataset.quality === quality) ?? items[0]).focus();
  };
  const send = () => chrome.runtime.sendMessage({ send: quality });

  sendButton.addEventListener('click', send);
  more.addEventListener('click', () => toggle(menu.hidden));
  // Picking a quality sends right away and becomes the default for the button, the popup and the menu.
  menu.addEventListener('click', (e) => {
    const item = e.target.closest('button');
    if (!item) return;
    quality = item.dataset.quality;
    chrome.storage.local.set({ quality });
    render();
    toggle(false);
    send();
  });
  menu.addEventListener('keydown', (e) => {
    const i = items.indexOf(root.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { toggle(false); more.focus(); }
  });
  document.addEventListener('click', (e) => { if (!e.composedPath().includes(host)) toggle(false); });
  // A fixed menu would drift from its button, so scrolling closes it.
  addEventListener('scroll', () => menu.hidden || toggle(false), { passive: true });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.quality) { quality = changes.quality.newValue ?? 'best'; render(); }
  });
  render();
  return host;
}

// YouTube is a single-page app that re-renders the action row on navigation, so re-add the button when it goes missing.
let host;
function ensure() {
  const row = document.querySelector('ytd-watch-metadata #top-level-buttons-computed');
  if (!row || host?.previousElementSibling === row) return;
  host ??= build();
  row.after(host);
}

chrome.storage.local.get('quality').then((stored) => {
  quality = stored.quality ?? 'best';
  ensure();
  new MutationObserver(ensure).observe(document.body, { childList: true, subtree: true });
});
