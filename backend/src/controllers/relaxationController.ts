import { Request, Response } from 'express';
import {
  getGuidedMeditations,
  getStoriesCatalogue,
  fetchFullBookById,
  saveUserReadingProgress,
  getUserReadingProgress
} from '../services/relaxationService.js';

export async function listMeditations(req: Request, res: Response): Promise<void> {
  try {
    const meditations = await getGuidedMeditations();
    res.status(200).json({
      success: true,
      data: {
        meditations,
        total: meditations.length,
        source: 'CozyNest Mindfulness & Breathwork Sanctuary'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function listGutenbergStories(req: Request, res: Response): Promise<void> {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const category = typeof req.query.category === 'string' ? req.query.category : 'bedtime';
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '24'), 10) || 24;

    const result = await getStoriesCatalogue({
      query,
      category,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getStoryDetails(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    const book = await fetchFullBookById(id);
    if (!book) {
      res.status(404).json({ success: false, message: 'Story not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { book }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function saveReadingProgress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const progress = await saveUserReadingProgress(userId, req.body);
    res.status(200).json({
      success: true,
      data: { progress }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export async function getReadingProgress(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const progress = await getUserReadingProgress(userId);
    res.status(200).json({
      success: true,
      data: { progress }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
