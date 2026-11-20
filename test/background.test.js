import { test } from 'node:test';
import assert from 'node:assert/strict';

// Fake just the chrome APIs background.js touches.
const stored = {};
const updates = [];
let onClicked;
globalThis.chrome = {
  runtime: { onInstalled: { addListener() {} } },
  contextMenus: { create() {}, removeAll() {}, onClicked: { addListener: (fn) => (onClicked = fn) } },
  storage: { local: { get: async (key) => (key in stored ? { [key]: stored[key] } : {}) } },
  tabs: { update: async (id, props) => updates.push([id, props.url]) },
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
