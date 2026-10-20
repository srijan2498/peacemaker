import React, { useState } from 'react';
import { HealthRecordSummary, PeriodRecordData, PERIOD_SYMPTOMS_LIST, PERIOD_MOODS_LIST, HEALTH_REFERENCE_RANGES } from 'cozynest-shared';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import { Sparkles, Calendar, Heart, Plus, Droplets, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface PeriodTrackerCardProps {
  latestRecord?: HealthRecordSummary;
  onSavePeriod: (data: PeriodRecordData, notes?: string) => Promise<void>;
}

export const PeriodTrackerCard: React.FC<PeriodTrackerCardProps> = ({
  latestRecord,
  onSavePeriod
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cycleStartDate, setCycleStartDate] = useState(
    latestRecord ? (latestRecord.data as PeriodRecordData).cycleStartDate : ''
  );
  const [cycleLength, setCycleLength] = useState<number | ''>('');
  const [periodDuration, setPeriodDuration] = useState<number | ''>('');
  const [flow, setFlow] = useState<'light' | 'medium' | 'heavy' | 'spotting' | ''>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<'calm' | 'sensitive' | 'irritable' | 'energetic' | 'tired'>('calm');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Strictly use real record data, else null
  const data: PeriodRecordData | null = latestRecord ? (latestRecord.data as PeriodRecordData) : null;

  let currentCycleDay = 0;
  let daysUntilNext = 0;
  let phaseName = 'No active cycle recorded';
  let phaseBadge = 'neutral' as any;
  let phaseDescription = 'Record your last cycle start date to calculate phases and fertility window.';

  if (data) {
    const startMs = new Date(data.cycleStartDate).getTime();
    const todayMs = new Date().getTime();
    const dayDifference = Math.max(0, Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)));
    currentCycleDay = (dayDifference % data.cycleLengthDays) + 1;
    daysUntilNext = data.cycleLengthDays - currentCycleDay;

    if (currentCycleDay <= data.periodDurationDays) {
      phaseName = 'Menstrual Phase';
      phaseBadge = 'pink';
      phaseDescription = 'Shedding uterine lining — rest warmly & stay hydrated.';
    } else if (currentCycleDay >= 13 && currentCycleDay <= 16) {
      phaseName = 'Ovulation Window (Peak Fertility)';
      phaseBadge = 'mint';
      phaseDescription = 'LH surge & egg release — highest probability of conception.';
    } else if (currentCycleDay > 16) {
      phaseName = 'Luteal Phase';
      phaseBadge = 'peach';
      phaseDescription = 'Progesterone dominance — focus on grounding nutrition and relaxation.';
    } else {
      phaseName = 'Follicular Phase';
      phaseBadge = 'lavender';
      phaseDescription = 'Rising estrogen & natural energy boost.';
    }
  }

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleStartDate) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSavePeriod(
        {
          cycleStartDate,
          cycleLengthDays: typeof cycleLength === 'number' ? cycleLength : 28,
          periodDurationDays: typeof periodDuration === 'number' ? periodDuration : 5,
          flowIntensity: (flow || 'medium') as any,
          symptoms: selectedSymptoms,
          mood: selectedMood,
          notes
        },
        notes
      );
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="p-5 border-rose-100 dark:border-rose-950/40 bg-gradient-to-br from-rose-50/40 via-white to-pink-50/30 dark:from-rose-950/20 dark:to-cozy-darkCard space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-soft-sm">
                <SpaOutlinedIcon className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-cozy-text dark:text-cozy-darkText tracking-tight">
                  Menstrual & Cycle Tracker
                </h4>
                <p className="text-[11px] text-cozy-muted">
                  {data ? `Cycle Day ${currentCycleDay} of ${data.cycleLengthDays}` : 'No active cycle recorded'}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>{data ? 'Update Cycle' : 'Log Period Start'}</span>
            </Button>
          </div>

          {/* Phase Highlight Card */}
          {data ? (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-cozy-darkCard border border-rose-100 dark:border-rose-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-soft-sm">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={phaseBadge} size="sm" className="font-bold">
                    {phaseName}
                  </Badge>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {daysUntilNext <= 0 ? 'Cycle due today' : `Next period in ~${daysUntilNext} days`}
                  </span>
                </div>
                <p className="text-xs text-cozy-muted mt-1">{phaseDescription}</p>
              </div>

              {/* Mini Cycle Progress Bar */}
              <div className="w-full sm:w-36 space-y-1">
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (currentCycleDay / data.cycleLengthDays) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-cozy-muted font-bold">
                  <span>Day 1</span>
                  <span>Day {data.cycleLengthDays}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-white dark:bg-cozy-darkCard border border-dashed border-rose-200 dark:border-rose-900/30">
              <span className="text-2xl font-black text-cozy-muted">--</span>
              <p className="text-xs text-cozy-muted mt-1">No menstrual cycle currently tracked.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 text-xs font-bold text-rose-600 hover:underline"
              >
                + Record Period Start Date
              </button>
            </div>
          )}

          {/* Logged Symptoms & Mood Chips */}
          {data && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-cozy-muted mr-1">Logged:</span>
              <span className="px-2.5 py-1 rounded-xl bg-rose-100/70 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200 text-[11px] font-semibold flex items-center gap-1">
                <Droplets className="w-3 h-3 text-rose-500" />
                <span>Flow: {data.flowIntensity || 'Medium'}</span>
              </span>
              {(data.symptoms || []).map(symId => {
                const sym = PERIOD_SYMPTOMS_LIST.find(s => s.id === symId);
                return (
                  <span
                    key={symId}
                    className="px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] font-medium border border-purple-100 dark:border-purple-900/20"
                  >
                    {sym?.label || symId}
                  </span>
                );
              })}
              {data.mood && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-100 dark:border-amber-900/20">
                  Mood: {PERIOD_MOODS_LIST.find(m => m.id === data.mood)?.label || data.mood}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Clinical Reference Range */}
        <div className="pt-2 border-t border-rose-100/60 dark:border-rose-900/30 text-[11px] text-cozy-muted flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-900 dark:text-rose-300">Healthy Cycle Range: </span>
            <span>{HEALTH_REFERENCE_RANGES.PERIOD_CYCLE.target}</span>
            <span className="text-[10px] block text-cozy-muted/80">{HEALTH_REFERENCE_RANGES.PERIOD_CYCLE.description}</span>
          </div>
        </div>
      </Card>

      {/* Log Period Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-rose-100 dark:border-rose-900/40 shadow-soft-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-rose-50 dark:border-rose-900/20">
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
                <SpaOutlinedIcon className="w-5 h-5 text-rose-500" />
                <span>Track Cycle & Symptoms</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-cozy-muted hover:text-cozy-text text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  Period Start Date
                </label>
                <input
                  type="date"
                  value={cycleStartDate}
                  onChange={e => setCycleStartDate(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Cycle Length (Days)</label>
                  <input
                    type="number"
                    min="20"
                    max="45"
                    placeholder="e.g. 28"
                    value={cycleLength}
                    onChange={e => setCycleLength(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                  />
                  <span className="text-[10px] text-cozy-muted">Normal: 21–35 days</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Flow Duration (Days)</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    placeholder="e.g. 5"
                    value={periodDuration}
                    onChange={e => setPeriodDuration(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                  />
                  <span className="text-[10px] text-cozy-muted">Normal: 3–7 days</span>
                </div>
              </div>

              {/* Flow Intensity */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Flow Intensity</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'spotting', label: 'Spotting' },
                    { id: 'light', label: 'Light' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'heavy', label: 'Heavy' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFlow(f.id as any)}
                      className={`p-2 rounded-2xl text-[11px] font-bold border transition-all ${
                        flow === f.id
                          ? 'bg-rose-100 dark:bg-rose-900/60 border-rose-400 text-rose-900 dark:text-rose-100 shadow-soft-sm'
                          : 'border-rose-100 dark:border-rose-900/20 text-cozy-muted'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Symptoms */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Symptoms</label>
                <div className="grid grid-cols-2 gap-2">
                  {PERIOD_SYMPTOMS_LIST.map(sym => {
                    const isSelected = selectedSymptoms.includes(sym.id);
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => toggleSymptom(sym.id)}
                        className={`p-2 rounded-2xl text-[11px] font-semibold border text-left flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-rose-50 dark:bg-rose-900/40 border-rose-400 text-rose-800 dark:text-rose-200'
                            : 'border-slate-200 dark:border-slate-800 text-cozy-muted'
                        }`}
                      >
                        <span>{sym.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white">
                  {isSubmitting ? 'Saving...' : 'Save Cycle Record'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
