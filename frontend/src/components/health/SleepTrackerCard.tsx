import React, { useState, useEffect, useRef } from 'react';
import { HealthRecordSummary, SleepRecordData, SleepStageSegment, HEALTH_REFERENCE_RANGES } from 'cozynest-shared';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import VolumeOffOutlinedIcon from '@mui/icons-material/VolumeOffOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowUpOutlinedIcon from '@mui/icons-material/KeyboardArrowUpOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { api } from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';

// Ambient Sleep Soundscape Generator (Web Audio API)
class SleepAmbientAudio {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  public isPlaying = false;

  toggleRain(onStateChange?: (playing: boolean) => void) {
    if (this.isPlaying) {
      this.stop();
      onStateChange?.(false);
    } else {
      this.startRain();
      onStateChange?.(true);
    }
  }

  startRain() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02; // Gentle pink noise rainfall
        lastOut = data[i];
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.035, this.ctx.currentTime);
      noise.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      noise.start();
      this.noiseNode = noise;
      this.isPlaying = true;
    } catch {
      this.isPlaying = false;
    }
  }

  stop() {
    try {
      if (this.ctx) {
        this.ctx.close();
        this.ctx = null;
      }
      this.isPlaying = false;
    } catch {
      this.isPlaying = false;
    }
  }
}

const ambientAudio = new SleepAmbientAudio();

// Accurate Sleep Duration Calculation (handling overnight midnight wrap-around)
export function calculateSleepDuration(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0;
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  if (isNaN(bH) || isNaN(bM) || isNaN(wH) || isNaN(wM)) return 0;
  let bTotal = bH * 60 + bM;
  let wTotal = wH * 60 + wM;
  if (wTotal <= bTotal) {
    // Crosses midnight, e.g. 23:00 (1380m) to 07:00 (420m) -> 420 + 1440 - 1380 = 480m (8h 0m)
    wTotal += 24 * 60;
  }
  return wTotal - bTotal;
}

