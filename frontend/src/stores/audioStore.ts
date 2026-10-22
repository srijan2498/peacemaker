import { create } from 'zustand';
import { audioEngine } from '../services/audioEngine';
import type { AudioTrackSummary } from 'cozynest-shared';

interface MixerTrack {
  id: string;
  soundType: string;
  volume: number; // 0 to 100
  audioUrl?: string;
}

interface AudioState {
  currentTrack: AudioTrackSummary | null;
  isPlaying: boolean;
  volume: number; // 0 to 1
  mixerTracks: MixerTrack[];
  sleepTimerMinutes: number | null;
  sleepTimerSecondsLeft: number | null;
  sleepTimerInterval: any | null;

  playTrack: (track: AudioTrackSummary) => void;
  pauseTrack: () => void;
  stopTrack: () => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  addMixerTrack: (track: AudioTrackSummary) => void;
  removeMixerTrack: (trackId: string) => void;
  setMixerTrackVolume: (trackId: string, volume: number) => void;
  clearMixer: () => void;
  setSleepTimer: (minutes: number) => void;
  cancelSleepTimer: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  mixerTracks: [],
  sleepTimerMinutes: null,
  sleepTimerSecondsLeft: null,
  sleepTimerInterval: null,

  playTrack: track => {
    const { currentTrack, isPlaying } = get();
    if (currentTrack?.id === track.id && isPlaying) return;

    audioEngine.stopAll();
    if (track.audioUrl) {
      audioEngine.playStream(track.id, track.audioUrl, get().volume);
    } else {
      audioEngine.playSound(track.id, track.soundType, get().volume);
    }

    set({
      currentTrack: track,
      isPlaying: true,
      mixerTracks: [
        {
          id: track.id,
          soundType: track.soundType,
          volume: Math.round(get().volume * 100),
          audioUrl: track.audioUrl
        }
      ]
    });
  },

  pauseTrack: () => {
    audioEngine.stopAll();
    set({ isPlaying: false });
  },

  stopTrack: () => {
    audioEngine.stopAll();
    set({ isPlaying: false, currentTrack: null, mixerTracks: [] });
  },

  togglePlay: () => {
    const { isPlaying, currentTrack } = get();
    if (isPlaying) {
      get().pauseTrack();
    } else if (currentTrack) {
      get().playTrack(currentTrack);
    }
  },

  setVolume: vol => {
    const clamped = Math.max(0, Math.min(1, vol));
    audioEngine.setMasterVolume(clamped);
    set({ volume: clamped });
  },

  addMixerTrack: track => {
    const exists = get().mixerTracks.find(t => t.id === track.id);
    if (!exists) {
      if (track.audioUrl) {
        audioEngine.playStream(track.id, track.audioUrl, 0.6);
      } else {
        audioEngine.playSound(track.id, track.soundType, 0.6);
      }
      set(state => ({
        mixerTracks: [
          ...state.mixerTracks,
          {
            id: track.id,
            soundType: track.soundType,
            volume: 60,
            audioUrl: track.audioUrl
          }
        ],
        isPlaying: true
      }));
    }
  },

  removeMixerTrack: trackId => {
    audioEngine.stopSound(trackId);
    set(state => {
      const remaining = state.mixerTracks.filter(t => t.id !== trackId);
      return {
        mixerTracks: remaining,
        isPlaying: remaining.length > 0
      };
    });
  },

  setMixerTrackVolume: (trackId, volume) => {
    audioEngine.setTrackVolume(trackId, volume / 100);
    set(state => ({
      mixerTracks: state.mixerTracks.map(t => (t.id === trackId ? { ...t, volume } : t))
    }));
  },

  clearMixer: () => {
    audioEngine.stopAll();
    set({ mixerTracks: [], isPlaying: false, currentTrack: null });
  },

  setSleepTimer: minutes => {
    if (get().sleepTimerInterval) {
      clearInterval(get().sleepTimerInterval);
    }

    const totalSeconds = minutes * 60;
    set({
      sleepTimerMinutes: minutes,
      sleepTimerSecondsLeft: totalSeconds
    });

    const interval = setInterval(() => {
      const remaining = (get().sleepTimerSecondsLeft || 0) - 1;
      if (remaining <= 0) {
        clearInterval(interval);
        audioEngine.fadeOutAndStop(3, () => {
          set({
            isPlaying: false,
            sleepTimerMinutes: null,
            sleepTimerSecondsLeft: null,
            sleepTimerInterval: null
          });
        });
      } else {
        set({ sleepTimerSecondsLeft: remaining });
      }
    }, 1000);

    set({ sleepTimerInterval: interval });
  },

  cancelSleepTimer: () => {
    if (get().sleepTimerInterval) {
      clearInterval(get().sleepTimerInterval);
    }
    set({
      sleepTimerMinutes: null,
      sleepTimerSecondsLeft: null,
      sleepTimerInterval: null
    });
  }
}));
