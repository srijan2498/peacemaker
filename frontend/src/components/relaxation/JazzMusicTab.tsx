import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAudioStore } from '../../stores/audioStore';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import {
  Music,
  Play,
  Pause,
  Volume2,
  Moon,
  Heart,
  Search,
  Sparkles,
  Radio,
  Disc3,
  Coffee,
  CheckCircle2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import type { AudioTrackSummary } from 'cozynest-shared';

export const JazzMusicTab: React.FC = () => {
  const queryClient = useQueryClient();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    stopTrack,
    togglePlay,
    volume,
    setVolume,
    sleepTimerMinutes,
    sleepTimerSecondsLeft,
    setSleepTimer,
    cancelSleepTimer
  } = useAudioStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubGenre, setSelectedSubGenre] = useState<string>('All');

  // Fetch full catalog
  const { data, isLoading } = useQuery<{ tracks: AudioTrackSummary[] }>({
    queryKey: ['audio-catalog'],
    queryFn: async () => {
      const res = await api.get('/audio/catalog');
      return res.data.data;
    }
  });

  const allTracks = data?.tracks || [];

  // Filter for Jazz, Lo-Fi, Piano, and Instrumental tracks
  const jazzTracks = allTracks.filter(t => {
    const titleAndDesc = `${t.title} ${t.description} ${t.category}`.toLowerCase();
    return (
      titleAndDesc.includes('jazz') ||
      titleAndDesc.includes('lo-fi') ||
      titleAndDesc.includes('piano') ||
      titleAndDesc.includes('guitar') ||
      titleAndDesc.includes('study') ||
      titleAndDesc.includes('calm') ||
      t.source === 'jamendo'
    );
  });

  const filteredJazz = jazzTracks.filter(t => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedSubGenre === 'All') return true;
    if (selectedSubGenre === 'Jazz & Blues') {
      return t.title.toLowerCase().includes('jazz') || t.description.toLowerCase().includes('jazz');
    }
    if (selectedSubGenre === 'Lo-Fi Chill') {
      return t.title.toLowerCase().includes('lo-fi') || t.description.toLowerCase().includes('study');
    }
    if (selectedSubGenre === 'Acoustic & Piano') {
      return t.title.toLowerCase().includes('piano') || t.title.toLowerCase().includes('guitar');
    }
    return true;
  });

  const toggleFavMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await api.post(`/audio/favorites/${trackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audio-catalog'] });
    }
  });

  const minutesLeft = sleepTimerSecondsLeft ? Math.ceil(sleepTimerSecondsLeft / 60) : null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950 via-stone-900 to-purple-950 text-white relative overflow-hidden shadow-soft-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="peach" size="sm">
                Licensed Royalty-Free Catalogue
              </Badge>
              <span className="text-xs text-amber-200/80 font-medium">
                Jamendo CC • Pure Instrumental & Jazz
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Coffee className="w-6 h-6 text-amber-400" />
              Smooth Jazz & Coffeehouse Lounge
            </h3>
            <p className="text-xs sm:text-sm text-amber-100/80 max-w-2xl leading-relaxed">
              Warm acoustic instruments, mellow brass, gentle upright bass, and lo-fi melodies
              licensed under Creative Commons for relaxing family evenings and focus.
            </p>
          </div>

          {/* Master Playing Bar */}
          {currentTrack && (
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20">
              <Disc3
                className={`w-8 h-8 text-amber-300 ${
                  isPlaying ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '6s' }}
              />
              <div>
                <div className="text-xs font-bold text-white truncate max-w-[150px]">
                  {currentTrack.title}
                </div>
                <div className="text-[10px] text-amber-200/70">
                  {isPlaying ? 'Playing Now' : 'Paused'}
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={togglePlay}
                className="p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white"
                title={isPlaying ? 'Pause' : 'Play'}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </Button>
              <button
                type="button"
                onClick={stopTrack}
                className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                title="Stop & Close Player"
                aria-label="Stop & Close Player"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Subgenres */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold overflow-x-auto">
          {['All', 'Jazz & Blues', 'Lo-Fi Chill', 'Acoustic & Piano'].map(g => (
            <button
              key={g}
              onClick={() => setSelectedSubGenre(g)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                selectedSubGenre === g
                  ? 'bg-amber-600 text-white shadow-soft-sm'
                  : 'text-cozy-muted hover:text-cozy-text'
              }`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-cozy-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search jazz, lo-fi, artist..."
            className="pl-9 text-xs rounded-2xl"
          />
        </div>
      </div>

      {/* Music Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJazz.map(track => {
          const isThisPlaying = currentTrack?.id === track.id && isPlaying;

          return (
            <Card
              key={track.id}
              onClick={() => playTrack(track)}
              className={`p-5 space-y-3 cursor-pointer transition-all ${
                isThisPlaying
                  ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/30 dark:bg-amber-950/20'
                  : 'bg-white dark:bg-cozy-darkCard hover:border-amber-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center text-2xl shrink-0">
                    {track.icon || '🎷'}
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

              <div className="flex items-center justify-between text-xs pt-2 border-t border-purple-50 dark:border-purple-900/20 font-bold">
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5" />
                  {track.source === 'jamendo' ? 'Studio Stream' : 'Synthesized'}
                </span>

                <Button
                  variant={isThisPlaying ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
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
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
