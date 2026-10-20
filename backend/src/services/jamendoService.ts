import type { AudioTrackSummary } from '../shared/index.js';

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID || 'db9569db';
const JAMENDO_BASE_URL = 'https://api.jamendo.com/v3.0';

interface JamendoTrackRaw {
  id: string;
  name: string;
  duration: number;
  artist_name: string;
  album_name?: string;
  album_image?: string;
  image?: string;
  audio: string;
  license_ccurl?: string;
}

// In-memory cache for curated category tracks (30 mins TTL)
const cache: {
  curatedTracks: AudioTrackSummary[] | null;
  curatedTimestamp: number;
  searchCache: Map<string, { tracks: AudioTrackSummary[]; timestamp: number }>;
} = {
  curatedTracks: null,
  curatedTimestamp: 0,
  searchCache: new Map()
};

const CACHE_TTL_MS = 30 * 60 * 1000;

// Curated category configs for peaceful relax music
const CATEGORY_TAG_MAP: {
  category: string;
  tags: string;
  search?: string;
  icon: string;
  gradient: string;
}[] = [
  {
    category: 'Meditation & Yoga',
    tags: 'meditation',
    search: 'meditation',
    icon: '🧘',
    gradient: 'from-amber-500/20 to-orange-500/20'
  },
  {
    category: 'Meditation & Yoga',
    tags: 'yoga',
    search: 'yoga',
    icon: '🪷',
    gradient: 'from-purple-500/20 to-indigo-500/20'
  },
  {
    category: 'Study & Focus',
    tags: 'ambient',
    search: 'study',
    icon: '📚',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    category: 'Study & Focus',
    tags: 'instrumental',
    search: 'focus',
    icon: '☕',
    gradient: 'from-amber-600/20 to-stone-500/20'
  },
  {
    category: 'Deep Sleep',
    tags: 'sleep',
    search: 'sleep',
    icon: '🌙',
    gradient: 'from-indigo-600/20 to-violet-900/20'
  },
  {
    category: 'Calm & Relaxation',
    tags: 'relaxation',
    search: 'relax',
    icon: '🍃',
    gradient: 'from-emerald-500/20 to-teal-600/20'
  },
  {
    category: 'Calm & Relaxation',
    tags: 'chillout',
    search: 'peaceful',
    icon: '🌸',
    gradient: 'from-rose-400/20 to-pink-500/20'
  }
];

