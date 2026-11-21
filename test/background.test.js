import { test } from 'node:test';
import assert from 'node:assert/strict';

// Fake just the chrome APIs background.js touches.
const stored = {};
const updates = [];
const created = [];
let onClicked, onInstalled, onMessage, updateFails = false;
globalThis.chrome = {
  runtime: {
    onInstalled: { addListener: (fn) => (onInstalled = fn) },
    onMessage: { addListener: (fn) => (onMessage = fn) },
    getURL: (path) => `ext://id/${path}`,
  },
  contextMenus: { create() {}, removeAll() {}, onClicked: { addListener: (fn) => (onClicked = fn) } },
  storage: { local: { get: async (key) => (key in stored ? { [key]: stored[key] } : {}) } },
  tabs: {
    update: async (id, props) => {
      if (updateFails) throw new Error('Illegal URL');
      updates.push([id, props.url]);
    },
    create: async (props) => created.push(props.url),
  },
};
await import('../src/background.js');

const click = (linkUrl) => onClicked({ linkUrl }, { id: 7 });

test('menu click sends the link with the last-picked quality', async () => {
  updates.length = 0;
  stored.quality = '720';
  await click('https://www.youtube.com/watch?v=X1&list=PL1&pp=abc');
  assert.deepEqual(updates, [[7, 'grapplehook://open?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DX1&quality=720']]);
});

test('menu click uses best when no quality was picked yet', async () => {
  updates.length = 0;
  delete stored.quality;
  await click('https://youtu.be/Y1?si=t');
  assert.deepEqual(updates, [[7, 'grapplehook://open?url=https%3A%2F%2Fyoutu.be%2FY1&quality=best']]);
});

test('menu click on a playlist-only or channel link sends nothing', async () => {
  updates.length = 0;
  await click('https://www.youtube.com/watch?list=PL1');
  await click('https://www.youtube.com/@somechannel');
  assert.deepEqual(updates, []);
});

test('first install opens the help page, updates do not', () => {
  created.length = 0;
  onInstalled({ reason: 'install' });
  onInstalled({ reason: 'update' });
  onInstalled({ reason: 'browser_update' });
  assert.deepEqual(created, ['ext://id/src/help.html']);
});

test('menu click opens the help page when the browser rejects the link', async () => {
  created.length = 0;
  updateFails = true;
  try {
    await click('https://youtu.be/Y1');
  } finally {
    updateFails = false;
  }
  assert.deepEqual(created, ['ext://id/src/help.html']);
});

test('page button sends its own tab at the quality it names', async () => {
  updates.length = 0;
  onMessage({ send: 'audio' }, { tab: { id: 9, url: 'https://www.youtube.com/watch?v=Z1&t=42s' } });
  await new Promise((r) => setTimeout(r));
  assert.deepEqual(updates, [[9, 'grapplehook://open?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DZ1&quality=audio']]);
});

test('page button on a page that is not one video sends nothing', async () => {
  updates.length = 0;
  onMessage({ send: 'best' }, { tab: { id: 9, url: 'https://www.youtube.com/' } });
  onMessage({ other: true }, { tab: { id: 9, url: 'https://www.youtube.com/watch?v=Z1' } });
  await new Promise((r) => setTimeout(r));
  assert.deepEqual(updates, []);
});
