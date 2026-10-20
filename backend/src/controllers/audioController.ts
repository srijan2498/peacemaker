import { Request, Response } from 'express';
import { UserAudioPreference } from '../models/UserAudioPreference.js';
import { AUDIO_CATALOG } from '../shared/index.js';
import { getCuratedJamendoCatalog, searchJamendoLive } from '../services/jamendoService.js';

export async function getAudioCatalog(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    let favorites: string[] = [];

    if (userId) {
      const pref = await UserAudioPreference.findOne({ userId });
      if (pref) {
        favorites = pref.favoriteTrackIds || [];
      }
    }

    // Fetch live curated peaceful Jamendo music
    const jamendoTracks = await getCuratedJamendoCatalog();

    // Map procedural soundscapes
    const proceduralTracks = AUDIO_CATALOG.map(t => ({
      ...t,
      source: 'generator' as const
    }));

    // Combine Jamendo studio tracks + procedural soundscapes
    const combinedTracks = [...jamendoTracks, ...proceduralTracks];

    const categories = [
      'All',
      'Meditation & Yoga',
      'Study & Focus',
      'Deep Sleep',
      'Calm & Relaxation'
    ];

    const tracksWithFav = combinedTracks.map(track => ({
      ...track,
      isFavorite: favorites.includes(track.id)
    }));

    res.status(200).json({
      success: true,
      data: {
        tracks: tracksWithFav,
        categories
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audio catalog.' });
  }
}

export async function searchJamendo(req: Request, res: Response): Promise<void> {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      res.status(200).json({ success: true, data: { tracks: [] } });
      return;
    }

    const userId = req.user?.id;
    let favorites: string[] = [];

    if (userId) {
      const pref = await UserAudioPreference.findOne({ userId });
      if (pref) {
        favorites = pref.favoriteTrackIds || [];
      }
    }

    const tracks = await searchJamendoLive(query, 12);
    const tracksWithFav = tracks.map(t => ({
      ...t,
      isFavorite: favorites.includes(t.id)
    }));

    res.status(200).json({
      success: true,
      data: { tracks: tracksWithFav }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to search Jamendo tracks.' });
  }
}

export async function getUserAudioPreferences(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    let pref = await UserAudioPreference.findOne({ userId });
    if (!pref) {
      pref = await UserAudioPreference.create({
        userId,
        favoriteTrackIds: [],
        recentTrackIds: [],
        savedMixes: []
      });
    }

    res.status(200).json({
      success: true,
      data: {
        favorites: pref.favoriteTrackIds,
        recent: pref.recentTrackIds,
        savedMixes: pref.savedMixes
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch audio preferences.' });
  }
}

export async function toggleFavorite(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { trackId } = req.params;

    let pref = await UserAudioPreference.findOne({ userId });
    if (!pref) {
      pref = await UserAudioPreference.create({ userId, favoriteTrackIds: [trackId], savedMixes: [] });
    } else {
      const idx = pref.favoriteTrackIds.indexOf(trackId);
      if (idx > -1) {
        pref.favoriteTrackIds.splice(idx, 1);
      } else {
        pref.favoriteTrackIds.push(trackId);
      }
      await pref.save();
    }

    const isFavorite = pref.favoriteTrackIds.includes(trackId);

    res.status(200).json({
      success: true,
      message: isFavorite ? 'Added to favorites 🤍' : 'Removed from favorites',
      data: { isFavorite, favorites: pref.favoriteTrackIds }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to toggle favorite.' });
  }
}

export async function saveMix(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { name, tracks } = req.body;

    let pref = await UserAudioPreference.findOne({ userId });
    if (!pref) {
      pref = await UserAudioPreference.create({ userId, savedMixes: [] });
    }

    const newMix = {
      id: `mix_${Date.now()}`,
      name,
      tracks,
      createdAt: new Date()
    };

    pref.savedMixes.push(newMix as any);
    await pref.save();

    res.status(201).json({
      success: true,
      message: 'Ambient sound mix saved! 🎧',
      data: { mix: newMix }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to save ambient mix.' });
  }
}

export async function deleteMix(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;
    const { mixId } = req.params;

    const pref = await UserAudioPreference.findOne({ userId });
    if (!pref) {
      res.status(404).json({ success: false, message: 'Mix not found.' });
      return;
    }

    pref.savedMixes = pref.savedMixes.filter(m => m.id !== mixId) as any;
    await pref.save();

    res.status(200).json({ success: true, message: 'Ambient mix removed.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete mix.' });
  }
}