// Fallback high-quality curated tracks if network is temporarily unreachable
const FALLBACK_JAMENDO_TRACKS: AudioTrackSummary[] = [
  {
    id: 'jamendo_2275222',
    title: 'mindful Flowing Serenity',
    category: 'Meditation & Yoga',
    description: 'Serene meditative flow by AudioAmbi • 4 mins',
    soundType: 'jamendo_stream',
    icon: '🧘',
    gradient: 'from-amber-500/20 to-orange-500/20',
    durationSeconds: 236,
    artistName: 'AudioAmbi',
    albumImage: 'https://usercontent.jamendo.com?type=album&id=613315&width=300&trackid=2275222',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=2275222&format=mp31&from=J53WLzjU8WgSkAho5%2FEy2g%3D%3D%7Ca746ynDm2Y7meNxdf9Osvg%3D%3D',
    source: 'jamendo',
    jamendoId: '2275222'
  },
  {
    id: 'jamendo_1524524',
    title: 'Ambient Bass & Calm Solitude',
    category: 'Meditation & Yoga',
    description: 'Deep resonant meditation bells by Abydos Music • 2 mins',
    soundType: 'jamendo_stream',
    icon: '🪷',
    gradient: 'from-purple-500/20 to-indigo-500/20',
    durationSeconds: 133,
    artistName: 'Abydos Music',
    albumImage: 'https://usercontent.jamendo.com?type=album&id=389194&width=300&trackid=1524524',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1524524&format=mp32&from=T4MeX9h77NM58Y%2BetNHzbQ%3D%3D%7C6C9GSEAemvhK2wUbISmAIA%3D%3D',
    source: 'jamendo',
    jamendoId: '1524524'
  },
  {
    id: 'jamendo_1533532',
    title: 'Healing Meditation Chimes',
    category: 'Meditation & Yoga',
    description: 'Chakra balancing meditation soundscape by AudioSphere • 1 min',
    soundType: 'jamendo_stream',
    icon: '🔔',
    gradient: 'from-teal-500/20 to-emerald-500/20',
    durationSeconds: 69,
    artistName: 'AudioSphere',
    albumImage: 'https://usercontent.jamendo.com?type=album&id=430020&width=300&trackid=1533532',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1533532&format=mp32&from=23Csg2ornYV6dcdyNpHmaw%3D%3D%7CoHTxcxRXhzOu8DwXAqazSA%3D%3D',
    source: 'jamendo',
    jamendoId: '1533532'
  },
  {
    id: 'jamendo_1353112',
    title: 'Penumbra Warm Study Flow',
    category: 'Study & Focus',
    description: 'Focused gentle instrumental by Entre Ilhas • 1.5 mins',
    soundType: 'jamendo_stream',
    icon: '📚',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    durationSeconds: 75,
    artistName: 'Entre Ilhas',
    albumImage: 'https://usercontent.jamendo.com?type=album&id=309095&width=300&trackid=1353112',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1353112&format=mp32',
    source: 'jamendo',
    jamendoId: '1353112'
  },
  {
    id: 'jamendo_1222864',
    title: 'The Song of The Blue Dolphin',
    category: 'Deep Sleep',
    description: 'Oceanic sleep lullaby by Andy Blackwood • 5 mins',
    soundType: 'jamendo_stream',
    icon: '🌙',
    gradient: 'from-indigo-600/20 to-violet-900/20',
    durationSeconds: 321,
    artistName: 'Andy Blackwood',
    albumImage: 'https://usercontent.jamendo.com?type=album&id=284920&width=300&trackid=1222864',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1222864&format=mp32',
    source: 'jamendo',
    jamendoId: '1222864'
  },
  {
    id: 'jamendo_184583',
    title: 'The Drifter Night Drift',
    category: 'Deep Sleep',
    description: 'Cosmic sleep drone by Instrumental Avenue • 6 mins',
    soundType: 'jamendo_stream',
    icon: '✨',
    gradient: 'from-slate-700/20 to-indigo-900/20',
    durationSeconds: 368,
    artistName: 'Instrument Avenue',
    albumImage: 'https://usercontent.jamendo.com?type=album&id=39120&width=300&trackid=184583',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=184583&format=mp32',
    source: 'jamendo',
    jamendoId: '184583'
  },
  {
    id: 'jamendo_1911306',
    title: 'Good Morning Calm Lounge',
    category: 'Calm & Relaxation',
    description: 'Peaceful morning relaxation by EKOUT • 4 mins',
    soundType: 'jamendo_stream',
    icon: '🌸',
    gradient: 'from-rose-400/20 to-pink-500/20',
    durationSeconds: 251,
    artistName: 'EKOUT',
    albumImage: 'https://usercontent.jamendo.com?type=album&id=461020&width=300&trackid=1911306',
    audioUrl: 'https://prod-1.storage.jamendo.com/?trackid=1911306&format=mp32',
    source: 'jamendo',
    jamendoId: '1911306'
  }
];

