import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GuidedMeditationItem } from 'cozynest-shared';
import { freeSourcesService } from '../../services/freeSourcesService';
import { useAudioStore } from '../../stores/audioStore';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Clock,
  Heart,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Wind
} from 'lucide-react';
import { toast } from 'sonner';

// Soft audio chime for breath guidance
function playBreathChime(pitch: 'high' | 'low') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch === 'high' ? 587.33 : 392.0, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Ignore audio context autoplay blocks
  }
}

export const GuidedMeditationTab: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['guided-meditations'],
    queryFn: freeSourcesService.getGuidedMeditations,
    staleTime: 1000 * 60 * 30
  });

  const meditations: GuidedMeditationItem[] = data?.meditations || [];
  const [selectedId, setSelectedId] = useState<string>('med_box_breathing');
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Breathing Pacer State
  type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'holdAfter';
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);

  const activeMeditation = meditations.find(m => m.id === selectedId) || meditations[0];
  const pattern = activeMeditation?.breathingPattern || {
    inhaleSec: 4,
    holdSec: 4,
    exhaleSec: 4,
    holdAfterExhaleSec: 4
  };

  // Reset when selecting a different meditation
  useEffect(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
    setPhase('inhale');
    setPhaseSecondsLeft(pattern.inhaleSec);
    setTotalSecondsElapsed(0);
    setCycleCount(0);
  }, [selectedId]);

  // Breathing Timer Logic
  useEffect(() => {
    let timer: any = null;
    if (isActive) {
      timer = setInterval(() => {
        setTotalSecondsElapsed(s => s + 1);

        setPhaseSecondsLeft(prev => {
          if (prev <= 1) {
            // Transition to next phase
            if (phase === 'inhale') {
              if (pattern.holdSec > 0) {
                setPhase('hold');
                playBreathChime('low');
                return pattern.holdSec;
              } else {
                setPhase('exhale');
                playBreathChime('low');
                return pattern.exhaleSec;
              }
            } else if (phase === 'hold') {
              setPhase('exhale');
              playBreathChime('low');
              return pattern.exhaleSec;
            } else if (phase === 'exhale') {
              if (pattern.holdAfterExhaleSec > 0) {
                setPhase('holdAfter');
                return pattern.holdAfterExhaleSec;
              } else {
                setPhase('inhale');
                setCycleCount(c => c + 1);
                playBreathChime('high');
                return pattern.inhaleSec;
              }
            } else {
              setPhase('inhale');
              setCycleCount(c => c + 1);
              playBreathChime('high');
              return pattern.inhaleSec;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isActive, phase, pattern]);

  const toggleSession = () => {
    if (!isActive) {
      playBreathChime('high');
      setIsActive(true);
      toast.info(`Started ${activeMeditation?.title || 'Meditation'}`);
    } else {
      setIsActive(false);
    }
  };

  const resetSession = () => {
    setIsActive(false);
    setPhase('inhale');
    setPhaseSecondsLeft(pattern.inhaleSec);
    setTotalSecondsElapsed(0);
    setCycleCount(0);
  };

  const phaseInstruction = {
    inhale: 'Breathe In Deeply...',
    hold: 'Hold Gently...',
    exhale: 'Slowly Exhale Tension...',
    holdAfter: 'Rest in Stillness...'
  }[phase];

  const scaleClass = {
    inhale: 'scale-125 duration-[4000ms]',
    hold: 'scale-125 duration-1000',
    exhale: 'scale-90 duration-[4000ms]',
    holdAfter: 'scale-90 duration-1000'
  }[phase];

  return (
    <div className="space-y-6">
      {/* Visual Breath Pacer & Active Sanctuary */}
      {activeMeditation && (
        <Card className="p-8 sm:p-10 relative overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 text-white border-purple-800/40 shadow-soft-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-purple-200 text-xs font-bold border border-white/10">
              <Wind className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeMeditation.technique}</span>
              <span className="text-purple-300">•</span>
              <span>{activeMeditation.durationMinutes} Min Practice</span>
            </div>

            <div className="max-w-xl space-y-1">
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeMeditation.title}
              </h3>
              <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
                {activeMeditation.description}
              </p>
            </div>

            {/* Pulsing Breathing Ring */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4">
              {/* Outer Glow Halo */}
              <div
                className={`absolute inset-0 rounded-full bg-purple-500/20 blur-2xl transition-all transform ease-in-out ${
                  isActive ? scaleClass : 'scale-100'
                }`}
              />

              {/* Middle Rhythm Ring */}
              <div
                className={`absolute inset-4 rounded-full border-2 border-purple-400/40 border-dashed transition-all transform ease-in-out ${
                  isActive ? scaleClass : 'scale-100'
                }`}
              />

              {/* Core Expanding Ball */}
              <div
                className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-pink-500 shadow-2xl flex flex-col items-center justify-center p-4 transition-all transform ease-in-out ${
                  isActive ? scaleClass : 'scale-100'
                }`}
              >
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-200">
                  {phase}
                </span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight my-1">
                  {phaseSecondsLeft}s
                </span>
                <span className="text-xs font-medium text-purple-100/90 text-center line-clamp-1">
                  {phaseInstruction}
                </span>
              </div>
            </div>

            {/* Session Stats & Controls */}
            <div className="flex items-center gap-6 text-xs text-purple-200/80 font-bold">
              <span>Completed Cycles: <strong className="text-emerald-400">{cycleCount}</strong></span>
              <span>•</span>
              <span>Session Time: <strong className="text-white">{Math.floor(totalSecondsElapsed / 60)}m {totalSecondsElapsed % 60}s</strong></span>
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={toggleSession}
                className="gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-soft-lg text-white font-bold"
              >
                {isActive ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    Pause Breathwork
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                    Begin Breath Practice
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={resetSession}
                className="rounded-2xl text-purple-200 hover:text-white hover:bg-white/10"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Routine Guidance Script Stepper */}
      {activeMeditation && activeMeditation.guidanceScript.length > 0 && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-cozy-text dark:text-cozy-darkText uppercase tracking-wider">
                Step-by-Step Mindful Guidance
              </h4>
              <p className="text-xs text-cozy-muted">
                Follow these cues gently throughout your practice.
              </p>
            </div>
            <Badge variant="lavender" size="sm">
              Step {currentStepIndex + 1} of {activeMeditation.guidanceScript.length}
            </Badge>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40">
            <p className="text-sm font-medium text-cozy-text dark:text-cozy-darkText leading-relaxed">
              "{activeMeditation.guidanceScript[currentStepIndex]}"
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={currentStepIndex === 0}
              onClick={() => setCurrentStepIndex(c => Math.max(0, c - 1))}
              className="text-xs"
            >
              Previous Cue
            </Button>
            <div className="flex gap-1">
              {activeMeditation.guidanceScript.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStepIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    currentStepIndex === i
                      ? 'bg-purple-600 scale-125'
                      : 'bg-purple-200 dark:bg-purple-900'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentStepIndex >= activeMeditation.guidanceScript.length - 1}
              onClick={() => setCurrentStepIndex(c => c + 1)}
              className="text-xs gap-1"
            >
              Next Cue <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Meditation Routine Library */}
      <div className="space-y-3">
        <h4 className="text-sm font-black text-cozy-text dark:text-cozy-darkText uppercase tracking-wider">
          Mindfulness & Somatic Library
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meditations.map(item => {
            const isSelected = item.id === selectedId;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-soft-sm ring-2 ring-purple-500/20'
                    : 'border-purple-100 dark:border-purple-900/30 bg-white dark:bg-cozy-darkCard hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.category === 'breathwork'
                            ? 'mint'
                            : item.category === 'sleep_nidra'
                            ? 'lavender'
                            : item.category === 'body_scan'
                            ? 'sky'
                            : 'peach'
                        }
                        size="sm"
                      >
                        {item.category.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <span className="text-xs font-semibold text-cozy-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.durationMinutes} mins
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                      {item.title}
                    </h5>
                  </div>
                  {isSelected && (
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-cozy-muted line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="flex items-center justify-between text-xs text-cozy-lavender font-bold pt-2 border-t border-purple-50 dark:border-purple-900/20">
                  <span className="text-[11px] text-cozy-muted font-normal">
                    Ambient: {item.ambientTrackTitle}
                  </span>
                  <span className="flex items-center gap-0.5">
                    {isSelected ? 'Loaded' : 'Select'} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
