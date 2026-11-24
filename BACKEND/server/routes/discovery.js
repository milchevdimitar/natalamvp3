const videoCache = new Map();
const pendingVideos = new Map();
const videoRequests = new Map();
const minute = 60_000;
const videoCacheTime = 30 * minute;
let cityWindow = { until: 0, count: 0 };

function allowVideoRequest(accountId, now) {
  for (const [id, entry] of videoRequests) if (entry.until <= now) videoRequests.delete(id);
  const entry = videoRequests.get(accountId) || { until: now + minute, count: 0 };
  videoRequests.set(accountId, entry);
  return ++entry.count <= 24;
}

async function requestVideos(key, query, pageToken) {
  const url = new URL('https://www.googleapis.com/youtube/v3/search');
  url.search = new URLSearchParams({
    key, q: query, part: 'snippet', type: 'video', videoDuration: 'short', videoEmbeddable: 'true',
    videoSyndicated: 'true', maxResults: '10', order: 'relevance',
    ...(pageToken && { pageToken }),
  });
  const response = await fetch(url, { signal: AbortSignal.timeout(7000), redirect: 'error' });
  if (!response.ok) throw new Error('YouTube search failed.');
  const result = await response.json();
  return { items: result.items || [], nextPageToken: result.nextPageToken };
}

async function searchVideos(req, res) {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const pageToken = req.query.pageToken ?? '';
  if (!query || query.length > 180 || typeof pageToken !== 'string' || !/^[\w-]{0,256}$/.test(pageToken)) {
    return res.status(400).json({ error: 'Invalid video search.' });
  }
  const key = process.env.YOUTUBE_API_KEY?.trim() || process.env.EXPO_PUBLIC_YOUTUBE_API_KEY?.trim();
  if (!key) return res.status(503).json({ error: 'Video search is not configured.' });
  const now = Date.now();
  if (!allowVideoRequest(String(req.account._id), now)) return res.status(429).json({ error: 'Try again in a minute.' });

  const cacheKey = JSON.stringify([query, pageToken]);
  const cached = videoCache.get(cacheKey);
  if (cached?.until > now) return res.json(cached.data);
  videoCache.delete(cacheKey);

  let pending = pendingVideos.get(cacheKey);
  if (!pending) {
    if (pendingVideos.size >= 16) return res.status(503).json({ error: 'Video search is busy.' });
    pending = requestVideos(key, query, pageToken).then((data) => {
      if (videoCache.size >= 256) videoCache.delete(videoCache.keys().next().value);
      videoCache.set(cacheKey, { data, until: Date.now() + videoCacheTime });
      return data;
    }).finally(() => pendingVideos.delete(cacheKey));
    pendingVideos.set(cacheKey, pending);
  }
  try {
    return res.json(await pending);
  } catch {
    return res.status(502).json({ error: 'Could not load videos.' });
  }
}

async function searchCities(req, res) {
  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  if (name.length < 2 || name.length > 120) return res.status(400).json({ error: 'Invalid city search.' });
  const now = Date.now();
  if (cityWindow.until <= now) cityWindow = { until: now + minute, count: 0 };
  if (++cityWindow.count > 180) return res.status(429).json({ error: 'City search is busy.' });
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({ name, count: '15', language: 'en', format: 'json' });
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000), redirect: 'error' });
    if (!response.ok) throw new Error('Geocoding failed.');
    const data = await response.json();
    return res.json({ results: data.results || [] });
  } catch {
    return res.status(502).json({ error: 'Could not load cities.' });
  }
}

module.exports = { searchVideos, searchCities };