function transformRawTrack(
  track: JamendoTrackRaw,
  category: string,
  icon: string,
  gradient: string
): AudioTrackSummary {
  const durationMins = Math.round(track.duration / 60);
  const durationLabel = durationMins > 0 ? `${durationMins} min${durationMins > 1 ? 's' : ''}` : `${track.duration}s`;

  return {
    id: `jamendo_${track.id}`,
    title: track.name || 'Peaceful Soundscape',
    category,
    description: `${category} by ${track.artist_name || 'Independent Artist'} • ${durationLabel}`,
    soundType: 'jamendo_stream',
    icon,
    gradient,
    durationSeconds: track.duration || 180,
    artistName: track.artist_name || 'Jamendo Artist',
    albumImage: track.album_image || track.image || '',
    audioUrl: track.audio,
    source: 'jamendo',
    jamendoId: track.id,
    licenseUrl: track.license_ccurl || 'http://creativecommons.org/licenses/by-nc-nd/3.0/'
  };
}

/**
 * Fetch tracks from Jamendo API for a specific tag or search term
 */
export async function fetchJamendoTracks(params: {
  tags?: string;
  search?: string;
  limit?: number;
  category?: string;
  icon?: string;
  gradient?: string;
}): Promise<AudioTrackSummary[]> {
  try {
    const url = new URL(`${JAMENDO_BASE_URL}/tracks/`);
    url.searchParams.set('client_id', JAMENDO_CLIENT_ID);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', String(params.limit || 6));
    url.searchParams.set('audioformat', 'mp32');

    if (params.search) {
      url.searchParams.set('search', params.search);
    } else if (params.tags) {
      url.searchParams.set('tags', params.tags);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Jamendo API returned status ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (data.headers?.status !== 'success' || !Array.isArray(data.results)) {
      console.warn('Jamendo API response unsuccessful or missing results:', data.headers);
      return [];
    }

    const category = params.category || 'Calm & Relaxation';
    const icon = params.icon || '🎧';
    const gradient = params.gradient || 'from-indigo-500/20 to-purple-500/20';

    return (data.results as JamendoTrackRaw[])
      .filter(t => Boolean(t.audio && t.name))
      .map(t => transformRawTrack(t, category, icon, gradient));
  } catch (err: any) {
    console.error('Error fetching from Jamendo API:', err.message);
    return [];
  }
}

/**
 * Get curated Jamendo peaceful catalog across Study, Sleep, Focus, Meditation, Yoga, Relax
 */
export async function getCuratedJamendoCatalog(): Promise<AudioTrackSummary[]> {
  const now = Date.now();
  if (cache.curatedTracks && now - cache.curatedTimestamp < CACHE_TTL_MS) {
    return cache.curatedTracks;
  }

  try {
    const trackPromises = CATEGORY_TAG_MAP.map(item =>
      fetchJamendoTracks({
        tags: item.tags,
        search: item.search,
        limit: 4,
        category: item.category,
        icon: item.icon,
        gradient: item.gradient
      })
    );

    const results = await Promise.allSettled(trackPromises);
    const combinedTracks: AudioTrackSummary[] = [];
    const seenIds = new Set<string>();

    for (const res of results) {
      if (res.status === 'fulfilled') {
        for (const track of res.value) {
          if (!seenIds.has(track.id)) {
            seenIds.add(track.id);
            combinedTracks.push(track);
          }
        }
      }
    }

    if (combinedTracks.length > 0) {
      cache.curatedTracks = combinedTracks;
      cache.curatedTimestamp = now;
      return combinedTracks;
    }
  } catch (err: any) {
    console.error('Failed to assemble curated Jamendo catalog:', err.message);
  }

  // Fallback to static high-res Jamendo records if API failed or returned 0
  return FALLBACK_JAMENDO_TRACKS;
}

/**
 * Search Jamendo live by query
 */
export async function searchJamendoLive(query: string, limit: number = 12): Promise<AudioTrackSummary[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const now = Date.now();
  const cached = cache.searchCache.get(cleanQ);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.tracks;
  }

  const tracks = await fetchJamendoTracks({
    search: cleanQ,
    limit,
    category: 'Calm & Relaxation',
    icon: '✨',
    gradient: 'from-amber-500/20 to-teal-500/20'
  });

  cache.searchCache.set(cleanQ, { tracks, timestamp: now });
  return tracks;
}
