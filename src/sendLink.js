// Link contract: ADR 0003 in kitsupanic/Grapplehook. Don't rename or change fields.
const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'];
const VIDEO_ID = /^[A-Za-z0-9_-]+$/;

/** Single-video URL with every extra parameter dropped, or null if the page isn't one video. */
function videoUrl(pageUrl) {
  let u;
  try {
    u = new URL(pageUrl);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;

  if (u.hostname === 'youtu.be') {
    const id = u.pathname.slice(1);
    return VIDEO_ID.test(id) ? `https://youtu.be/${id}` : null;
  }
  if (!YOUTUBE_HOSTS.includes(u.hostname)) return null;

  if (u.pathname === '/watch') {
    const id = u.searchParams.get('v');
    return id && VIDEO_ID.test(id) ? `https://${u.hostname}/watch?v=${id}` : null;
  }
  const shorts = u.pathname.match(/^\/shorts\/([^/]+)\/?$/);
  return shorts && VIDEO_ID.test(shorts[1]) ? `https://${u.hostname}/shorts/${shorts[1]}` : null;
}

export function toSendLink(pageUrl, quality) {
  const video = videoUrl(pageUrl);
  if (!video) return null;
  return `grapplehook://open?url=${encodeURIComponent(video)}&quality=${encodeURIComponent(quality)}`;
}