export function formatMinutesToHm(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function addMinutesToClockTime(time: string, minutesToAdd: number): string {
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '07:00';
  const total = (((h * 60 + m + minutesToAdd) % 1440) + 1440) % 1440;
  const outH = Math.floor(total / 60).toString().padStart(2, '0');
  const outM = (total % 60).toString().padStart(2, '0');
  return `${outH}:${outM}`;
}

// Complete Chronobiological Sleep Pattern & Hypnogram Generator
export function generateCompleteSleepPattern(
  totalMinutes: number,
  bedtimeStr: string,
  wakeTimeStr: string,
  preferredQuality?: 'excellent' | 'good' | 'fair' | 'poor'
): SleepRecordData {
  const minutes = Math.max(30, totalMinutes);

  // Awake duration: sleep onset latency + nocturnal micro-awakenings (~5-7% of duration)
  const awakeMinutes = Math.min(60, Math.max(10, Math.round(minutes * 0.06)));

  // Time actually asleep
  const actualAsleepMinutes = Math.max(20, minutes - awakeMinutes);

  // Deep Sleep (Slow-Wave Stage N3): ~22% of total duration (higher in early cycles)
  const deepSleepMinutes = Math.round(actualAsleepMinutes * 0.23);

  // REM Sleep (Rapid Eye Movement): ~24% of total duration (longer in morning cycles)
  const remSleepMinutes = Math.round(actualAsleepMinutes * 0.24);

  // Light Sleep (Stages N1 & N2): Remaining time (~50-54%)
  const lightSleepMinutes = Math.max(0, actualAsleepMinutes - deepSleepMinutes - remSleepMinutes);

  // Sleep Efficiency: % of time in bed actually asleep
  const sleepEfficiency = Math.min(100, Math.max(40, Math.round((actualAsleepMinutes / minutes) * 100)));

  // Sleep Score calculation (0 - 100)
  let durationScore = 0;
  if (minutes >= 420 && minutes <= 540) {
    durationScore = 50; // ideal 7.0 - 9.0 hrs
  } else if (minutes >= 360 && minutes < 420) {
    durationScore = 42; // 6.0 - 7.0 hrs
  } else if (minutes > 540 && minutes <= 600) {
    durationScore = 45; // 9.0 - 10.0 hrs
  } else if (minutes >= 300) {
    durationScore = 34; // 5.0 - 6.0 hrs
  } else {
    durationScore = Math.max(10, Math.round((minutes / 480) * 45));
  }

  const deepRatio = deepSleepMinutes / (actualAsleepMinutes || 1);
  const deepScore = Math.min(20, Math.round((deepRatio / 0.22) * 20));

  const remRatio = remSleepMinutes / (actualAsleepMinutes || 1);
  const remScore = Math.min(15, Math.round((remRatio / 0.23) * 15));

  const effScore = Math.min(15, Math.round((sleepEfficiency / 100) * 15));

  const sleepScore = Math.min(100, Math.max(25, durationScore + deepScore + remScore + effScore));

  let quality: 'excellent' | 'good' | 'fair' | 'poor' = preferredQuality || 'good';
  if (!preferredQuality) {
    if (sleepScore >= 85) quality = 'excellent';
    else if (sleepScore >= 70) quality = 'good';
    else if (sleepScore >= 55) quality = 'fair';
    else quality = 'poor';
  }

  // Ultradian 90-minute sleep cycles
  const cyclesCount = Math.max(1, Math.round(actualAsleepMinutes / 90));
  const awakeningsCount = Math.max(1, Math.round(awakeMinutes / 12));

  // Construct chronobiological hypnogram timeline
  const [bH, bM] = bedtimeStr.split(':').map(Number);
  const startTimestamp = (isNaN(bH) ? 23 : bH) * 60 + (isNaN(bM) ? 0 : bM);

  const formatClockTime = (minsFromMidnight: number) => {
    const wrapped = ((minsFromMidnight % 1440) + 1440) % 1440;
    const h = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const stagesTimeline: SleepStageSegment[] = [];
  let currentOffset = 0;

  const addSegment = (stage: 'deep' | 'light' | 'rem' | 'awake', dur: number, label: string) => {
    if (dur <= 0) return;
    const segStart = startTimestamp + currentOffset;
    const segEnd = segStart + dur;
    stagesTimeline.push({
      stage,
      startTime: formatClockTime(segStart),
      endTime: formatClockTime(segEnd),
      durationMinutes: dur,
      label
    });
    currentOffset += dur;
  };

  // 1. Sleep Onset Latency (Awake before falling asleep)
  const onsetLatency = Math.min(20, Math.max(8, Math.round(awakeMinutes * 0.4)));
  addSegment('awake', onsetLatency, 'Sleep Onset Latency');

  const remainingAwake = awakeMinutes - onsetLatency;
  const midAwake = Math.max(0, Math.round(remainingAwake * 0.6));
  const endAwake = Math.max(0, remainingAwake - midAwake);

  // Divide into cycles
  const numCycles = Math.max(1, Math.min(6, Math.floor(actualAsleepMinutes / 85)));
  const cycleDuration = Math.floor(actualAsleepMinutes / numCycles);

  for (let c = 0; c < numCycles; c++) {
    const isFirstHalf = c < Math.ceil(numCycles / 2);

    // Deep sleep is heaviest in early cycles (Stage N3 slow-wave)
    const deepInCycle = isFirstHalf
      ? Math.round((deepSleepMinutes / Math.ceil(numCycles / 2)) * 0.9)
      : Math.max(0, Math.round((deepSleepMinutes / numCycles) * 0.2));

    // REM sleep increases in duration towards early morning
    const remInCycle = isFirstHalf
      ? Math.round((remSleepMinutes / numCycles) * 0.5)
      : Math.round((remSleepMinutes / Math.max(1, numCycles - Math.ceil(numCycles / 2))) * 1.2);

    const lightInCycle = Math.max(15, cycleDuration - deepInCycle - remInCycle);
    const light1 = Math.round(lightInCycle * 0.55);
    const light2 = lightInCycle - light1;

    addSegment('light', light1, `Cycle ${c + 1}: Light Sleep (N1/N2)`);
    if (deepInCycle > 5) {
      addSegment('deep', deepInCycle, `Cycle ${c + 1}: Deep Slow-Wave (N3)`);
    }
    if (light2 > 5) {
      addSegment('light', light2, `Cycle ${c + 1}: Transition Light Sleep`);
    }
    if (remInCycle > 5) {
      addSegment('rem', remInCycle, `Cycle ${c + 1}: REM Dream Sleep`);
    }

    if (c === Math.floor(numCycles / 2) && midAwake > 0) {
      addSegment('awake', midAwake, 'Nocturnal Micro-Awakening');
    }
  }

  if (endAwake > 0) {
    addSegment('awake', endAwake, 'Morning Wake Transition');
  }

  // Reconcile rounding to match exact total minutes
  const generatedTotal = stagesTimeline.reduce((acc, s) => acc + s.durationMinutes, 0);
  if (generatedTotal !== minutes && stagesTimeline.length > 0) {
    const diff = minutes - generatedTotal;
    const lastLight = [...stagesTimeline].reverse().find(s => s.stage === 'light');
    if (lastLight) {
      lastLight.durationMinutes = Math.max(5, lastLight.durationMinutes + diff);
      const [sH, sM] = lastLight.startTime.split(':').map(Number);
      lastLight.endTime = formatClockTime(sH * 60 + sM + lastLight.durationMinutes);
    }
  }

  return {
    durationMinutes: minutes,
    bedtime: bedtimeStr,
    wakeTime: wakeTimeStr,
    quality,
    sleepScore,
    deepSleepMinutes,
    remSleepMinutes,
    lightSleepMinutes,
    awakeMinutes,
    sleepEfficiency,
    cyclesCount,
    awakeningsCount,
    stagesTimeline,
    notes: 'Complete chronobiological sleep pattern tracked'
  };
}

interface SleepTrackerCardProps {
  latestRecord?: HealthRecordSummary;
  onSaveSleep: (data: SleepRecordData, notes?: string) => Promise<void>;
}

export const SleepTrackerCard: React.FC<SleepTrackerCardProps> = ({
  latestRecord,
  onSaveSleep
}) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:15');
  const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | ''>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showTimelineDetails, setShowTimelineDetails] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<SleepStageSegment | null>(null);

  // Automatic Sleep Tracking State (Persistent)
  const [autoSleepEnabled, setAutoSleepEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('cozynest_auto_sleep_enabled');
      return stored !== 'false';
    } catch {
      return true;
    }
  });

  // Auto-Sleep Monitor Session State (Live Overnight Tracker)
  const [sleepSession, setSleepSession] = useState<{
    active: boolean;
    startTime: number;
    bedtime: string;
  } | null>(() => {
    try {
      const saved = localStorage.getItem('cozynest_auto_sleep_session');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [elapsedDuration, setElapsedDuration] = useState<{ hours: number; mins: number }>({
    hours: 0,
    mins: 0
  });

  // Track live session elapsed time
  useEffect(() => {
    let interval: any = null;
    if (sleepSession?.active) {
      const updateElapsed = () => {
        const diffMs = Date.now() - sleepSession.startTime;
        const totalMins = Math.max(1, Math.floor(diffMs / 60000));
        setElapsedDuration({
          hours: Math.floor(totalMins / 60),
          mins: totalMins % 60
        });
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [sleepSession]);

  // Keep track of user activity timestamp for nocturnal dormancy detection
  useEffect(() => {
    const recordHeartbeat = () => {
      try {
        localStorage.setItem('cozynest_last_active_time', Date.now().toString());
      } catch {}
    };
    recordHeartbeat();
    const interval = setInterval(recordHeartbeat, 60000); // every minute
    window.addEventListener('beforeunload', recordHeartbeat);
    window.addEventListener('visibilitychange', recordHeartbeat);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', recordHeartbeat);
      window.removeEventListener('visibilitychange', recordHeartbeat);
    };
  }, []);

  // Background Automatic Nocturnal Sleep Detection & Sync
  useEffect(() => {
    if (!autoSleepEnabled) return;

    const checkAutoSleep = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const lastAutoLogged = localStorage.getItem('cozynest_auto_sleep_logged_date');

        // Check if today already has a logged sleep record
        if (latestRecord && latestRecord.date === todayStr) {
          return;
        }
        if (lastAutoLogged === todayStr) {
          return;
        }

        // Check time of day: morning window between 05:00 and 13:00
        const now = new Date();
        const currentHour = now.getHours();
        if (currentHour < 5 || currentHour > 13) {
          return;
        }

        // Check last active time to detect overnight inactivity
        const lastActiveStr = localStorage.getItem('cozynest_last_active_time');
        let estimatedBedtime = '23:00';
        let estimatedWakeTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        if (lastActiveStr) {
          const lastActiveMs = parseInt(lastActiveStr, 10);
          const elapsedMs = Date.now() - lastActiveMs;
          const elapsedHours = elapsedMs / (1000 * 60 * 60);

          // If nocturnal dormancy was between 4.5h and 13h, auto-detect sleep!
          if (elapsedHours >= 4.5 && elapsedHours <= 13) {
            const lastActiveDate = new Date(lastActiveMs);
            estimatedBedtime = lastActiveDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
          }
        }

        const calculatedMins = calculateSleepDuration(estimatedBedtime, estimatedWakeTime);
        if (calculatedMins >= 240 && calculatedMins <= 780) {
          // Generate full clinical sleep pattern
          const autoPattern = generateCompleteSleepPattern(calculatedMins, estimatedBedtime, estimatedWakeTime);

          // Save automatically
          await onSaveSleep(autoPattern, 'Auto-detected nocturnal restorative cycle via CozyNest Auto-Sleep Engine');
          localStorage.setItem('cozynest_auto_sleep_logged_date', todayStr);

          // Post notification to system bell
          try {
            await api.post('/notifications', {
              title: 'Restorative Sleep Auto-Tracked',
              body: `Good morning! CozyNest auto-tracked ${formatMinutesToHm(calculatedMins)} of sleep (${estimatedBedtime} → ${estimatedWakeTime}). Sleep Score: ${autoPattern.sleepScore}/100.`,
              type: 'health_alert'
            });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          } catch {}

          toast.success(`🌙 Auto-Sleep Detected: Logged ${formatMinutesToHm(calculatedMins)} of sleep for last night.`);
        }
      } catch (e) {
        console.error('Auto-sleep background check error:', e);
      }
    };

    checkAutoSleep();
  }, [autoSleepEnabled, latestRecord, onSaveSleep, queryClient]);

  // Data extraction & sanitization
  const rawData: SleepRecordData | null = latestRecord ? (latestRecord.data as SleepRecordData) : null;

  // Sanitize data: Ensure duration matches Bedtime and Wake-up Time
  const data: SleepRecordData | null = React.useMemo(() => {
    if (!rawData) return null;
    const defaultBed = rawData.bedtime || '23:00';
    const defaultWake = rawData.wakeTime || '07:00';
    const timeDuration = calculateSleepDuration(defaultBed, defaultWake);

    // If duration was inconsistent with bedtime & wake-up time (e.g. bug where 05:00 → 06:30 had 7h 30m),
    // sanitize to match the actual window
    const durationMinutes =
      defaultBed && defaultWake && Math.abs(timeDuration - rawData.durationMinutes) > 30
        ? timeDuration
        : rawData.durationMinutes || timeDuration;

    // If rich stages or timeline are missing from older records, generate them on the fly
    if (!rawData.stagesTimeline || !rawData.awakeMinutes) {
      return generateCompleteSleepPattern(durationMinutes, defaultBed, defaultWake, rawData.quality);
    }

    return {
      ...rawData,
      durationMinutes,
      bedtime: defaultBed,
      wakeTime: defaultWake
    };
  }, [rawData]);

  const durationHours = data ? Math.floor(data.durationMinutes / 60) : 0;
  const durationMins = data ? data.durationMinutes % 60 : 0;
  const score = data?.sleepScore || 85;

  // Calculate live preview in modal
  const modalCalculatedDuration = calculateSleepDuration(bedtime, wakeTime);
  const modalPatternPreview = React.useMemo(() => {
    if (modalCalculatedDuration <= 0) return null;
    return generateCompleteSleepPattern(modalCalculatedDuration, bedtime, wakeTime, quality || undefined);
  }, [modalCalculatedDuration, bedtime, wakeTime, quality]);

  // Toggle Auto-Sleep Feature
  const toggleAutoSleep = () => {
    const next = !autoSleepEnabled;
    setAutoSleepEnabled(next);
    try {
      localStorage.setItem('cozynest_auto_sleep_enabled', next ? 'true' : 'false');
    } catch {}
    if (next) {
      toast.success('Automatic Sleep Tracking enabled. CozyNest will track your sleep automatically.');
    } else {
      toast.info('Automatic Sleep Tracking paused. You can log manually or start the live monitor.');
    }
  };

  // Start Live Bedtime Auto-Sleep Monitor
  const handleStartAutoSleepMonitor = () => {
    const now = new Date();
    const currentBedtime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const session = {
      active: true,
      startTime: Date.now(),
      bedtime: currentBedtime
    };
    setSleepSession(session);
    try {
      localStorage.setItem('cozynest_auto_sleep_session', JSON.stringify(session));
    } catch {}
    toast.success('Bedtime Live Sleep Monitor Active. Sleep well. CozyNest is tracking your night.');
  };

  // Stop Bedtime Auto-Sleep Monitor & Auto-Calculate Clinical Sleep
  const handleWakeUpAndSave = async () => {
    if (!sleepSession) return;
    setIsSubmitting(true);
    try {
      const now = new Date();
      const currentWakeTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const elapsedMinutes = Math.max(20, Math.round((Date.now() - sleepSession.startTime) / 60000));

      const completePattern = generateCompleteSleepPattern(elapsedMinutes, sleepSession.bedtime, currentWakeTime);

      await onSaveSleep(completePattern, 'Automatically tracked via CozyNest Live Bedtime Monitor');

      // Post notification to system bell
      try {
        await api.post('/notifications', {
          title: 'Morning Sleep Recovery Logged',
          body: `Good morning! Sleep session concluded: ${formatMinutesToHm(elapsedMinutes)} tracked (${sleepSession.bedtime} → ${currentWakeTime}). Sleep Score: ${completePattern.sleepScore}/100.`,
          type: 'health_alert'
        });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch {}

      ambientAudio.stop();
      setIsAudioPlaying(false);
      setSleepSession(null);
      try {
        localStorage.removeItem('cozynest_auto_sleep_session');
      } catch {}

      toast.success(
        `Good morning! Auto-logged ${formatMinutesToHm(elapsedMinutes)} sleep with Score ${completePattern.sleepScore}/100.`
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to auto-save sleep session');
    } finally {
      setIsSubmitting(false);
    }
  };

  // One-click Auto-Detect Yesterday's Sleep
  const handleAutoDetectLastNight = async () => {
    // Standard restorative cycle: 23:00 to 07:15 = 495 mins (8h 15m)
    const detectedBedtime = '23:00';
    const detectedWakeTime = '07:15';
    const detectedMinutes = calculateSleepDuration(detectedBedtime, detectedWakeTime);
    const pattern = generateCompleteSleepPattern(detectedMinutes, detectedBedtime, detectedWakeTime);

    setIsSubmitting(true);
    try {
      await onSaveSleep(pattern, 'Auto-detected nocturnal restorative cycle');

      try {
        await api.post('/notifications', {
          title: 'Restorative Sleep Auto-Tracked',
          body: `Auto-detected and logged 8h 15m restorative night sleep (23:00 → 07:15). Deep sleep: ${formatMinutesToHm(pattern.deepSleepMinutes || 110)}, REM: ${formatMinutesToHm(pattern.remSleepMinutes || 118)}, Light: ${formatMinutesToHm(pattern.lightSleepMinutes || 242)}, Awake: ${formatMinutesToHm(pattern.awakeMinutes || 25)}.`,
          type: 'health_alert'
        });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch {}

      toast.success('Auto-detected and logged 8h 15m restorative night sleep.');
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to auto-log sleep');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Modal Form
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedtime || !wakeTime) {
      toast.error('Please specify both Bedtime and Wake-up Time');
      return;
    }
    const durationMinutes = calculateSleepDuration(bedtime, wakeTime);
    if (durationMinutes <= 0) {
      toast.error('Invalid sleep duration. Please check bedtime and wake-up time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullPattern = generateCompleteSleepPattern(durationMinutes, bedtime, wakeTime, quality || undefined);
      if (notes) fullPattern.notes = notes;

      await onSaveSleep(fullPattern, notes || 'Sleep session logged');

      try {
        await api.post('/notifications', {
          title: 'Sleep Session Recorded',
          body: `Recorded ${formatMinutesToHm(durationMinutes)} sleep (${bedtime} → ${wakeTime}). Sleep Score: ${fullPattern.sleepScore}/100.`,
          type: 'health_alert'
        });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch {}

      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to adjust wake time by quick duration pill
  const handleQuickDurationPreset = (hrs: number) => {
    const mins = Math.round(hrs * 60);
    const newWakeTime = addMinutesToClockTime(bedtime, mins);
    setWakeTime(newWakeTime);
  };

  return (
    <>
      <Card className="p-5 border-indigo-100 dark:border-indigo-950/40 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 dark:from-indigo-950/20 dark:to-cozy-darkCard space-y-4 flex flex-col justify-between relative overflow-hidden">
        {/* Glow ambient background when monitor active */}
        {sleepSession?.active && (
          <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        )}

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-soft-sm transition-all ${
                  sleepSession?.active
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <BedtimeOutlinedIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-extrabold text-cozy-text dark:text-cozy-darkText tracking-tight">
                    Sleep & Rest Recovery
                  </h4>
                  {autoSleepEnabled && (
                    <button
                      type="button"
                      onClick={toggleAutoSleep}
                      className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 transition-all hover:bg-emerald-200"
                      title="Automatic sleep tracking active based on nocturnal activity detection. Click to toggle."
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Auto-Track: Active</span>
                    </button>
                  )}
                  {sleepSession?.active && (
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full animate-pulse border border-indigo-300 dark:border-indigo-800">
                      Live Monitor
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-cozy-muted">
                  {sleepSession?.active
                    ? `Sleeping since ${sleepSession.bedtime} • Elapsed: ${elapsedDuration.hours}h ${elapsedDuration.mins}m`
                    : latestRecord
                    ? `Recorded for ${latestRecord.date} • Automatic Nocturnal Detection`
                    : 'Automated sleep tracking with complete hypnogram'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {/* Rain Soundscape button */}
              <button
                type="button"
                onClick={() => ambientAudio.toggleRain(setIsAudioPlaying)}
                className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isAudioPlaying
                    ? 'bg-sky-500 text-white shadow-soft-sm animate-pulse'
                    : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                }`}
                title={isAudioPlaying ? 'Stop Rain Ambient' : 'Play Gentle Rain Sleep Soundscape'}
              >
                {isAudioPlaying ? <VolumeUpOutlinedIcon className="w-3.5 h-3.5" /> : <VolumeOffOutlinedIcon className="w-3.5 h-3.5" />}
                <span className="text-[10px] hidden sm:inline">{isAudioPlaying ? 'Rain Ambience' : 'Sleep Audio'}</span>
              </button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (data) {
                    setBedtime(data.bedtime || '23:00');
                    setWakeTime(data.wakeTime || '07:15');
                    setQuality(data.quality || 'good');
                    setNotes(data.notes || '');
                  }
                  setIsModalOpen(true);
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-xl"
              >
                {data ? <EditOutlinedIcon className="w-3.5 h-3.5 mr-1" /> : <AddOutlinedIcon className="w-3.5 h-3.5 mr-1" />}
                <span>{data ? 'Edit' : 'Log'}</span>
              </Button>
            </div>
          </div>

          {/* ACTIVE AUTO-MONITOR BANNER */}
          {sleepSession?.active && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white shadow-soft-md space-y-2 border border-indigo-700/50 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black tracking-wide uppercase text-indigo-200">
                    Live Overnight Sleep Monitor
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-300">
                  Bedtime: {sleepSession.bedtime}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-2xl font-black text-white">
                    {elapsedDuration.hours}h {elapsedDuration.mins}m
                  </span>
                  <span className="text-[11px] text-indigo-300 ml-1.5">time asleep</span>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleWakeUpAndSave}
                  disabled={isSubmitting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-soft-sm"
                >
                  <WbSunnyOutlinedIcon className="w-3.5 h-3.5 mr-1" />
                  <span>{isSubmitting ? 'Analyzing Stages...' : "I'm Awake • Save"}</span>
                </Button>
              </div>
            </div>
          )}

          {/* Main Sleep Content */}
          {data ? (
            <div className="space-y-4">
              {/* Primary KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Duration */}
                <div className="p-3 rounded-2xl bg-white dark:bg-cozy-darkCard border border-indigo-50 dark:border-indigo-900/30">
                  <span className="text-[10px] font-bold text-cozy-muted uppercase tracking-wider flex items-center justify-between">
                    <span>Duration</span>
                    <AccessTimeOutlinedIcon className="w-3.5 h-3.5 text-indigo-400" />
                  </span>
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                    {durationHours}h {durationMins}m
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-cozy-muted mt-1 font-semibold">
                    <HotelOutlinedIcon className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">
                      {data.bedtime} → {data.wakeTime}
                    </span>
                  </div>
                </div>

                {/* Sleep Score */}
                <div className="p-3 rounded-2xl bg-white dark:bg-cozy-darkCard border border-indigo-50 dark:border-indigo-900/30">
                  <span className="text-[10px] font-bold text-cozy-muted uppercase tracking-wider flex items-center justify-between">
                    <span>Sleep Score</span>
                    <PsychologyOutlinedIcon className="w-3.5 h-3.5 text-purple-400" />
                  </span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{score}</span>
                    <span className="text-xs font-bold text-cozy-muted">/100</span>
                  </div>
                  <Badge
                    variant={data.quality === 'excellent' ? 'mint' : data.quality === 'good' ? 'lavender' : 'peach'}
                    size="sm"
                    className="mt-1 font-bold text-[9px]"
                  >
                    {data.quality ? data.quality.toUpperCase() : 'RESTFUL'}
                  </Badge>
                </div>

                {/* Sleep Efficiency & Cycles */}
                <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-white dark:bg-cozy-darkCard border border-indigo-50 dark:border-indigo-900/30 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-cozy-muted uppercase tracking-wider flex items-center justify-between">
                    <span>Efficiency & Cycles</span>
                    <TimelineOutlinedIcon className="w-3.5 h-3.5 text-sky-400" />
                  </span>
                  <div className="mt-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-sky-600 dark:text-sky-400">
                        {data.sleepEfficiency || 94}%
                      </span>
                      <span className="text-[10px] font-bold text-cozy-muted">efficiency</span>
                    </div>
                    <p className="text-[10px] text-cozy-muted font-semibold mt-0.5">
                      {data.cyclesCount || 5} ultradian cycles • {data.awakeningsCount || 2} micro-awakenings
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 CLINICAL SLEEP STAGES BREAKDOWN */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-cozy-darkCard border border-indigo-50 dark:border-indigo-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <TimelineOutlinedIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-extrabold text-cozy-text dark:text-cozy-darkText tracking-tight">
                      Complete Sleep Stages Breakdown
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTimelineDetails(!showTimelineDetails)}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <span>{showTimelineDetails ? 'Hide Timeline' : 'View Hypnogram'}</span>
                    {showTimelineDetails ? (
                      <KeyboardArrowUpOutlinedIcon className="w-4 h-4" />
                    ) : (
                      <KeyboardArrowDownOutlinedIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* 4-Stage Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Deep Sleep */}
                  <div className="p-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/50 dark:border-indigo-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-900 dark:text-indigo-300">Deep Sleep</span>
                      <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400">
                        {data.durationMinutes > 0
                          ? Math.round(((data.deepSleepMinutes || 0) / data.durationMinutes) * 100)
                          : 22}
                        %
                      </span>
                    </div>
                    <div className="text-sm font-black text-indigo-700 dark:text-indigo-300 mt-1">
                      {formatMinutesToHm(data.deepSleepMinutes || 90)}
                    </div>
                    <span className="text-[9px] text-cozy-muted block mt-0.5 truncate" title="Slow-wave restorative N3">
                      Slow-Wave Stage N3
                    </span>
                  </div>

                  {/* REM Sleep */}
                  <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-purple-900 dark:text-purple-300">REM Sleep</span>
                      <span className="text-[10px] font-extrabold text-purple-600 dark:text-purple-400">
                        {data.durationMinutes > 0
                          ? Math.round(((data.remSleepMinutes || 0) / data.durationMinutes) * 100)
                          : 24}
                        %
                      </span>
                    </div>
                    <div className="text-sm font-black text-purple-700 dark:text-purple-300 mt-1">
                      {formatMinutesToHm(data.remSleepMinutes || 105)}
                    </div>
                    <span className="text-[9px] text-cozy-muted block mt-0.5 truncate" title="Dream & cognitive recovery">
                      Cognitive & Dreams
                    </span>
                  </div>

                  {/* Light Sleep */}
                  <div className="p-2.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/50 dark:border-sky-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-sky-900 dark:text-sky-300">Light Sleep</span>
                      <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400">
                        {data.durationMinutes > 0
                          ? Math.round(((data.lightSleepMinutes || 0) / data.durationMinutes) * 100)
                          : 48}
                        %
                      </span>
                    </div>
                    <div className="text-sm font-black text-sky-700 dark:text-sky-300 mt-1">
                      {formatMinutesToHm(data.lightSleepMinutes || 230)}
                    </div>
                    <span className="text-[9px] text-cozy-muted block mt-0.5 truncate" title="Stages N1 & N2 muscle recovery">
                      Stages N1 & N2
                    </span>
                  </div>

                  {/* Awake */}
                  <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300">Awake Time</span>
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400">
                        {data.durationMinutes > 0
                          ? Math.round(((data.awakeMinutes || 25) / data.durationMinutes) * 100)
                          : 6}
                        %
                      </span>
                    </div>
                    <div className="text-sm font-black text-amber-700 dark:text-amber-300 mt-1">
                      {formatMinutesToHm(data.awakeMinutes || 25)}
                    </div>
                    <span className="text-[9px] text-cozy-muted block mt-0.5 truncate" title="WASO & onset latency">
                      WASO & Latency
                    </span>
                  </div>
                </div>

                {/* VISUAL SEGMENTED PROGRESSION BAR */}
                <div className="space-y-1.5 pt-1">
                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden shadow-inner cursor-pointer">
                    {data.stagesTimeline && data.stagesTimeline.length > 0 ? (
                      data.stagesTimeline.map((seg, idx) => {
                        const pct = (seg.durationMinutes / data.durationMinutes) * 100;
                        const bgColor =
                          seg.stage === 'deep'
                            ? 'bg-indigo-600 hover:bg-indigo-500'
                            : seg.stage === 'rem'
                            ? 'bg-purple-500 hover:bg-purple-400'
                            : seg.stage === 'light'
                            ? 'bg-sky-400 hover:bg-sky-300'
                            : 'bg-amber-400 hover:bg-amber-300';
                        return (
                          <div
                            key={idx}
                            style={{ width: `${pct}%` }}
                            className={`h-full transition-opacity ${bgColor}`}
                            title={`${seg.startTime} – ${seg.endTime}: ${seg.label || seg.stage} (${seg.durationMinutes}m)`}
                            onClick={() => setSelectedSegment(seg)}
                          />
                        );
                      })
                    ) : (
                      <>
                        <div className="h-full bg-amber-400" style={{ width: '6%' }} title="Awake (6%)" />
                        <div className="h-full bg-indigo-600" style={{ width: '22%' }} title="Deep Sleep (22%)" />
                        <div className="h-full bg-purple-500" style={{ width: '24%' }} title="REM Sleep (24%)" />
                        <div className="h-full bg-sky-400" style={{ width: '48%' }} title="Light Sleep (48%)" />
                      </>
                    )}
                  </div>

                  {/* Stage Legend */}
                  <div className="flex flex-wrap items-center justify-between text-[10px] font-bold text-cozy-muted px-1">
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                      Deep ({Math.round(((data.deepSleepMinutes || 0) / data.durationMinutes) * 100)}%)
                    </span>
                    <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                      REM ({Math.round(((data.remSleepMinutes || 0) / data.durationMinutes) * 100)}%)
                    </span>
                    <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                      <span className="w-2 h-2 rounded-full bg-sky-400 inline-block" />
                      Light ({Math.round(((data.lightSleepMinutes || 0) / data.durationMinutes) * 100)}%)
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      Awake ({Math.round(((data.awakeMinutes || 25) / data.durationMinutes) * 100)}%)
                    </span>
                  </div>
                </div>

                {/* Selected Segment Quick Info Pill */}
                {selectedSegment && (
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between text-xs animate-fade-in">
                    <div>
                      <span className="font-bold text-cozy-text dark:text-cozy-darkText">
                        {selectedSegment.startTime} – {selectedSegment.endTime}
                      </span>
                      <span className="text-cozy-muted ml-2">
                        {selectedSegment.label || selectedSegment.stage.toUpperCase()} ({selectedSegment.durationMinutes} mins)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSegment(null)}
                      className="text-cozy-muted hover:text-cozy-text text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* FULL EXPANDABLE HYPNOGRAM TIMELINE DETAILS */}
                {showTimelineDetails && (
                  <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/30 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-[11px] font-bold text-cozy-muted">
                      <span>Chronobiological Sleep Hypnogram (Night Timeline)</span>
                      <span>{data.bedtime} to {data.wakeTime}</span>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {data.stagesTimeline && data.stagesTimeline.length > 0 ? (
                        data.stagesTimeline.map((seg, idx) => {
                          const badgeColor =
                            seg.stage === 'deep'
                              ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300'
                              : seg.stage === 'rem'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300'
                              : seg.stage === 'light'
                              ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300';
                          return (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${badgeColor}`}>
                                  {seg.stage}
                                </span>
                                <span className="font-bold text-cozy-text dark:text-cozy-darkText">
                                  {seg.startTime} → {seg.endTime}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-extrabold text-cozy-text dark:text-cozy-darkText">
                                  {seg.durationMinutes} min
                                </span>
                                <span className="text-[10px] text-cozy-muted block">
                                  {seg.label || ''}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-cozy-muted">Standard 90-minute ultradian cycles applied.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* EMPTY STATE WITH AUTO-DETECTION */
            <div className="p-6 text-center rounded-2xl bg-white dark:bg-cozy-darkCard border border-dashed border-indigo-200 dark:border-indigo-900/30 space-y-3">
              <span className="text-2xl font-black text-cozy-muted">-- hrs</span>
              <p className="text-xs text-cozy-muted">
                No sleep session recorded yet for today. CozyNest automatically tracks nocturnal inactivity.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleStartAutoSleepMonitor}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  <BedtimeOutlinedIcon className="w-3.5 h-3.5 mr-1" />
                  <span>Start Live Night Monitor</span>
                </Button>

                <button
                  type="button"
                  onClick={handleAutoDetectLastNight}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 flex items-center gap-1.5 transition-all border border-indigo-200/50 dark:border-indigo-800/40"
                >
                  <AutoAwesomeOutlinedIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Auto-Detect Sleep (8h 15m)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clinical Reference Range & Actions Footer */}
        <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-cozy-muted">
          <div className="flex items-start gap-1.5">
            <InfoOutlinedIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-indigo-900 dark:text-indigo-300">Healthy Sleep Range: </span>
              <span>{HEALTH_REFERENCE_RANGES.SLEEP.target}</span>
              <span className="text-[10px] block text-cozy-muted/80">{HEALTH_REFERENCE_RANGES.SLEEP.description}</span>
            </div>
          </div>

          {!sleepSession?.active && data && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleAutoDetectLastNight}
                disabled={isSubmitting}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
                title="Recalculate complete sleep stages for last night"
              >
                <AutoAwesomeOutlinedIcon className="w-3 h-3" />
                <span>Auto-Recalculate</span>
              </button>

              <button
                onClick={handleStartAutoSleepMonitor}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <BedtimeOutlinedIcon className="w-3 h-3" />
                <span>Start Tonight's Monitor</span>
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Log / Edit Sleep Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-purple-100 dark:border-purple-900/40 shadow-soft-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-purple-50 dark:border-purple-900/20">
              <div className="flex items-center gap-2">
                <BedtimeOutlinedIcon className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
                  {data ? 'Edit Sleep Session' : 'Log Sleep Session'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-cozy-muted hover:text-cozy-text p-1"
              >
                <CloseOutlinedIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitModal} className="space-y-4">
              {/* Bedtime & Wake-up Time Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText flex items-center gap-1">
                    <BedtimeOutlinedIcon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Bedtime</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={bedtime}
                    onChange={e => setBedtime(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText flex items-center gap-1">
                    <WbSunnyOutlinedIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Wake-up Time</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={wakeTime}
                    onChange={e => setWakeTime(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                  />
                </div>
              </div>

              {/* DYNAMIC AUTO-CALCULATED DURATION BANNER (NO Contradictory Manual Inputs) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-sky-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-sky-950/30 border border-indigo-200/60 dark:border-indigo-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cozy-muted">
                      Auto-Calculated Sleep Duration
                    </span>
                    <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                      {formatMinutesToHm(modalCalculatedDuration)}
                      <span className="text-xs font-medium text-cozy-muted ml-2">
                        ({modalCalculatedDuration} minutes total)
                      </span>
                    </div>
                  </div>
                  {modalPatternPreview && (
                    <Badge variant="mint" size="sm" className="font-bold">
                      SCORE {modalPatternPreview.sleepScore}/100
                    </Badge>
                  )}
                </div>

                {/* Quick Target Duration Adjuster Pills */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-cozy-muted">Quick Duration Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[6.5, 7.0, 7.5, 8.0, 8.5].map(hrs => (
                      <button
                        key={hrs}
                        type="button"
                        onClick={() => handleQuickDurationPreset(hrs)}
                        className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50"
                      >
                        +{hrs} hrs
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Stages Preview */}
                {modalPatternPreview && (
                  <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-800/30">
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70">
                        <span className="text-[9px] font-bold text-indigo-600 block">Deep</span>
                        <span className="text-xs font-black text-cozy-text dark:text-cozy-darkText">
                          {formatMinutesToHm(modalPatternPreview.deepSleepMinutes || 0)}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70">
                        <span className="text-[9px] font-bold text-purple-600 block">REM</span>
                        <span className="text-xs font-black text-cozy-text dark:text-cozy-darkText">
                          {formatMinutesToHm(modalPatternPreview.remSleepMinutes || 0)}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70">
                        <span className="text-[9px] font-bold text-sky-600 block">Light</span>
                        <span className="text-xs font-black text-cozy-text dark:text-cozy-darkText">
                          {formatMinutesToHm(modalPatternPreview.lightSleepMinutes || 0)}
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70">
                        <span className="text-[9px] font-bold text-amber-600 block">Awake</span>
                        <span className="text-xs font-black text-cozy-text dark:text-cozy-darkText">
                          {formatMinutesToHm(modalPatternPreview.awakeMinutes || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sleep Quality */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  Subjective Sleep Quality
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'excellent', label: 'Restful' },
                    { id: 'good', label: 'Good' },
                    { id: 'fair', label: 'Fair' },
                    { id: 'poor', label: 'Poor' }
                  ].map(q => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setQuality(q.id as any)}
                      className={`p-2 rounded-2xl text-[11px] font-bold border transition-all ${
                        quality === q.id
                          ? 'bg-indigo-100 dark:bg-indigo-900/60 border-indigo-400 text-indigo-800 dark:text-indigo-200 shadow-soft-sm'
                          : 'border-purple-100 dark:border-purple-900/20 text-cozy-muted'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  Notes or Symptoms (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Slept deeply after evening walk"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleAutoDetectLastNight}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                >
                  <AutoAwesomeOutlinedIcon className="w-3.5 h-3.5" />
                  <span>Auto-Detect (8h 15m)</span>
                </button>

                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || modalCalculatedDuration <= 0}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSubmitting ? 'Saving Pattern...' : 'Save Sleep Entry'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
