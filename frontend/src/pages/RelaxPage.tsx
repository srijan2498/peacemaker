import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAudioStore } from '../stores/audioStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import {
  Play,
  Pause,
  Volume2,
  Moon,
  Heart,
  Sliders,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  X,
  Trees,
  Wind,
  Coffee,
  BookOpen
} from 'lucide-react';
import type { AudioTrackSummary } from 'cozynest-shared';

// Child Tab Components
import { GuidedMeditationTab } from '../components/relaxation/GuidedMeditationTab';
import { GutenbergStoriesTab } from '../components/relaxation/GutenbergStoriesTab';
import { JazzMusicTab } from '../components/relaxation/JazzMusicTab';

export const RelaxPage: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    pauseTrack,
    togglePlay,
    volume,
    setVolume,
    sleepTimerMinutes,
    sleepTimerSecondsLeft,
    setSleepTimer,
    cancelSleepTimer,
    mixerTracks,
    addMixerTrack,
    removeMixerTrack,
    setMixerTrackVolume,
    clearMixer
  } = useAudioStore();

  const [activeRelaxTab, setActiveRelaxTab] = useState<'nature' | 'meditation' | 'jazz' | 'stories'>('nature');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [mixName, setMixName] = useState('');

  // Fetch Catalog
  const { data } = useQuery<{ tracks: AudioTrackSummary[]; categories: string[] }>({
    queryKey: ['audio-catalog'],
    queryFn: async () => {
      const res = await api.get('/audio/catalog');
      return res.data.data;
    }
  });

  // Fetch Preferences & Saved Mixes
  const { data: prefData } = useQuery({
    queryKey: ['audio-preferences'],
    queryFn: async () => {
      const res = await api.get('/audio/preferences');
      return res.data.data;
    }
  });

  const toggleFavMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await api.post(`/audio/favorites/${trackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['audio-preferences'] });
    }
  });

  const saveMixMutation = useMutation({
    mutationFn: async () => {
      if (!mixName.trim()) throw new Error('Mix name required');
      await api.post('/audio/mixes', {
        name: mixName.trim(),
        tracks: mixerTracks
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-preferences'] });
      toast.success('Ambient mix saved! 🎧');
      setMixName('');
    }
  });

  const deleteMixMutation = useMutation({
    mutationFn: async (mixId: string) => {
      await api.delete(`/audio/mixes/${mixId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-preferences'] });
      toast.success('Mix removed.');
    }
  });

  const tracks = data?.tracks || [];
  const categories = Array.from(new Set(['All', ...(data?.categories || [])]));
  const savedMixes = prefData?.savedMixes || [];

  const filteredTracks =
    selectedCategory === 'All'
      ? tracks
      : tracks.filter(t => t.category === selectedCategory);

  const minutesLeft = sleepTimerSecondsLeft ? Math.ceil(sleepTimerSecondsLeft / 60) : null;

  return (
    <div className="space-y-8">
      {/* Relaxation Sanctuary Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
            Relaxation & Mindfulness Sanctuary
          </h2>
          <p className="text-xs sm:text-sm text-cozy-muted">
            Curated free and open relaxation resources: nature soundscapes, breathwork, licensed jazz, and classic bedtime literature.
          </p>
        </div>

        {/* Global Toolbar: Sleep Timer & Ambient Mixer */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsSleepModalOpen(true)}
            className="rounded-2xl text-xs gap-1.5"
          >
            <Moon className="w-3.5 h-3.5 text-purple-600" />
            {minutesLeft !== null ? `Timer: ${minutesLeft}m` : 'Sleep Timer'}
          </Button>

          <Button
            variant="soft"
            size="sm"
            onClick={() => setIsMixerOpen(true)}
            className="rounded-2xl text-xs gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            Mixer ({mixerTracks.length})
          </Button>
        </div>
      </div>

      {/* Main Sanctuary Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 overflow-x-auto">
        <button
          onClick={() => setActiveRelaxTab('nature')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeRelaxTab === 'nature'
              ? 'bg-purple-600 text-white shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <Trees className="w-4 h-4" />
          <span>Nature Sounds & Freesound Mixer</span>
        </button>

        <button
          onClick={() => setActiveRelaxTab('meditation')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeRelaxTab === 'meditation'
              ? 'bg-purple-600 text-white shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <Wind className="w-4 h-4" />
          <span>Guided Meditation & Breathwork</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 font-extrabold uppercase">
            Pacer
          </span>
        </button>

        <button
          onClick={() => setActiveRelaxTab('jazz')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeRelaxTab === 'jazz'
              ? 'bg-purple-600 text-white shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>Smooth Jazz & Lo-Fi Lounge</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-500 font-extrabold uppercase">
            Licensed
          </span>
        </button>

        <button
          onClick={() => setActiveRelaxTab('stories')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeRelaxTab === 'stories'
              ? 'bg-purple-600 text-white shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Bedtime Stories & Gutenberg Books</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 font-extrabold uppercase">
            Audiobook
          </span>
        </button>
      </div>

      {/* ================= TAB 1: NATURE SOUNDS & MIXER ================= */}
      {activeRelaxTab === 'nature' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sanctuary Hero Banner */}
          <div className="relative overflow-hidden rounded-4xl bg-gradient-to-r from-purple-200 via-pink-100 to-sky-200 dark:from-purple-950/60 dark:via-indigo-950/50 dark:to-slate-900/60 p-8 sm:p-12 text-center border border-purple-100/60 dark:border-purple-800/30 shadow-soft-md">
            <div className="max-w-xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-cozy-darkCard/80 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-cozy-lavender" />
                Freesound Ambience & Procedural Soundscapes
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
                Nature Soundscapes & Ambient Rain
              </h2>

              <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted leading-relaxed">
                Forest birds, summer rain, roaring thunder, twilight ocean waves, and whispering pines.
                Combine multiple sound layers simultaneously in the multi-channel mixer.
              </p>

              {/* Master Circular / Big Player */}
              {currentTrack && (
                <div className="pt-2 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-white dark:bg-cozy-darkCard shadow-soft-lg flex items-center justify-center text-4xl mb-3 relative animate-calm-pulse">
                    {currentTrack.icon || '🎧'}
                    <button
                      onClick={togglePlay}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cozy-lavender text-white flex items-center justify-center shadow-soft-sm hover:scale-105 active:scale-95 transition-transform"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                  </div>

                  <h4 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-cozy-muted">{currentTrack.description}</p>

                  {/* Master Volume Slider */}
                  <div className="flex items-center gap-2 mt-4 w-48">
                    <Volume2 className="w-4 h-4 text-cozy-muted" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={e => setVolume(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-white/80 rounded-lg appearance-none cursor-pointer accent-cozy-lavender"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-cozy-lavender text-white shadow-soft-sm'
                    : 'bg-white dark:bg-cozy-darkCard text-cozy-muted hover:text-cozy-text border border-purple-50 dark:border-purple-900/30'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sound Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTracks.map(track => {
              const isThisPlaying = currentTrack?.id === track.id && isPlaying;
              const isInMixer = mixerTracks.some(m => m.id === track.id);

              return (
                <Card
                  key={track.id}
                  className={`p-5 space-y-3 cursor-pointer transition-all ${
                    isThisPlaying
                      ? 'border-cozy-lavender ring-2 ring-cozy-lavender/30 bg-purple-50/30 dark:bg-purple-950/20'
                      : 'bg-white dark:bg-cozy-darkCard hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-cozy-lavender-soft/80 dark:bg-purple-900/40 flex items-center justify-center text-2xl shrink-0">
                        {track.icon || '🎧'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText truncate">
                          {track.title}
                        </h4>
                        <span className="text-[10px] text-cozy-muted uppercase tracking-wider font-semibold">
                          {track.category}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        toggleFavMutation.mutate(track.id);
                      }}
                      className="p-1.5 rounded-full text-cozy-muted hover:text-rose-500 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${track.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-cozy-muted line-clamp-2 leading-relaxed">
                    {track.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-purple-50 dark:border-purple-900/20">
                    <Button
                      variant={isThisPlaying ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        if (isThisPlaying) {
                          togglePlay();
                        } else {
                          playTrack(track);
                        }
                      }}
                      className="text-xs gap-1.5 rounded-xl"
                    >
                      {isThisPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Play
                        </>
                      )}
                    </Button>

                    <Button
                      variant={isInMixer ? 'soft' : 'ghost'}
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        if (isInMixer) {
                          removeMixerTrack(track.id);
                        } else {
                          addMixerTrack(track);
                          toast.success(`Added ${track.title} to sound mixer`);
                        }
                      }}
                      className="text-xs"
                    >
                      {isInMixer ? 'In Mixer ✓' : '+ Add to Mix'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: GUIDED MEDITATION & BREATHWORK ================= */}
      {activeRelaxTab === 'meditation' && (
        <div className="animate-fade-in">
          <GuidedMeditationTab />
        </div>
      )}

      {/* ================= TAB 3: SMOOTH JAZZ & CALMING LOUNGE ================= */}
      {activeRelaxTab === 'jazz' && (
        <div className="animate-fade-in">
          <JazzMusicTab />
        </div>
      )}

      {/* ================= TAB 4: BEDTIME STORIES & GUTENBERG BOOKS ================= */}
      {activeRelaxTab === 'stories' && (
        <div className="animate-fade-in">
          <GutenbergStoriesTab />
        </div>
      )}

      {/* ================= SLEEP TIMER MODAL ================= */}
      <Modal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        title="Sleep Timer"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-cozy-muted">
            The audio will gently fade out and stop when the timer expires so you can sleep peacefully.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {[15, 30, 45, 60, 90].map(mins => (
              <Button
                key={mins}
                variant={sleepTimerMinutes === mins ? 'primary' : 'secondary'}
                onClick={() => {
                  setSleepTimer(mins);
                  toast.success(`Sleep timer set for ${mins} minutes`);
                  setIsSleepModalOpen(false);
                }}
                className="py-3 text-xs font-bold"
              >
                {mins} Minutes
              </Button>
            ))}
          </div>

          {sleepTimerMinutes !== null && (
            <div className="pt-2 flex justify-between items-center border-t border-purple-50 dark:border-purple-900/30">
              <span className="text-xs text-cozy-lavender font-bold">
                Active: {minutesLeft} minutes left
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  cancelSleepTimer();
                  toast.info('Sleep timer cancelled');
                }}
                className="text-xs text-rose-500 hover:text-rose-600"
              >
                Cancel Timer
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* ================= AMBIENT SOUND MIXER MODAL ================= */}
      <Modal
        isOpen={isMixerOpen}
        onClose={() => setIsMixerOpen(false)}
        title="Ambient Multi-Track Mixer"
      >
        <div className="space-y-5 pt-2">
          <p className="text-xs text-cozy-muted">
            Blend multiple nature soundscapes (rain + ocean waves + forest birds) and adjust each individual volume.
          </p>

          {mixerTracks.length === 0 ? (
            <div className="p-6 text-center text-xs text-cozy-muted border border-dashed border-purple-200 dark:border-purple-900/40 rounded-2xl">
              No sounds active in mixer. Click "+ Add to Mix" on any sound card!
            </div>
          ) : (
            <div className="space-y-3">
              {mixerTracks.map(track => {
                const catalogItem = tracks.find(t => t.id === track.id);

                return (
                  <div
                    key={track.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 space-y-2 border border-slate-100 dark:border-slate-800"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="flex items-center gap-2">
                        <span>{catalogItem?.icon || '🎵'}</span>
                        <span>{catalogItem?.title || track.id}</span>
                      </span>
                      <button
                        onClick={() => removeMixerTrack(track.id)}
                        className="text-cozy-muted hover:text-rose-500 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <Volume2 className="w-3.5 h-3.5 text-cozy-muted" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={track.volume}
                        onChange={e =>
                          setMixerTrackVolume(track.id, parseInt(e.target.value))
                        }
                        className="flex-1 h-1.5 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-cozy-lavender"
                      />
                      <span className="text-[11px] font-mono text-cozy-muted w-7 text-right">
                        {track.volume}%
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Save Mix Box */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Mix name (e.g. Rainy Forest Cabin)"
                  value={mixName}
                  onChange={e => setMixName(e.target.value)}
                  className="flex-1 bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2 text-xs outline-none focus:border-cozy-lavender text-cozy-text dark:text-cozy-darkText"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => saveMixMutation.mutate()}
                  isLoading={saveMixMutation.isPending}
                >
                  Save Mix
                </Button>
              </div>
            </div>
          )}

          {/* Saved Mixes List */}
          {savedMixes.length > 0 && (
            <div className="pt-3 border-t border-purple-50 dark:border-purple-900/30">
              <p className="text-[11px] font-bold text-cozy-muted uppercase tracking-wider mb-2">
                Saved Ambient Mixes
              </p>
              <div className="space-y-1.5">
                {savedMixes.map((mix: any) => (
                  <div
                    key={mix.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs"
                  >
                    <span className="font-bold">{mix.name}</span>
                    <button
                      onClick={() => deleteMixMutation.mutate(mix.id)}
                      className="text-cozy-muted hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={clearMixer}
              className="text-xs text-rose-500 font-bold hover:underline"
            >
              Clear All Sounds
            </button>
            <Button variant="primary" size="sm" onClick={() => setIsMixerOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
