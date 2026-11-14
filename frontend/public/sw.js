// Optimas service worker. The app works online only (the server holds the one
// database), so nothing is kept here: every page and file comes straight from
// the server, and a new release reaches every phone and browser at once. The
// worker stays so the app can be installed.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  // Earlier versions kept a copy of the app on the device, which could go on
  // showing an old release after a deploy. Remove every copy.
  const cleaned = (async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    await self.clients.claim();
    return keys.length > 0;
  })();
  event.waitUntil(cleaned);
  // A page that was opened from one of those copies is running old code: load
  // it again, this time from the server. Happens once per device. Not part of
  // waitUntil: the reload is answered by this worker, which only answers once
  // it has finished activating.
  cleaned
    .then(async (hadCopies) => {
      if (!hadCopies) return;
      const pages = await self.clients.matchAll({ type: 'window' });
      for (const page of pages) page.navigate(page.url).catch(() => undefined);
    })
    .catch(() => undefined);
});

const OFFLINE_PAGE =
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Optimas</title><body style="margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;' +
  'justify-content:center;gap:16px;background:#0033A1;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px">' +
  '<h1 style="margin:0;font-size:22px;font-weight:600">No internet connection</h1>' +
  '<p style="margin:0;opacity:.8">Optimas needs a connection. Check it and try again.</p>' +
  '<a href="" style="padding:12px 28px;border-radius:999px;background:#fff;color:#0033A1;font-weight:600;text-decoration:none">Try again</a></body>';

/** The page, always the server's current copy: never one the browser kept. */
async function freshPage(request) {
  try {
    const response = await fetch(request.url, { cache: 'no-store', credentials: 'same-origin' });
    // A page request may not be answered with a followed redirect
    if (!response.redirected) return response;
  } catch {
    // Fall through to the ordinary request
  }
  try {
    return await fetch(request);
  } catch {
    return new Response(OFFLINE_PAGE, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
}

self.addEventListener('fetch', (event) => {
  // Only pages are answered here (phones on older Chrome need that to offer
  // "Install app"). Files and API calls go to the server untouched.
  if (event.request.mode === 'navigate') event.respondWith(freshPage(event.request));
});
