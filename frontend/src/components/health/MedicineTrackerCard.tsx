import React, { useState } from 'react';
import { MedicationSummary, MedicationScheduleItem, MedicationFrequencyType } from 'cozynest-shared';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

// Elegant MUI Icons (No Emojis)
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import WbTwilightOutlinedIcon from '@mui/icons-material/WbTwilightOutlined';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

interface MedicineTrackerCardProps {
  medications: MedicationSummary[];
  onToggleTaken: (medId: string, date: string, timeSlot: string) => Promise<void>;
  onAddMedication: (payload: any) => Promise<void>;
  onDeleteMedication: (medId: string) => Promise<void>;
  onRefillMedication?: (medId: string, addedPills?: number) => Promise<void>;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TIME_SLOT_DEFS = [
  { id: 'morning', label: 'Morning', IconComponent: WbSunnyOutlinedIcon },
  { id: 'afternoon', label: 'Noon', IconComponent: LightModeOutlinedIcon },
  { id: 'evening', label: 'Evening', IconComponent: WbTwilightOutlinedIcon },
  { id: 'night', label: 'Night', IconComponent: BedtimeOutlinedIcon }
];

export const MedicineTrackerCard: React.FC<MedicineTrackerCardProps> = ({
  medications,
  onToggleTaken,
  onAddMedication,
  onDeleteMedication,
  onRefillMedication
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState('tablet');
  const [purpose, setPurpose] = useState('');

  // Frequency State
  const [frequencyType, setFrequencyType] = useState<MedicationFrequencyType>('daily');
  const [weeklyDay, setWeeklyDay] = useState<number>(0); // 0 = Sunday
  const [monthlyDay, setMonthlyDay] = useState<number>(1); // 1st of month

  const [slots, setSlots] = useState<{ morning: boolean; afternoon: boolean; evening: boolean; night: boolean }>({
    morning: true,
    afternoon: false,
    evening: false,
    night: true
  });
  const [singleSlot, setSingleSlot] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [withFood, setWithFood] = useState<'before' | 'with' | 'after' | 'any'>('after');

  // STRICTLY NO DEFAULT NUMERICAL VALUES
  const [totalPills, setTotalPills] = useState<string>('');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayDayOfWeek = today.getDay(); // 0 = Sun
  const todayDayOfMonth = today.getDate(); // 1-31

  const resetForm = () => {
    setName('');
    setDosage('');
    setForm('tablet');
    setPurpose('');
    setFrequencyType('daily');
    setWeeklyDay(0);
    setMonthlyDay(1);
    setSlots({ morning: true, afternoon: false, evening: false, night: false });
    setSingleSlot('morning');
    setWithFood('after');
    setTotalPills('');
    setLowStockThreshold('');
    setInstructions('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Medicine name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const schedules: MedicationScheduleItem[] = [];

      if (frequencyType === 'daily') {
        if (slots.morning) schedules.push({ timeSlot: 'morning', timeLabel: '08:00 AM', dosage: dosage || '1', withFood });
        if (slots.afternoon) schedules.push({ timeSlot: 'afternoon', timeLabel: '01:00 PM', dosage: dosage || '1', withFood });
        if (slots.evening) schedules.push({ timeSlot: 'evening', timeLabel: '06:00 PM', dosage: dosage || '1', withFood });
        if (slots.night) schedules.push({ timeSlot: 'night', timeLabel: '09:30 PM', dosage: dosage || '1', withFood });
      } else {
        const timeLabels: Record<string, string> = {
          morning: '08:00 AM',
          afternoon: '01:00 PM',
          evening: '06:00 PM',
          night: '09:30 PM'
        };
        schedules.push({
          timeSlot: singleSlot,
          timeLabel: timeLabels[singleSlot] || '08:00 AM',
          dosage: dosage || '1',
          withFood
        });
      }

      let frequencyDescription = 'Daily';
      if (frequencyType === 'daily') {
        frequencyDescription = `${schedules.length} time${schedules.length > 1 ? 's' : ''} daily`;
      } else if (frequencyType === 'weekly') {
        frequencyDescription = `Weekly on ${DAY_NAMES[weeklyDay]} (${singleSlot})`;
      } else if (frequencyType === 'monthly') {
        frequencyDescription = `Monthly on day ${monthlyDay} (${singleSlot})`;
      } else if (frequencyType === 'as_needed') {
        frequencyDescription = 'As Needed (SOS / PRN)';
      }

      const parsedPills = totalPills !== '' ? parseInt(totalPills, 10) : 0;
      const parsedThreshold = lowStockThreshold !== '' ? parseInt(lowStockThreshold, 10) : 5;

      await onAddMedication({
        name: name.trim(),
        dosage: dosage.trim(),
        form,
        purpose: purpose.trim(),
        frequencyType,
        daysOfWeek: frequencyType === 'weekly' ? [weeklyDay] : [],
        dayOfMonth: frequencyType === 'monthly' ? monthlyDay : undefined,
        schedules: schedules.length > 0 ? schedules : [{ timeSlot: 'morning', timeLabel: '08:00 AM', dosage: dosage || '1', withFood: 'after' }],
        frequencyDescription,
        startDate: todayStr,
        totalPills: parsedPills,
        pillsRemaining: parsedPills,
        lowStockThreshold: parsedThreshold,
        instructions: instructions.trim()
      });

      setIsModalOpen(false);
      resetForm();
      toast.success(`${name} added to schedule`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRefill = async (medId: string, currentPills: number) => {
    if (onRefillMedication) {
      await onRefillMedication(medId, 30);
      toast.success(`Refilled +30 pills. Total stock now: ${currentPills + 30}`);
    } else {
      toast.info('Refill feature not linked');
    }
  };

  const getSlotIcon = (slot: string) => {
    switch (slot) {
      case 'morning':
        return <WbSunnyOutlinedIcon sx={{ fontSize: 14 }} className="text-amber-500" />;
      case 'afternoon':
        return <LightModeOutlinedIcon sx={{ fontSize: 14 }} className="text-orange-500" />;
      case 'evening':
        return <WbTwilightOutlinedIcon sx={{ fontSize: 14 }} className="text-purple-500" />;
      case 'night':
        return <BedtimeOutlinedIcon sx={{ fontSize: 14 }} className="text-indigo-500" />;
      default:
        return <AccessTimeOutlinedIcon sx={{ fontSize: 14 }} />;
    }
  };

  return (
    <>
      <Card className="p-5 border-emerald-100 dark:border-emerald-950/40 bg-gradient-to-br from-emerald-50/40 via-white to-teal-50/30 dark:from-emerald-950/20 dark:to-cozy-darkCard space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-soft-sm">
              <MedicationOutlinedIcon sx={{ fontSize: 22 }} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-cozy-text dark:text-cozy-darkText tracking-tight">
                Medication & Stock Management
              </h4>
              <p className="text-[11px] text-cozy-muted">
                {medications.length} active prescription{medications.length !== 1 ? 's' : ''} (Daily, Weekly & Monthly)
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 rounded-xl flex items-center gap-1"
          >
            <AddOutlinedIcon sx={{ fontSize: 16 }} />
            <span>Add Medication</span>
          </Button>
        </div>

        {/* Empty State */}
        {medications.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-cozy-darkCard border border-dashed border-emerald-200 dark:border-emerald-900/30 space-y-2">
            <MedicationOutlinedIcon sx={{ fontSize: 32 }} className="text-emerald-400 mx-auto opacity-60" />
            <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">
              No medications scheduled.
            </p>
            <p className="text-[11px] text-cozy-muted">
              Add daily, weekly (e.g. Vitamin D3 on Sundays), or monthly medicines with low-stock alerts.
            </p>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="mt-2 text-xs bg-emerald-600 text-white"
            >
              <AddOutlinedIcon sx={{ fontSize: 15, mr: 0.5 }} />
              <span>Schedule First Medication</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map(med => {
              const freqType = med.frequencyType || 'daily';
              const threshold = med.lowStockThreshold || 5;
              const isLowStock = (med.pillsRemaining ?? med.totalPills) <= threshold;

              // Check if medication is due today
              let isDueToday = false;
              let nextDueText = '';

              if (freqType === 'daily') {
                isDueToday = true;
              } else if (freqType === 'weekly') {
                const targetDay = (med.daysOfWeek && med.daysOfWeek.length > 0) ? med.daysOfWeek[0] : 0;
                isDueToday = todayDayOfWeek === targetDay;
                if (!isDueToday) {
                  const daysUntil = (targetDay - todayDayOfWeek + 7) % 7;
                  nextDueText = `Due ${DAY_NAMES[targetDay]} (in ${daysUntil} day${daysUntil > 1 ? 's' : ''})`;
                }
              } else if (freqType === 'monthly') {
                const targetDate = med.dayOfMonth || 1;
                isDueToday = todayDayOfMonth === targetDate;
                if (!isDueToday) {
                  nextDueText = `Due on ${targetDate}${targetDate === 1 ? 'st' : targetDate === 2 ? 'nd' : targetDate === 3 ? 'rd' : 'th'} of month`;
                }
              } else if (freqType === 'as_needed') {
                isDueToday = true;
              }

              return (
                <div
                  key={med._id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isLowStock
                      ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : 'bg-white dark:bg-cozy-darkCard border-purple-100/80 dark:border-purple-900/30 shadow-soft-sm'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-cozy-text dark:text-cozy-darkText">
                        {med.name}
                      </span>
                      {med.dosage && (
                        <Badge variant="mint" size="sm" className="font-bold text-[10px]">
                          {med.dosage}
                        </Badge>
                      )}
                      <Badge variant="lavender" size="sm" className="font-extrabold text-[9px] uppercase tracking-wider">
                        {freqType.replace('_', ' ')}
                      </Badge>

                      {isLowStock && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black animate-pulse flex items-center gap-1">
                          <WarningAmberOutlinedIcon sx={{ fontSize: 13 }} />
                          <span>LOW STOCK: {med.pillsRemaining} LEFT</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-cozy-muted">
                      {med.purpose && <span>For: {med.purpose} •</span>}
                      <span className="font-medium text-emerald-800 dark:text-emerald-200">
                        {med.frequencyDescription}
                      </span>
                      <span>• {med.pillsRemaining} pills remaining</span>
                      {!isDueToday && nextDueText && (
                        <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <AccessTimeOutlinedIcon sx={{ fontSize: 12 }} />
                          <span>{nextDueText}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Schedule Checkmarks / Action for Today */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {freqType === 'as_needed' ? (
                      <button
                        type="button"
                        onClick={() => onToggleTaken(med._id, todayStr, 'morning')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-soft-sm flex items-center gap-1.5"
                      >
                        <MedicationOutlinedIcon sx={{ fontSize: 14 }} />
                        <span>Take SOS Dose</span>
                      </button>
                    ) : isDueToday ? (
                      (med.schedules || []).map(sch => {
                        const isTakenToday = (med.takenLogs || []).some(
                          log => log.date === todayStr && log.timeSlot === sch.timeSlot && log.taken
                        );

                        return (
                          <button
                            key={sch.timeSlot}
                            type="button"
                            onClick={() => onToggleTaken(med._id, todayStr, sch.timeSlot)}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                              isTakenToday
                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-soft-sm'
                                : 'bg-slate-50 dark:bg-slate-800 text-cozy-muted border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                            title={`Toggle ${sch.timeSlot} dose`}
                          >
                            {getSlotIcon(sch.timeSlot)}
                            <span className="capitalize">{sch.timeSlot}</span>
                            {isTakenToday && <CheckOutlinedIcon sx={{ fontSize: 14, strokeWidth: 3 }} />}
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-[11px] font-bold text-cozy-muted bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl">
                        Not due today
                      </span>
                    )}

                    {isLowStock && (
                      <button
                        onClick={() => handleQuickRefill(med._id, med.pillsRemaining)}
                        className="p-1.5 px-2 rounded-xl text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 transition-colors flex items-center gap-1 ml-1"
                        title="Quick Refill +30 Pills"
                      >
                        <AutorenewOutlinedIcon sx={{ fontSize: 13 }} />
                        <span>+30</span>
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteMedication(med._id)}
                      className="p-1.5 text-cozy-muted hover:text-rose-500 rounded-lg transition-colors ml-1"
                      title="Delete medication"
                    >
                      <DeleteOutlineOutlinedIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Add Medication Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-cozy-darkCard p-4 sm:p-6 border border-emerald-100 dark:border-emerald-900/40 shadow-soft-xl space-y-4 max-h-[calc(100dvh-1.5rem)] overflow-y-auto my-auto flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-50 dark:border-emerald-900/20">
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
                <MedicationOutlinedIcon sx={{ fontSize: 20 }} className="text-emerald-600" />
                <span>Add Medication or Supplement</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-cozy-muted hover:text-cozy-text text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Medicine / Supplement Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vitamin D3, Metformin, Amoxicillin"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 500mg, 60,000 IU, 10ml"
                    value={dosage}
                    onChange={e => setDosage(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Form</label>
                  <select
                    value={form}
                    onChange={e => setForm(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="syrup">Syrup (Liquid)</option>
                    <option value="injection">Injection</option>
                    <option value="drops">Drops</option>
                    <option value="inhaler">Inhaler</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Frequency Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  Dosage Frequency
                </label>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                  {[
                    { id: 'daily', label: 'Daily' },
                    { id: 'weekly', label: 'Weekly' },
                    { id: 'monthly', label: 'Monthly' },
                    { id: 'as_needed', label: 'SOS / PRN' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFrequencyType(f.id as any)}
                      className={`py-1.5 rounded-xl transition-all text-center ${
                        frequencyType === f.id
                          ? 'bg-emerald-600 text-white shadow-soft-sm'
                          : 'text-cozy-muted hover:text-cozy-text'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly Day Selector */}
              {frequencyType === 'weekly' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                  <label className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    Day of the Week (e.g. Vitamin D3 on Sundays)
                  </label>
                  <div className="grid grid-cols-7 gap-1">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, idx) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setWeeklyDay(idx)}
                        className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          weeklyDay === idx
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-soft-sm'
                            : 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-cozy-darkCard text-cozy-muted'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Day Selector */}
              {frequencyType === 'monthly' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                  <label className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
                    Day of the Month (1 to 31)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={monthlyDay}
                      onChange={e => setMonthlyDay(Math.min(31, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                      className="w-24 p-2 rounded-xl bg-white dark:bg-cozy-darkCard border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-cozy-text dark:text-cozy-darkText outline-none"
                    />
                    <span className="text-xs text-cozy-muted">e.g. 1st or 15th of every month</span>
                  </div>
                </div>
              )}

              {/* Timing Slots */}
              {frequencyType === 'daily' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Daily Timing Slots</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOT_DEFS.map(s => {
                      const Icon = s.IconComponent;
                      const isSelected = slots[s.id as keyof typeof slots];
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSlots(prev => ({ ...prev, [s.id]: !prev[s.id as keyof typeof prev] }))}
                          className={`p-2 rounded-2xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-400 text-emerald-900 dark:text-emerald-100 shadow-soft-sm'
                              : 'border-slate-200 dark:border-slate-800 text-cozy-muted'
                          }`}
                        >
                          <Icon sx={{ fontSize: 14 }} />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : frequencyType !== 'as_needed' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Dose Timing Slot</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOT_DEFS.map(s => {
                      const Icon = s.IconComponent;
                      const isSelected = singleSlot === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSingleSlot(s.id as any)}
                          className={`p-2 rounded-2xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-100 dark:bg-emerald-900/60 border-emerald-400 text-emerald-900 dark:text-emerald-100 shadow-soft-sm'
                              : 'border-slate-200 dark:border-slate-800 text-cozy-muted'
                          }`}
                        >
                          <Icon sx={{ fontSize: 14 }} />
                          <span>{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Meal Relation & Pills in Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Meal Relation</label>
                  <select
                    value={withFood}
                    onChange={e => setWithFood(e.target.value as any)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  >
                    <option value="after">After Food</option>
                    <option value="before">Before Food (Empty Stomach)</option>
                    <option value="with">With Food</option>
                    <option value="any">Any Time</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Pills in Stock</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 30"
                    value={totalPills}
                    onChange={e => setTotalPills(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                  />
                </div>
              </div>

              {/* Low Stock Alert Threshold */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Alert Below (Pills)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 5"
                    value={lowStockThreshold}
                    onChange={e => setLowStockThreshold(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Condition / Purpose (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. High BP, Bone Strength"
                    value={purpose}
                    onChange={e => setPurpose(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  {isSubmitting ? 'Saving...' : 'Save Medication'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
