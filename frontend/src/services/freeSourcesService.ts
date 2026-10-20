import { api } from './api';
import {
  TheMealDbRecipe,
  GuidedMeditationItem,
  GutenbergBookItem
} from 'cozynest-shared';

export const freeSourcesService = {
  // 1. Recipes — TheMealDB
  searchRecipes: async (params?: string | {
    q?: string;
    category?: string;
    cuisine?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    recipes: TheMealDbRecipe[];
    total: number;
    page: number;
    totalPages: number;
    categories: string[];
    cuisines: string[];
    source: string;
  }> => {
    const queryParams = typeof params === 'string' ? { q: params } : params;
    const res = await api.get('/recipes', { params: queryParams });
    return res.data.data;
  },

  getRecipeById: async (id: string): Promise<TheMealDbRecipe> => {
    const res = await api.get(`/recipes/${id}`);
    return res.data.data.recipe;
  },

  // 2. Guided Meditation & Project Gutenberg Stories
  getGuidedMeditations: async (): Promise<{ meditations: GuidedMeditationItem[]; source: string }> => {
    const res = await api.get('/relaxation/meditations');
    return res.data.data;
  },

  getGutenbergStories: async (params?: {
    q?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    stories: GutenbergBookItem[];
    total: number;
    source: string;
    page: number;
    totalPages: number;
  }> => {
    const res = await api.get('/relaxation/stories', { params });
    return res.data.data;
  },

  getFullStory: async (id: string): Promise<GutenbergBookItem> => {
    const res = await api.get(`/relaxation/stories/${encodeURIComponent(id)}`);
    return res.data.data.book;
  },

  saveReadingProgress: async (progress: any): Promise<void> => {
    await api.post('/relaxation/progress', progress);
  },

  getReadingProgress: async (): Promise<any | null> => {
    const res = await api.get('/relaxation/progress');
    return res.data.data.progress;
  }
};
