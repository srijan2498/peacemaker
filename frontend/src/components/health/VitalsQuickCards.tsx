import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import {
  HealthRecordSummary,
  StepsRecordData,
  WaterRecordData,
  BloodPressureRecordData,
  WeightRecordData,
  HEALTH_REFERENCE_RANGES,
  WaterAlertSettings
} from 'cozynest-shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

// Elegant MUI React Icons (Zero Emojis)
import DirectionsWalkOutlinedIcon from '@mui/icons-material/DirectionsWalkOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import ScaleOutlinedIcon from '@mui/icons-material/ScaleOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined';
import VolumeUpOutlinedIcon from '@mui/icons-material/VolumeUpOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import PauseOutlinedIcon from '@mui/icons-material/PauseOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import SyncOutlinedIcon from '@mui/icons-material/SyncOutlined';
import WhatshotOutlinedIcon from '@mui/icons-material/WhatshotOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';

// Sound effect for water reminder
function playWaterChime() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    [659.25, 880].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.15);
      osc.stop(ctx.currentTime + idx * 0.15 + 0.35);
    });
  } catch {}
}

interface VitalsQuickCardsProps {
  todaySteps?: HealthRecordSummary;
  todayWater?: HealthRecordSummary;
  latestBp?: HealthRecordSummary;
  latestWeight?: HealthRecordSummary;
  onSaveVitals: (type: string, data: any) => Promise<void>;
}

