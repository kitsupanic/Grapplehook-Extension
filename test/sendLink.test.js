import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSendLink } from '../src/sendLink.js';

const link = (videoUrl, q) => `grapplehook://open?url=${encodeURIComponent(videoUrl)}&quality=${q}`;

test('watch page sends the video, percent-encoded, with the quality', () => {
  assert.equal(
    toSendLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '720'),
    'grapplehook://open?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&quality=720',
  );
});

test('every youtube host keeps its host for watch pages', () => {
  for (const host of ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']) {
    assert.equal(toSendLink(`https://${host}/watch?v=abc_-123`, 'best'), link(`https://${host}/watch?v=abc_-123`, 'best'));
  }
});

test('playlist, index, time and tracking params are stripped', () => {
  assert.equal(
    toSendLink('https://www.youtube.com/watch?v=X1&list=PL123&index=3&t=42s&pp=abc&feature=share', '1080'),
    link('https://www.youtube.com/watch?v=X1', '1080'),
  );
});

test('music watch page with audio only', () => {
  assert.equal(
    toSendLink('https://music.youtube.com/watch?v=M1&list=RDAMVM', 'audio'),
    link('https://music.youtube.com/watch?v=M1', 'audio'),
  );
});

test('youtu.be short link drops si=', () => {
  assert.equal(toSendLink('https://youtu.be/Y1?si=track', '480'), link('https://youtu.be/Y1', '480'));
});

test('shorts page', () => {
  assert.equal(toSendLink('https://www.youtube.com/shorts/S1?feature=share', '360'), link('https://www.youtube.com/shorts/S1', '360'));
});

test('pages that are not a single video give null', () => {
  for (const url of [
    'https://www.youtube.com/playlist?list=PL123',
    'https://www.youtube.com/@somechannel',
    'https://www.youtube.com/channel/UC123',
    'https://www.youtube.com/',
    'https://www.youtube.com/results?search_query=cats',
    'https://music.youtube.com/',
    'https://www.youtube.com/watch',
    'https://youtu.be/',
    'https://example.com/watch?v=X1',
    'https://notyoutube.com/watch?v=X1',
    'https://www.youtube.com.evil.com/watch?v=X1',
    'javascript:alert(1)',
    'not a url',
    undefined,
  ]) {
    assert.equal(toSendLink(url, 'best'), null, String(url));
  }
});
