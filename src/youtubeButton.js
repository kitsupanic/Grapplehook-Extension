// Adds a "send to Grapplehook" split button under a YouTube video and in the YouTube Music player bar.
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

// YouTube's own colour variables reach into the shadow roots, so the pill follows its light and dark themes.
const CSS = `
.pill { display: flex; height: 100%; border-radius: 9999px; font-family: Roboto, Arial, sans-serif; background: var(--yt-spec-badge-chip-background, rgba(0,0,0,.05)); color: var(--yt-spec-text-primary, #0f0f0f); }
button { all: unset; box-sizing: border-box; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; font-family: Roboto, Arial, sans-serif; font-size: 14px; font-weight: 500; white-space: nowrap; }
.pill > button:hover, .pill > button[aria-expanded="true"] { background: var(--yt-spec-10-percent-layer, rgba(0,0,0,.1)); }
.send { padding: 0 12px 0 10px; border-radius: 9999px 0 0 9999px; }
.send svg { color: #ff8a3d; }
.more { padding: 0 8px 0 6px; border-radius: 0 9999px 9999px 0; position: relative; }
.more::before { content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 1px; background: var(--yt-spec-10-percent-layer, rgba(0,0,0,.1)); }
button:focus-visible { outline: 2px solid var(--yt-spec-call-to-action, #065fd4); outline-offset: 2px; }
.menu { position: fixed; z-index: 2300; min-width: 200px; padding: 8px 0; border-radius: 12px; font-family: Roboto, Arial, sans-serif; background: var(--yt-spec-menu-background, #fff); color: var(--yt-spec-text-primary, #0f0f0f); box-shadow: 0 4px 32px rgba(0,0,0,.1); }
.menu[hidden] { display: none; }
.menu p { margin: 0; padding: 4px 16px 8px; font-size: 12px; color: var(--yt-spec-text-secondary, #606060); }
.menu button { display: flex; width: 100%; height: 36px; padding: 0 16px 0 12px; gap: 12px; font-weight: 400; }
.menu button:hover, .menu button:focus-visible { background: var(--yt-spec-10-percent-layer, rgba(0,0,0,.1)); outline: none; }
.menu button svg { visibility: hidden; }
.menu button[aria-checked="true"] svg { visibility: visible; }
`;

// Where the button goes on each site. Styles are inline because the page's CSS outranks :host rules.
const SITES = {
  // Inside the Like/Share group, so it gets that group's centring; same size and gap as its buttons.
  'www.youtube.com': {
    row: 'ytd-watch-metadata #top-level-buttons-computed',
    style: 'height: 40px; margin: 0 0 0 8px;',
  },
  // After Like, Dislike and the ⋮ menu in the player bar. Music has no --yt-spec colours, so map its own:
  // bare like its icon buttons, with a hover well, on the dark player bar.
  'music.youtube.com': {
    row: 'ytmusic-player-bar .middle-controls-buttons',
    style: 'height: var(--ytmusic-button-height, 36px); margin: 0 16px 0 0;',
    vars: `--yt-spec-badge-chip-background: transparent; --yt-spec-10-percent-layer: rgba(255,255,255,.1);
      --yt-spec-text-primary: var(--ytmusic-text-primary, #fff); --yt-spec-text-secondary: var(--ytmusic-text-secondary, #aaa);
      --yt-spec-menu-background: var(--ytmusic-menu-popup-background, #212121); --yt-spec-call-to-action: #fff;`,
  },
};
const site = SITES[location.hostname];

let quality = 'best';

function build() {
  const host = el('div', { id: HOST_ID, style: `display: flex; flex: none; ${site.style} ${site.vars ?? ''}` });
  const root = host.attachShadow({ mode: 'open' });
  const name = el('span', {});
  const sendButton = el('button', { class: 'send' }, hook(), name);
  const more = el('button', { class: 'more', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-label': 'Pick a Grapplehook quality' }, chevron());
  root.append(el('style', {}, CSS), el('div', { class: 'pill' }, sendButton, more));

  // The menu lives in its own host on <body>: YouTube's action row clips overflow, and the Music player bar's
  // transform would make a fixed menu inside it position against the bar instead of the window.
  const menuHost = el('div', { style: site.vars ?? '' });
  const menuRoot = menuHost.attachShadow({ mode: 'open' });
  const items = QUALITIES.map(([v, text]) => el('button', { role: 'menuitemradio', 'data-quality': v }, check(), text));
  const menu = el('div', { class: 'menu', role: 'menu', hidden: '' }, el('p', {}, 'Send to Grapplehook'), ...items);
  menuRoot.append(el('style', {}, CSS), menu);
  document.body.append(menuHost);

  const render = () => {
    name.textContent = label(quality);
    sendButton.title = `Send to Grapplehook (${label(quality)})`;
    sendButton.setAttribute('aria-label', sendButton.title);
    for (const item of items) item.setAttribute('aria-checked', item.dataset.quality === quality);
  };
  const toggle = (open) => {
    menu.hidden = !open;
    more.setAttribute('aria-expanded', open);
    if (!open) return;
    // Below the button, or above it when the button is near the bottom (the Music player bar).
    const r = more.getBoundingClientRect();
    const below = r.bottom + 8 + menu.offsetHeight <= innerHeight;
    Object.assign(menu.style, {
      top: `${below ? r.bottom + 8 : r.top - 8 - menu.offsetHeight}px`,
      right: `${document.documentElement.clientWidth - r.right}px`,
    });
    (items.find((i) => i.dataset.quality === quality) ?? items[0]).focus();
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
    const i = items.indexOf(menuRoot.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    }
    if (e.key === 'Escape') { toggle(false); more.focus(); }
  });
  document.addEventListener('click', (e) => {
    const path = e.composedPath();
    if (!path.includes(host) && !path.includes(menuHost)) toggle(false);
  });
  // A fixed menu would drift from its button, so scrolling closes it.
  addEventListener('scroll', () => menu.hidden || toggle(false), { passive: true });
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.quality) { quality = changes.quality.newValue ?? 'best'; render(); }
  });
  render();
  return host;
}

// YouTube is a single-page app that re-renders on navigation, so re-add the button when it goes missing.
let host;
function ensure() {
  const row = document.querySelector(site.row);
  if (!row) return;
  if (host?.parentElement !== row) row.append(host ??= build());
  // The Music player bar stays up while you browse other pages, where there's no single video to send.
  const display = location.pathname === '/watch' ? 'flex' : 'none';
  if (host.style.display !== display) host.style.display = display;
}

chrome.storage.local.get('quality').then((stored) => {
  quality = stored.quality ?? 'best';
  ensure();
  new MutationObserver(ensure).observe(document.body, { childList: true, subtree: true });
});
