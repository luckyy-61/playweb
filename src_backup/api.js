// ═══════════════════════════════════════════════════════════════════════
//  PLAY Web — API Service
//  Search:  YouTube  via Piped API (CORS-safe)
//  Trending (Home):  JioSaavn  (fast, clean, local Vite proxy)
//  Stream Priority:
//    - For YouTube Search results: Try YouTube first → Fallback to JioSaavn
//    - For JioSaavn Trending: Try JioSaavn first → Fallback to YouTube
// ═══════════════════════════════════════════════════════════════════════

const JIOSAAVN_BASE = '/api/api.php';

// Public Piped instances for YouTube search and fallback
const PIPED_INSTANCES = [
  'https://api.piped.private.coffee',
  'https://pipedapi.kavin.rocks',
  'https://piped-api.garudalinux.org',
  'https://api.piped.projectsegfau.lt'
];

let currentInstanceIdx = 0;

function getActiveInstance() {
  return PIPED_INSTANCES[currentInstanceIdx];
}

function rotateInstance() {
  currentInstanceIdx = (currentInstanceIdx + 1) % PIPED_INSTANCES.length;
}

export function hasCredentials() {
  return true; // No login credentials required
}

// Helper to fetch Piped API data with timeout and automatic instance rotation
async function fetchWithRetry(path, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const instance = getActiveInstance();
    const url = `${instance}${path}`;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000);
      
      const res = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn(`⚠️ Request failed on ${instance}:`, err.message);
      rotateInstance();
      if (i === retries - 1) throw err;
    }
  }
}

// Helper to clean up messy YouTube video titles for JioSaavn search
function cleanQuery(title, artist) {
  let clean = title;
  
  // Remove content in brackets [...] or (...)
  clean = clean.replace(/\[[^\]]*\]/g, ''); 
  clean = clean.replace(/\([^)]*\)/g, '');  
  
  // Remove common YouTube buzzwords
  const keywords = [
    'official audio', 'official music video', 'official video', 'official lyric video',
    'official', 'lyric video', 'lyrics', 'video', 'audio', 'hq', 'hd', 'ft\\.', 'feat\\.',
    '4k', 'mv', 'high quality', 'w/ lyrics', 'with lyrics', 'full song', 'full audio',
    'full video', 'video song', 'audio song', 'visualizer', 'extended mix'
  ];
  
  keywords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    clean = clean.replace(regex, '');
  });

  // Replace special characters and dividers with spaces
  clean = clean.replace(/[|,&/\\_]/g, ' ');

  // If there's a hyphen, split it
  if (clean.includes('-')) {
    clean = clean.split('-').map(p => p.trim()).join(' ');
  }

  // Remove multiple spaces and trim
  clean = clean.replace(/\s+/g, ' ').trim();
  
  // List of known record labels to ignore
  const recordLabels = [
    't-series', 'tseries', 'sony music', 'sonymusic', 'zee music', 'zeemusic', 'yrf', 
    'yash raj films', 'aditya music', 'speed records', 'eros now', 'tips', 'lahari music', 
    'saregama', 'times music', 'wave music', 'shemaroo', 't-series bhakti', 'speedrecords'
  ];

  const artistLower = (artist || '').toLowerCase().trim();
  const isLabel = recordLabels.some(label => artistLower.includes(label) || label.includes(artistLower));

  // Append artist if not a record label and not already in the title
  if (artist && !isLabel && !clean.toLowerCase().includes(artistLower)) {
    clean = `${clean} ${artist}`;
  }
  
  return clean;
}

// ── Search YouTube via Piped (tagged with isYouTube: true) ───────────────
export async function searchSongs(query) {
  try {
    const data = await fetchWithRetry(`/search?q=${encodeURIComponent(query)}&filter=music_songs`);
    const items = data.items || [];
    
    return items
      .filter(item => item.type === 'stream')
      .map(item => ({
        id: item.url.replace('/watch?v=', ''),
        title: item.title,
        artist: item.uploaderName || 'Unknown Artist',
        album: 'YouTube Music',
        image: item.thumbnail || '',
        smallImage: item.thumbnail || '',
        durationMs: (item.duration || 180) * 1000,
        isYouTube: true,
      }));
  } catch (err) {
    console.error('Search failed:', err);
    return [];
  }
}

// ── Trending: JioSaavn (Home screen, tagged with isJioSaavn: true) ────────
export async function getTrending() {
  try {
    const queries = ['top hits hindi', 'billboard hot 100', 'punjabi hits 2024'];
    const query = queries[Math.floor(Math.random() * queries.length)];
    
    const url = `${JIOSAAVN_BASE}?__call=autocomplete.get&query=${encodeURIComponent(query)}&_format=json&_marker=0&ctx=android`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = data?.songs?.data || [];
    
    return items.map(item => ({
      id: item.id,
      title: decodeHTMLEntities(item.title),
      artist: decodeHTMLEntities(item.description || 'Unknown Artist'),
      album: decodeHTMLEntities(item.album || ''),
      image: (item.image || '').replace('50x50', '500x500').replace('150x150', '500x500'),
      smallImage: (item.image || '').replace('50x50', '150x150'),
      durationMs: 180000,
      isJioSaavn: true,
    }));
  } catch (err) {
    console.error('Trending fetch failed:', err);
    return [];
  }
}