export const VitalsQuickCards: React.FC<VitalsQuickCardsProps> = ({
  todaySteps,
  todayWater,
  latestBp,
  latestWeight,
  onSaveVitals
}) => {
  const queryClient = useQueryClient();

  // Steps State - strictly from DB, no prepopulated default dummy values
  const [stepsInput, setStepsInput] = useState<string>('');
  const [isStepsOpen, setIsStepsOpen] = useState(false);

  // Physical Accelerometer Pedometer State
  const [isPedometerActive, setIsPedometerActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cozynest_pedometer_active') === 'true';
    } catch {
      return false;
    }
  });
  const [isPedometerModalOpen, setIsPedometerModalOpen] = useState(false);
  const [sessionSteps, setSessionSteps] = useState(0);
  const [motionMagnitude, setMotionMagnitude] = useState<number>(9.8);
  const [isSensorAvailable, setIsSensorAvailable] = useState<boolean | null>(null);
  const [isStationary, setIsStationary] = useState<boolean>(true);
  const [stepSensitivity, setStepSensitivity] = useState<'normal' | 'sensitive' | 'low'>('normal');

  const sessionStepsRef = useRef(0);
  const totalBaseStepsRef = useRef((todaySteps?.data as StepsRecordData)?.stepsCount || 0);
  const lastSyncStepsRef = useRef(0);

  // Keep totalBaseStepsRef synced with todaySteps prop
  useEffect(() => {
    const dbSteps = (todaySteps?.data as StepsRecordData)?.stepsCount || 0;
    if (dbSteps > totalBaseStepsRef.current) {
      totalBaseStepsRef.current = dbSteps;
    }
  }, [todaySteps]);

  // Handle single physical step increment
  const handlePhysicalStepDetected = () => {
    sessionStepsRef.current += 1;
    setSessionSteps(sessionStepsRef.current);

    // Auto-sync every 20 steps
    if (sessionStepsRef.current - lastSyncStepsRef.current >= 20) {
      syncStepsToBackend();
    }
  };

  const syncStepsToBackend = async () => {
    const totalSteps = totalBaseStepsRef.current + sessionStepsRef.current;
    if (totalSteps <= 0) return;
    lastSyncStepsRef.current = sessionStepsRef.current;

    const distanceMeters = Math.round(totalSteps * 0.76);
    const caloriesBurned = Math.round(totalSteps * 0.04);
    const activeMinutes = Math.max(1, Math.round(totalSteps / 100));

    try {
      await onSaveVitals('steps', {
        stepsCount: totalSteps,
        goalSteps: 10000,
        distanceMeters,
        caloriesBurned,
        activeMinutes
      });
    } catch (e) {
      console.error('Failed to auto-sync steps', e);
    }
  };

  // TRUE PHYSICAL PEDOMETER ENGINE (Like native mobile device pedometers)
  // Strictly uses hardware accelerometer delta peaks. NO FAKE INTERVAL CLOCKS!
  useEffect(() => {
    if (!isPedometerActive) return;

    let rollingGravity = 9.8;
    let lastStepTime = 0;
    let lastCandidateTime = 0;
    let consecutiveGaitCount = 0;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x === null || acc.y === null || acc.z === null) return;
      setIsSensorAvailable(true);

      const rawMag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
      setMotionMagnitude(Math.round(rawMag * 10) / 10);

      // Low-pass filter to isolate steady Earth gravity
      rollingGravity = 0.90 * rollingGravity + 0.10 * rawMag;
      // Linear acceleration dynamic excursion
      const dynamicDelta = Math.abs(rawMag - rollingGravity);

      const now = Date.now();

      // If resting still on table or in still hand, dynamic excursion is negligible (< 0.7 m/s^2)
      if (dynamicDelta < 0.7) {
        setIsStationary(true);
        consecutiveGaitCount = 0;
        return;
      }

      setIsStationary(false);

      // Physical gait peak threshold:
      // A genuine human footstrike causes a distinct vertical acceleration surge
      const minPeakDelta = stepSensitivity === 'sensitive' ? 1.4 : stepSensitivity === 'low' ? 2.6 : 1.9;

      if (dynamicDelta > minPeakDelta && now - lastStepTime > 260) {
        const timeSinceLastCandidate = now - lastCandidateTime;

        // Human walking cadence constraint (260ms to 1250ms interval between steps)
        if (timeSinceLastCandidate >= 260 && timeSinceLastCandidate <= 1250) {
          consecutiveGaitCount += 1;
          // Valid physical step registered
          handlePhysicalStepDetected();
        } else {
          // Reset cadence window
          consecutiveGaitCount = 1;
        }

        lastCandidateTime = now;
        lastStepTime = now;
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleDeviceMotion);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleDeviceMotion);
      }
    };
  }, [isPedometerActive, stepSensitivity]);

  const togglePedometer = async () => {
    const nextState = !isPedometerActive;
    if (nextState) {
      if (typeof (DeviceMotionEvent as any)?.requestPermission === 'function') {
        try {
          await (DeviceMotionEvent as any).requestPermission();
        } catch {}
      }
      setIsPedometerActive(true);
      try {
        localStorage.setItem('cozynest_pedometer_active', 'true');
      } catch {}
      toast.success('Pedometer active. Tracking physical walking steps via hardware motion sensor.');
    } else {
      setIsPedometerActive(false);
      try {
        localStorage.setItem('cozynest_pedometer_active', 'false');
      } catch {}
      await syncStepsToBackend();
      toast.info('Pedometer paused and steps synced to record.');
    }
  };

  // Water State
  const currentWaterMl = (todayWater?.data as WaterRecordData)?.amountMl || 0;
  const waterGoalMl = (todayWater?.data as WaterRecordData)?.goalMl || 2500;

  // Water Alert Settings (persisted in localStorage)
  const [waterAlert, setWaterAlert] = useState<WaterAlertSettings>(() => {
    try {
      const saved = localStorage.getItem('cozynest_water_alert');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      enabled: false,
      intervalMinutes: 60,
      soundEnabled: true,
      startHour: 8,
      endHour: 22
    };
  });
  const [isWaterAlertModalOpen, setIsWaterAlertModalOpen] = useState(false);
  const alertTimerRef = useRef<any>(null);

  // Blood Pressure State - strictly no prepopulated default dummy values
  const [bpModalOpen, setBpModalOpen] = useState(false);
  const [systolic, setSystolic] = useState<string>('');
  const [diastolic, setDiastolic] = useState<string>('');
  const [pulse, setPulse] = useState<string>('');

  // Weight State - strictly no prepopulated default dummy values
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');

  // Manage Water Alert Timer & Push to Notification Bell Icon
  useEffect(() => {
    if (alertTimerRef.current) clearInterval(alertTimerRef.current);

    if (waterAlert.enabled) {
      const intervalMs = waterAlert.intervalMinutes * 60 * 1000;
      alertTimerRef.current = setInterval(async () => {
        const currentHour = new Date().getHours();
        if (currentHour >= waterAlert.startHour && currentHour < waterAlert.endHour) {
          if (waterAlert.soundEnabled) {
            playWaterChime();
          }

          // Push into Notification Bell Icon in Navbar
          try {
            await api.post('/notifications', {
              title: 'Hydration Reminder',
              body: 'Time to drink a fresh glass of water (250ml) to stay refreshed and focused.',
              type: 'health_alert'
            });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          } catch (e) {
            console.error('Failed to push hydration notification', e);
          }

          toast('Hydration Reminder', {
            description: 'Time to drink a fresh glass of water (250ml) to stay refreshed and focused.',
            action: {
              label: '+250ml Drank',
              onClick: () => handleAddWater(250)
            },
            duration: 8000
          });
        }
      }, intervalMs);
    }

    return () => {
      if (alertTimerRef.current) clearInterval(alertTimerRef.current);
    };
  }, [waterAlert]);

  const toggleWaterAlert = () => {
    const updated = { ...waterAlert, enabled: !waterAlert.enabled };
    setWaterAlert(updated);
    try {
      localStorage.setItem('cozynest_water_alert', JSON.stringify(updated));
    } catch {}

    if (updated.enabled) {
      playWaterChime();
      toast.success(`Water Alert active. Hydration reminders will trigger every ${updated.intervalMinutes} mins.`);
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } else {
      toast.info('Water drinking alerts turned off');
    }
  };

  const saveWaterAlertSettings = (newSettings: WaterAlertSettings) => {
    setWaterAlert(newSettings);
    try {
      localStorage.setItem('cozynest_water_alert', JSON.stringify(newSettings));
    } catch {}
    setIsWaterAlertModalOpen(false);
    toast.success('Water alert schedule saved');
  };

  // Quick Add Water
  const handleAddWater = async (ml: number) => {
    const newAmount = currentWaterMl + ml;
    await onSaveVitals('water', {
      amountMl: newAmount,
      goalMl: waterGoalMl
    });
    playWaterChime();
    toast.success(`Logged +${ml}ml water`);
  };

  // Save Steps
  const handleSaveSteps = async () => {
    const parsed = parseInt(stepsInput, 10);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid step count');
      return;
    }
    const distanceMeters = Math.round(parsed * 0.76);
    const caloriesBurned = Math.round(parsed * 0.04);
    const activeMinutes = Math.round(parsed / 100);

    await onSaveVitals('steps', {
      stepsCount: parsed,
      goalSteps: 10000,
      distanceMeters,
      caloriesBurned,
      activeMinutes
    });
    setIsStepsOpen(false);
  };

  // Save BP
  const handleSaveBp = async () => {
    const sys = parseInt(systolic, 10);
    const dia = parseInt(diastolic, 10);
    const pul = parseInt(pulse, 10) || 72;

    if (isNaN(sys) || isNaN(dia)) {
      toast.error('Please enter valid systolic and diastolic blood pressure values');
      return;
    }

    let category: 'normal' | 'elevated' | 'stage1' | 'stage2' | 'crisis' = 'normal';
    if (sys >= 180 || dia >= 120) category = 'crisis';
    else if (sys >= 140 || dia >= 90) category = 'stage2';
    else if (sys >= 130 || dia >= 80) category = 'stage1';
    else if (sys >= 120 && dia < 80) category = 'elevated';

    await onSaveVitals('blood_pressure', {
      systolic: sys,
      diastolic: dia,
      pulseBpm: pul,
      category
    });
    setBpModalOpen(false);
  };

  // Save Weight & BMI
  const handleSaveWeight = async () => {
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm) || 170;

    if (isNaN(w) || w <= 0) {
      toast.error('Please enter a valid weight in kg');
      return;
    }

    const heightM = h / 100;
    const bmi = parseFloat((w / (heightM * heightM)).toFixed(1));
    let bmiCategory: 'underweight' | 'normal' | 'overweight' | 'obese' = 'normal';
    if (bmi < 18.5) bmiCategory = 'underweight';
    else if (bmi < 25) bmiCategory = 'normal';
    else if (bmi < 30) bmiCategory = 'overweight';
    else bmiCategory = 'obese';

    await onSaveVitals('weight', {
      weightKg: w,
      heightCm: h,
      bmi,
      bmiCategory
    });
    setWeightModalOpen(false);
  };

  const stepsData: StepsRecordData | null = todaySteps ? (todaySteps.data as StepsRecordData) : null;
  const bpData: BloodPressureRecordData | null = latestBp ? (latestBp.data as BloodPressureRecordData) : null;
  const weightData: WeightRecordData | null = latestWeight ? (latestWeight.data as WeightRecordData) : null;

  const currentTotalSteps = (stepsData?.stepsCount || 0) + sessionSteps;
  const currentDistanceMeters = Math.round(currentTotalSteps * 0.76);
  const currentCaloriesBurned = Math.round(currentTotalSteps * 0.04);
  const currentActiveMins = Math.max(0, Math.round(currentTotalSteps / 100));

  const waterPercent = Math.min(100, Math.round((currentWaterMl / waterGoalMl) * 100));
  const stepsPercent = Math.min(100, Math.round((currentTotalSteps / 10000) * 100));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. DAILY STEPS & ACTIVITY + HARDWARE MOTION PEDOMETER */}
        <Card className="p-4 border-sky-100 dark:border-sky-950/40 bg-gradient-to-br from-sky-50/40 via-white to-indigo-50/20 dark:from-sky-950/20 dark:to-cozy-darkCard space-y-3 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-xl transition-all ${
                  isPedometerActive
                    ? 'bg-emerald-500 text-white shadow-soft-sm'
                    : 'bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300'
                }`}>
                  <DirectionsWalkOutlinedIcon sx={{ fontSize: 18 }} />
                </span>
                <div>
                  <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText block">Steps & Walk</span>
                  {isPedometerActive && (
                    <span className={`text-[9px] font-black flex items-center gap-1 ${
                      isStationary
                        ? 'text-cozy-muted'
                        : 'text-emerald-600 dark:text-emerald-400 animate-pulse'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isStationary ? 'bg-slate-400' : 'bg-emerald-500 animate-ping'}`} />
                      {isStationary ? 'Stationary' : 'Walking'}
                    </span>
                  )}
                </div>
              </div>

              {/* Pedometer action buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={togglePedometer}
                  className={`px-2 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-all ${
                    isPedometerActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft-sm'
                      : 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-200'
                  }`}
                  title={isPedometerActive ? 'Pedometer Active. Click to pause' : 'Turn ON Hardware Pedometer'}
                >
                  <PhoneIphoneOutlinedIcon sx={{ fontSize: 13 }} />
                  <span>{isPedometerActive ? 'Active' : 'Pedometer'}</span>
                </button>

                <button
                  onClick={() => setIsPedometerModalOpen(true)}
                  className="p-1.5 rounded-xl text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 transition-colors"
                  title="Pedometer Sensor Monitor"
                >
                  <SpeedOutlinedIcon sx={{ fontSize: 15 }} />
                </button>

                <button
                  onClick={() => {
                    setStepsInput('');
                    setIsStepsOpen(true);
                  }}
                  className="p-1.5 px-2 rounded-xl text-[11px] font-bold text-cozy-muted hover:text-cozy-text bg-slate-100 dark:bg-slate-800 transition-colors"
                  title="Manual Step Log"
                >
                  {currentTotalSteps > 0 ? 'Edit' : '+ Log'}
                </button>
              </div>
            </div>

            <div className="mt-3">
              {currentTotalSteps > 0 ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-sky-600 dark:text-sky-400 tracking-tight">
                        {currentTotalSteps.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-cozy-muted">/ 10,000 steps</span>
                    </div>

                    {isPedometerActive && sessionSteps > 0 && (
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        +{sessionSteps} walked
                      </span>
                    )}
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${stepsPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-cozy-muted mt-2 font-semibold">
                    <span>{(currentDistanceMeters / 1000).toFixed(2)} km</span>
                    <span>•</span>
                    <span>{currentCaloriesBurned} kcal</span>
                    <span>•</span>
                    <span>{currentActiveMins} mins</span>
                  </div>

                  {isPedometerActive && (
                    <div className="mt-2 pt-2 border-t border-sky-100/60 dark:border-sky-900/30 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                        <SpeedOutlinedIcon sx={{ fontSize: 12 }} />
                        <span>{isStationary ? 'Stationary (0 Movement)' : 'Physical Gait Active'}</span>
                      </span>
                      <button
                        onClick={syncStepsToBackend}
                        className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <SyncOutlinedIcon sx={{ fontSize: 12 }} />
                        <span>Sync</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-2.5 text-center">
                  <span className="text-2xl font-black text-cozy-muted tracking-tight">--</span>
                  <p className="text-[11px] text-cozy-muted mt-0.5">No steps recorded today</p>
                  <button
                    onClick={togglePedometer}
                    className="mt-2 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 dark:bg-sky-950/50 px-3 py-1 rounded-xl mx-auto flex items-center gap-1.5 transition-all shadow-soft-sm"
                  >
                    <DirectionsWalkOutlinedIcon sx={{ fontSize: 15 }} />
                    <span>Start Hardware Pedometer</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Healthy Clinical Reference Range */}
          <div className="pt-2 border-t border-sky-100/60 dark:border-sky-900/30 text-[10px] text-cozy-muted flex items-start gap-1.5">
            <InfoOutlinedIcon sx={{ fontSize: 14 }} className="text-sky-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-800 dark:text-sky-300">Healthy Range: </span>
              <span>{HEALTH_REFERENCE_RANGES.STEPS.target}</span>
            </div>
          </div>
        </Card>

        {/* 2. WATER & HYDRATION + ALERT FUNCTIONALITY */}
        <Card className="p-4 border-cyan-100 dark:border-cyan-950/40 bg-gradient-to-br from-cyan-50/40 via-white to-blue-50/20 dark:from-cyan-950/20 dark:to-cozy-darkCard space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/50 dark:text-cyan-300">
                  <WaterDropOutlinedIcon sx={{ fontSize: 18 }} />
                </span>
                <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">Hydration</span>
              </div>

              {/* Water Alert Toggle Button */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleWaterAlert}
                  className={`p-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    waterAlert.enabled
                      ? 'bg-cyan-500 text-white shadow-soft-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-cozy-muted hover:text-cozy-text'
                  }`}
                  title={waterAlert.enabled ? `Alert ON (Every ${waterAlert.intervalMinutes}m)` : 'Turn ON drinking alert'}
                >
                  {waterAlert.enabled ? (
                    <NotificationsActiveOutlinedIcon sx={{ fontSize: 15 }} className="animate-pulse" />
                  ) : (
                    <NotificationsOffOutlinedIcon sx={{ fontSize: 15 }} />
                  )}
                  <span className="text-[10px]">{waterAlert.enabled ? 'Alert' : 'Off'}</span>
                </button>

                <button
                  onClick={() => setIsWaterAlertModalOpen(true)}
                  className="p-1 rounded-lg text-cozy-muted hover:text-cozy-text"
                  title="Configure Alert Schedule"
                >
                  <TimerOutlinedIcon sx={{ fontSize: 15 }} />
                </button>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {(currentWaterMl / 1000).toFixed(1)}L
                </span>
                <span className="text-xs font-semibold text-cozy-muted">
                  / {(waterGoalMl / 1000).toFixed(1)}L Goal ({waterPercent}%)
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>

              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => handleAddWater(250)}
                  className="flex-1 py-1 px-2 text-xs font-bold rounded-xl bg-cyan-100/70 hover:bg-cyan-200/70 dark:bg-cyan-900/40 dark:hover:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 transition-colors"
                >
                  +250ml Glass
                </button>
                <button
                  onClick={() => handleAddWater(500)}
                  className="flex-1 py-1 px-2 text-xs font-bold rounded-xl bg-blue-100/70 hover:bg-blue-200/70 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-200 transition-colors"
                >
                  +500ml Bottle
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-cyan-100/60 dark:border-cyan-900/30 text-[10px] text-cozy-muted flex items-start gap-1.5">
            <InfoOutlinedIcon sx={{ fontSize: 14 }} className="text-cyan-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-800 dark:text-cyan-300">Healthy Range: </span>
              <span>{HEALTH_REFERENCE_RANGES.WATER.target}</span>
            </div>
          </div>
        </Card>

        {/* 3. BLOOD PRESSURE */}
        <Card className="p-4 border-rose-100 dark:border-rose-950/40 bg-gradient-to-br from-rose-50/40 via-white to-pink-50/20 dark:from-rose-950/20 dark:to-cozy-darkCard space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
                  <MonitorHeartOutlinedIcon sx={{ fontSize: 18 }} />
                </span>
                <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">Blood Pressure</span>
              </div>
              <button
                onClick={() => {
                  setSystolic('');
                  setDiastolic('');
                  setPulse('');
                  setBpModalOpen(true);
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-lg"
              >
                + Record
              </button>
            </div>

            <div className="mt-2.5">
              {bpData ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                      {bpData.systolic} / {bpData.diastolic}
                    </span>
                    <span className="text-xs font-semibold text-cozy-muted">mmHg</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <Badge
                      variant={bpData.category === 'normal' ? 'mint' : bpData.category === 'elevated' ? 'peach' : 'rose'}
                      size="sm"
                    >
                      {bpData.category?.toUpperCase()}
                    </Badge>
                    <span className="text-[11px] font-bold text-cozy-muted">
                      {bpData.pulseBpm || 72} BPM
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center">
                  <span className="text-2xl font-black text-cozy-muted tracking-tight">-- / --</span>
                  <p className="text-[11px] text-cozy-muted mt-0.5">No BP checkup logged</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-rose-100/60 dark:border-rose-900/30 text-[10px] text-cozy-muted flex items-start gap-1.5">
            <InfoOutlinedIcon sx={{ fontSize: 14 }} className="text-rose-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-800 dark:text-rose-300">Healthy Range: </span>
              <span>{HEALTH_REFERENCE_RANGES.BLOOD_PRESSURE.target}</span>
            </div>
          </div>
        </Card>

        {/* 4. WEIGHT & BMI */}
        <Card className="p-4 border-emerald-100 dark:border-emerald-950/40 bg-gradient-to-br from-emerald-50/40 via-white to-green-50/20 dark:from-emerald-950/20 dark:to-cozy-darkCard space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <ScaleOutlinedIcon sx={{ fontSize: 18 }} />
                </span>
                <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">Weight & BMI</span>
              </div>
              <button
                onClick={() => {
                  setWeightKg('');
                  setHeightCm('');
                  setWeightModalOpen(true);
                }}
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg"
              >
                + Update
              </button>
            </div>

            <div className="mt-2.5">
              {weightData ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {weightData.weightKg}
                    </span>
                    <span className="text-xs font-semibold text-cozy-muted">kg</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <Badge
                      variant={weightData.bmiCategory === 'normal' ? 'mint' : 'peach'}
                      size="sm"
                    >
                      BMI {weightData.bmi} ({weightData.bmiCategory?.toUpperCase()})
                    </Badge>
                    <span className="text-[11px] text-cozy-muted">
                      Height: {weightData.heightCm || 170} cm
                    </span>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center">
                  <span className="text-2xl font-black text-cozy-muted tracking-tight">-- kg</span>
                  <p className="text-[11px] text-cozy-muted mt-0.5">No weight logged</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-100/60 dark:border-emerald-900/30 text-[10px] text-cozy-muted flex items-start gap-1.5">
            <InfoOutlinedIcon sx={{ fontSize: 14 }} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-800 dark:text-emerald-300">Healthy BMI: </span>
              <span>{HEALTH_REFERENCE_RANGES.BMI.target}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Water Alert Settings Modal */}
      {isWaterAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-cyan-100 dark:border-cyan-900/40 shadow-soft-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-50 dark:border-cyan-900/20">
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
                <WaterDropOutlinedIcon sx={{ fontSize: 18 }} className="text-cyan-600" />
                <span>Water Drinking Alert Setup</span>
              </h3>
              <button onClick={() => setIsWaterAlertModalOpen(false)} className="text-cozy-muted hover:text-cozy-text text-sm font-bold">✕</button>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/30 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText block">Enable Hydration Reminders</span>
                  <span className="text-[10px] text-cozy-muted">Sends alerts to notification bell</span>
                </div>
                <input
                  type="checkbox"
                  checked={waterAlert.enabled}
                  onChange={e => setWaterAlert({ ...waterAlert, enabled: e.target.checked })}
                  className="w-5 h-5 accent-cyan-600 rounded"
                />
              </label>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Reminder Frequency</label>
                <select
                  value={waterAlert.intervalMinutes}
                  onChange={e => setWaterAlert({ ...waterAlert, intervalMinutes: parseInt(e.target.value, 10) })}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs font-bold outline-none"
                >
                  <option value={30}>Every 30 minutes</option>
                  <option value={45}>Every 45 minutes</option>
                  <option value={60}>Every 1 hour (Recommended)</option>
                  <option value={90}>Every 1.5 hours</option>
                  <option value={120}>Every 2 hours</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Start From</label>
                  <select
                    value={waterAlert.startHour}
                    onChange={e => setWaterAlert({ ...waterAlert, startHour: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs outline-none"
                  >
                    {[6, 7, 8, 9, 10].map(h => (
                      <option key={h} value={h}>{h}:00 AM</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Until</label>
                  <select
                    value={waterAlert.endHour}
                    onChange={e => setWaterAlert({ ...waterAlert, endHour: parseInt(e.target.value, 10) })}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs outline-none"
                  >
                    {[20, 21, 22, 23].map(h => (
                      <option key={h} value={h}>{h - 12}:00 PM</option>
                    ))}
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-cozy-text dark:text-cozy-darkText cursor-pointer">
                <input
                  type="checkbox"
                  checked={waterAlert.soundEnabled}
                  onChange={e => setWaterAlert({ ...waterAlert, soundEnabled: e.target.checked })}
                  className="accent-cyan-600 rounded"
                />
                <span>Play gentle water chime tone</span>
              </label>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => playWaterChime()}
                  className="text-xs font-bold text-cyan-600 flex items-center gap-1 hover:underline"
                >
                  <VolumeUpOutlinedIcon sx={{ fontSize: 16 }} />
                  <span>Test Chime</span>
                </button>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setIsWaterAlertModalOpen(false)}>Cancel</Button>
                  <Button
                    variant="primary"
                    onClick={() => saveWaterAlertSettings(waterAlert)}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    Save Alert
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Steps Modal - Clean inputs without prepopulated values */}
      {isStepsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-sky-100 dark:border-sky-900/40 shadow-soft-xl space-y-4">
            <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
              <DirectionsWalkOutlinedIcon sx={{ fontSize: 20 }} className="text-sky-600" />
              <span>Record Today's Steps</span>
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-cozy-text">Step Count</label>
              <input
                type="number"
                min="0"
                max="80000"
                step="100"
                placeholder="Enter steps count (e.g. 7500)"
                value={stepsInput}
                onChange={e => setStepsInput(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs font-bold outline-none"
                required
              />
            </div>
            <p className="text-[10px] text-cozy-muted">
              Standard cardiovascular target is 7,500 – 10,000 steps (~6 to 8 km) daily.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsStepsOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveSteps} className="bg-sky-600 hover:bg-sky-700 text-white">Save Steps</Button>
            </div>
          </div>
        </div>
      )}

      {/* Record BP Modal - Clean inputs */}
      {bpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-rose-100 dark:border-rose-900/40 shadow-soft-xl space-y-4">
            <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
              <MonitorHeartOutlinedIcon sx={{ fontSize: 20 }} className="text-rose-600" />
              <span>Record Blood Pressure</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text">Systolic (Top)</label>
                <input
                  type="number"
                  min="70"
                  max="260"
                  placeholder="e.g. 120"
                  value={systolic}
                  onChange={e => setSystolic(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs font-bold outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text">Diastolic (Bottom)</label>
                <input
                  type="number"
                  min="40"
                  max="160"
                  placeholder="e.g. 80"
                  value={diastolic}
                  onChange={e => setDiastolic(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs font-bold outline-none"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-cozy-text">Pulse (Heart Rate BPM)</label>
              <input
                type="number"
                min="40"
                max="220"
                placeholder="e.g. 72"
                value={pulse}
                onChange={e => setPulse(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs font-bold outline-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setBpModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveBp} className="bg-rose-600 hover:bg-rose-700 text-white">Save BP</Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Weight Modal - Clean inputs */}
      {weightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-emerald-100 dark:border-emerald-900/40 shadow-soft-xl space-y-4">
            <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
              <ScaleOutlinedIcon sx={{ fontSize: 20 }} className="text-emerald-600" />
              <span>Record Weight & Height</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="250"
                  placeholder="e.g. 68.5"
                  value={weightKg}
                  onChange={e => setWeightKg(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs font-bold outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text">Height (cm)</label>
                <input
                  type="number"
                  min="50"
                  max="250"
                  placeholder="e.g. 172"
                  value={heightCm}
                  onChange={e => setHeightCm(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs font-bold outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setWeightModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveWeight} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Weight</Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Pedometer Hardware Monitor Modal */}
      {isPedometerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-sky-100 dark:border-sky-900/40 shadow-soft-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-sky-50 dark:border-sky-900/20">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/50 dark:text-sky-300">
                  <DirectionsWalkOutlinedIcon sx={{ fontSize: 22 }} />
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-cozy-text dark:text-cozy-darkText tracking-tight">
                    Hardware Pedometer Monitor
                  </h3>
                  <p className="text-[11px] text-cozy-muted">Physical accelerometer gait detection (Native sensor mode)</p>
                </div>
              </div>
              <button
                onClick={() => setIsPedometerModalOpen(false)}
                className="text-cozy-muted hover:text-cozy-text text-sm font-bold p-1 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Live Steps Display */}
            <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-purple-500/10 border border-sky-200/50 dark:border-sky-800/30 text-center space-y-2 relative overflow-hidden">
              <span className="text-[11px] font-bold text-cozy-muted uppercase tracking-wider block">
                Total Steps Today
              </span>

              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
                  {currentTotalSteps.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-cozy-muted">steps</span>
              </div>

              {sessionSteps > 0 && (
                <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  +{sessionSteps} steps tracked in this session
                </p>
              )}

              {/* Triple Metrics */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-sky-200/40 dark:border-sky-800/20 text-xs">
                <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50">
                  <span className="text-[10px] font-bold text-cozy-muted block">Distance</span>
                  <span className="font-black text-cozy-text dark:text-cozy-darkText">
                    {(currentDistanceMeters / 1000).toFixed(2)} km
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50">
                  <span className="text-[10px] font-bold text-cozy-muted block">Burned</span>
                  <span className="font-black text-orange-600 dark:text-orange-400">
                    {currentCaloriesBurned} kcal
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50">
                  <span className="text-[10px] font-bold text-cozy-muted block">Active Time</span>
                  <span className="font-black text-indigo-600 dark:text-indigo-400">
                    {currentActiveMins} min
                  </span>
                </div>
              </div>
            </div>

            {/* Hardware Sensor Real-Time Feed */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-1.5">
                  <SpeedOutlinedIcon sx={{ fontSize: 16 }} className="text-sky-500" />
                  <span>Real-Time Sensor Acceleration:</span>
                </span>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {motionMagnitude} m/s²
                </span>
              </div>

              {/* Visual Acceleration Meter */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.max(5, ((motionMagnitude - 9.8) / 10) * 100))}%` }}
                />
              </div>

              {/* Physical Status Indicator */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] font-bold text-cozy-muted">Motion State:</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isStationary
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                }`}>
                  {isStationary ? 'Stationary (Resting)' : 'Physical Gait Detected'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-cozy-muted font-semibold">Sensor Sensitivity</span>
                <div className="flex gap-1">
                  {(['low', 'normal', 'sensitive'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStepSensitivity(s)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg capitalize ${
                        stepSensitivity === s
                          ? 'bg-sky-600 text-white'
                          : 'bg-white dark:bg-slate-900 text-cozy-muted'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={() => setIsPedometerModalOpen(false)}
              >
                Close
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={syncStepsToBackend}
                  className="text-xs font-bold border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300 flex items-center gap-1"
                >
                  <SyncOutlinedIcon sx={{ fontSize: 14 }} />
                  <span>Sync Now</span>
                </Button>

                <Button
                  variant="primary"
                  onClick={togglePedometer}
                  className={isPedometerActive ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
                >
                  {isPedometerActive ? (
                    <>
                      <PauseOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <span>Pause Pedometer</span>
                    </>
                  ) : (
                    <>
                      <PlayArrowOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <span>Start Pedometer</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