// ── JioSaavn stream URL fetcher ───────────────────────────────────────────
async function getJioSaavnStream(songId) {
  const detailUrl = `${JIOSAAVN_BASE}?__call=song.getDetails&pids=${songId}&_format=json&_marker=0&ctx=android`;
  const detailRes = await fetch(detailUrl);
  if (!detailRes.ok) throw new Error(`JioSaavn details HTTP ${detailRes.status}`);
  const detailData = await detailRes.json();
  const songDetail = detailData?.[songId];
  if (!songDetail?.encrypted_media_url) throw new Error('No JioSaavn details found');

  const authUrl = `${JIOSAAVN_BASE}?__call=song.generateAuthToken&url=${encodeURIComponent(songDetail.encrypted_media_url)}&bitrate=320&api_version=4&_format=json&ctx=android&_marker=0`;
  const authRes = await fetch(authUrl);
  if (!authRes.ok) throw new Error(`JioSaavn auth HTTP ${authRes.status}`);
  const authData = await authRes.json();
  if (!authData?.auth_url) throw new Error('JioSaavn auth failed');

  return {
    streamUrl: authData.auth_url,
    duration: parseInt(songDetail.duration || '0', 10),
    source: 'jiosaavn',
  };
}

// ── YouTube Piped stream fetcher ──────────────────────────────────────────
async function getYouTubeStream(videoId, instance) {
  const res = await fetch(`${instance}/streams/${videoId}`, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Piped HTTP ${res.status}`);
  const data = await res.json();
  const audioStreams = data.audioStreams || [];
  const sorted = [...audioStreams].sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  const best = sorted.find(s => s.mimeType?.includes('audio')) || sorted[0];
  if (!best?.url) throw new Error('No audio URL found');

  return {
    streamUrl: best.url,
    duration: data.duration || 180,
    source: 'youtube',
  };
}

// ── YouTube search fallback (when JioSaavn trending track fails to play) ───
async function getYouTubeStreamWithFallback(query) {
  let lastError;
  for (let i = 0; i < PIPED_INSTANCES.length; i++) {
    const instance = getActiveInstance();
    try {
      const searchRes = await fetch(`${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`, { signal: AbortSignal.timeout(5000) });
      if (!searchRes.ok) throw new Error(`Piped search HTTP ${searchRes.status}`);
      const searchData = await searchRes.json();
      const video = searchData.items?.find(item => item.type === 'stream');
      if (!video) throw new Error('No YouTube video found');
      
      const videoId = video.url.replace('/watch?v=', '');
      return await getYouTubeStream(videoId, instance);
    } catch (err) {
      console.warn(`Piped instance ${instance} failed:`, err.message);
      rotateInstance();
      lastError = err;
    }
  }
  throw lastError || new Error('YouTube fallback failed');
}

// ── Master getStreamUrl ───────────────────────────────────────────────────
export async function getStreamUrl(track) {
  if (track.isJioSaavn) {
    // ──────── FLOW A: Track is from JioSaavn (Trending) ────────
    // Try JioSaavn direct stream first
    try {
      const result = await getJioSaavnStream(track.id);
      console.log('✅ Streaming from JioSaavn CDN (Trending)');
      return result;
    } catch (err) {
      console.warn('JioSaavn CDN stream failed, trying YouTube fallback...', err.message);
    }

    // Fallback: YouTube search and stream (via Piped)
    try {
      const query = `${track.title} ${track.artist} official audio`;
      const result = await getYouTubeStreamWithFallback(query);
      console.log('✅ Streaming from YouTube via Piped (fallback)');
      return result;
    } catch (err) {
      console.error('All streaming backends failed');
      throw new Error('This song is temporarily unavailable to stream.');
    }
  } else {
    // ──────── FLOW B: Track is from YouTube (Search result) ────────
    // Try YouTube direct stream first (since track.id is already the YouTube Video ID!)
    let lastError;
    for (let i = 0; i < PIPED_INSTANCES.length; i++) {
      const instance = getActiveInstance();
      try {
        const result = await getYouTubeStream(track.id, instance);
        console.log('✅ Streaming from YouTube via Piped (Primary)');
        return result;
      } catch (err) {
        console.warn(`Piped stream fetch failed on ${instance}:`, err.message);
        rotateInstance();
        lastError = err;
      }
    }

    // Fallback: JioSaavn background search & stream
    console.warn('YouTube stream failed, trying JioSaavn CDN fallback...');
    try {
      const query = cleanQuery(track.title, track.artist);
      const url = `${JIOSAAVN_BASE}?__call=autocomplete.get&query=${encodeURIComponent(query)}&_format=json&_marker=0&ctx=android`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`JioSaavn search HTTP ${res.status}`);
      const data = await res.json();
      const songs = data?.songs?.data || [];
      if (songs.length === 0) throw new Error('Not found on JioSaavn');
      
      const result = await getJioSaavnStream(songs[0].id);
      console.log('✅ Streaming from JioSaavn CDN (fallback)');
      return result;
    } catch (err) {
      console.error('JioSaavn fallback failed:', err.message);
    }

    throw lastError || new Error('This song is temporarily unavailable to stream.');
  }
}

function decodeHTMLEntities(str) {
  const txt = document.createElement('textarea');
  txt.innerHTML = str;
  return txt.value;
}
