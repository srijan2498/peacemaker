import React, { useState } from 'react';
import { HealthRecordSummary, FeverRecordData, FEVER_SYMPTOMS_LIST, FEVER_SEVERITY, HEALTH_REFERENCE_RANGES } from 'cozynest-shared';
import ThermostatOutlinedIcon from '@mui/icons-material/ThermostatOutlined';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Thermometer, AlertCircle, Plus, Pill, Clock, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface FeverTrackerCardProps {
  latestRecord?: HealthRecordSummary;
  onSaveFever: (data: FeverRecordData, notes?: string) => Promise<void>;
}

export const FeverTrackerCard: React.FC<FeverTrackerCardProps> = ({
  latestRecord,
  onSaveFever
}) => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [tempInput, setTempInput] = useState<number | ''>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [medication, setMedication] = useState('');
  const [site, setSite] = useState<'oral' | 'axillary' | 'ear' | 'forehead'>('oral');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Strictly use record data if exists, else null
  const data: FeverRecordData | null = latestRecord ? (latestRecord.data as FeverRecordData) : null;

  // Convert reading according to active display unit
  const displayTemp = data
    ? unit === data.unit
      ? data.temperature
      : unit === 'F'
      ? parseFloat(((data.temperature * 9) / 5 + 32).toFixed(1))
      : parseFloat((((data.temperature - 32) * 5) / 9).toFixed(1))
    : null;

  // Determine clinical severity
  let severityLabel = 'Normal Body Temp';
  let severityBadge = 'mint' as const;
  let severityColor = 'text-emerald-600 dark:text-emerald-400';

  if (displayTemp !== null) {
    if (unit === 'C') {
      if (displayTemp >= 39.5) {
        severityLabel = 'High Fever (Seek Medical Attention)';
        severityBadge = 'pink';
        severityColor = 'text-rose-600 dark:text-rose-400';
      } else if (displayTemp >= 38.4) {
        severityLabel = 'Moderate Fever';
        severityBadge = 'yellow';
        severityColor = 'text-amber-600 dark:text-amber-400';
      } else if (displayTemp >= 37.3) {
        severityLabel = 'Low-Grade Fever';
        severityBadge = 'peach';
        severityColor = 'text-orange-500';
      }
    } else {
      if (displayTemp >= 103.0) {
        severityLabel = 'High Fever (Seek Medical Attention)';
        severityBadge = 'pink';
        severityColor = 'text-rose-600 dark:text-rose-400';
      } else if (displayTemp >= 101.0) {
        severityLabel = 'Moderate Fever';
        severityBadge = 'yellow';
        severityColor = 'text-amber-600 dark:text-amber-400';
      } else if (displayTemp >= 99.1) {
        severityLabel = 'Low-Grade Fever';
        severityBadge = 'peach';
        severityColor = 'text-orange-500';
      }
    }
  }

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const calculateSeverity = (t: number, u: 'C' | 'F'): 'normal' | 'low_grade' | 'moderate' | 'high' => {
    const celsius = u === 'C' ? t : ((t - 32) * 5) / 9;
    if (celsius >= 39.5) return 'high';
    if (celsius >= 38.4) return 'moderate';
    if (celsius >= 37.3) return 'low_grade';
    return 'normal';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tempInput === '') {
      toast.error('Please enter a temperature reading');
      return;
    }
    setIsSubmitting(true);
    try {
      const tempVal = typeof tempInput === 'number' ? tempInput : parseFloat(tempInput);
      const severity = calculateSeverity(tempVal, unit);
      await onSaveFever(
        {
          temperature: tempVal,
          unit,
          severity,
          symptoms: selectedSymptoms,
          medicationGiven: medication,
          measuredSite: site,
          notes
        },
        notes
      );

      // Push alert to Notification Bell Icon if moderate or high fever
      if (severity === 'high' || severity === 'moderate') {
        try {
          await api.post('/notifications', {
            title: severity === 'high' ? 'High Fever Alert!' : 'Moderate Fever Recorded',
            body: `Recorded temperature ${tempVal}°${unit} (${severity.toUpperCase()}). Please monitor vitals, stay hydrated, and consult a doctor if fever persists.`,
            type: 'health_alert'
          });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch (err) {
          console.error('Failed to post fever alert to notifications', err);
        }
      }

      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="p-5 border-amber-100 dark:border-amber-950/40 bg-gradient-to-br from-amber-50/40 via-white to-rose-50/30 dark:from-amber-950/20 dark:to-cozy-darkCard space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-soft-sm">
                <ThermostatOutlinedIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-cozy-text dark:text-cozy-darkText tracking-tight">
                  Fever & Temperature Log
                </h4>
                <p className="text-[11px] text-cozy-muted">
                  {latestRecord ? `Last check on ${latestRecord.date}` : 'No temperature reading recorded yet'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Unit Toggle Button */}
              <div className="flex p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUnit('C')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    unit === 'C' ? 'bg-white dark:bg-cozy-darkCard text-amber-600 shadow-sm' : 'text-cozy-muted'
                  }`}
                >
                  °C
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('F')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    unit === 'F' ? 'bg-white dark:bg-cozy-darkCard text-amber-600 shadow-sm' : 'text-cozy-muted'
                  }`}
                >
                  °F
                </button>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTempInput('');
                  setIsModalOpen(true);
                }}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>{data ? 'Record New' : 'Record Temp'}</span>
              </Button>
            </div>
          </div>

          {/* Temperature Reading Box */}
          {data && displayTemp !== null ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-cozy-darkCard border border-amber-100 dark:border-amber-900/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-soft-sm">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black tracking-tight">
                  <span className={severityColor}>{displayTemp}</span>
                  <span className="text-sm font-bold text-cozy-muted ml-1">°{unit}</span>
                </div>
                <div>
                  <Badge variant={severityBadge} size="sm" className="font-bold">
                    {severityLabel}
                  </Badge>
                  <p className="text-[11px] text-cozy-muted mt-0.5">
                    Site: {data.measuredSite ? data.measuredSite.toUpperCase() : 'ORAL'}
                  </p>
                </div>
              </div>

              {data.medicationGiven && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                  <Pill className="w-3.5 h-3.5 text-purple-500" />
                  <span>Given: {data.medicationGiven}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center rounded-2xl bg-white dark:bg-cozy-darkCard border border-dashed border-amber-200 dark:border-amber-900/30">
              <span className="text-2xl font-black text-cozy-muted">-- °{unit}</span>
              <p className="text-xs text-cozy-muted mt-1">No body temperature currently logged.</p>
              <button
                onClick={() => {
                  setTempInput('');
                  setIsModalOpen(true);
                }}
                className="mt-2 text-xs font-bold text-amber-600 hover:underline"
              >
                + Record Temperature Reading
              </button>
            </div>
          )}

          {/* Symptoms Chips */}
          {data && data.symptoms && data.symptoms.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-cozy-muted mr-1">Symptoms:</span>
              {data.symptoms.map(sId => {
                const sym = FEVER_SYMPTOMS_LIST.find(s => s.id === sId);
                return (
                  <span
                    key={sId}
                    className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[11px] font-medium border border-amber-200/50 dark:border-amber-900/20"
                  >
                    {sym?.label || sId}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Clinical Reference Range */}
        <div className="pt-2 border-t border-amber-100/60 dark:border-amber-900/30 text-[11px] text-cozy-muted flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-900 dark:text-amber-300">Healthy Body Temp Range: </span>
            <span>{HEALTH_REFERENCE_RANGES.BODY_TEMP.target}</span>
            <span className="text-[10px] block text-cozy-muted/80">{HEALTH_REFERENCE_RANGES.BODY_TEMP.description}</span>
          </div>
        </div>
      </Card>

      {/* Record Temp Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-cozy-darkCard p-4 sm:p-6 border border-amber-100 dark:border-amber-900/40 shadow-soft-xl space-y-4 max-h-[calc(100dvh-1.5rem)] overflow-y-auto my-auto flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-amber-50 dark:border-amber-900/20">
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
                <ThermostatOutlinedIcon className="w-5 h-5 text-amber-500" />
                <span>Record Body Temperature</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-cozy-muted hover:text-cozy-text text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Temperature</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min={unit === 'C' ? 34 : 93}
                      max={unit === 'C' ? 43 : 109}
                      placeholder={unit === 'C' ? 'e.g. 37.2' : 'e.g. 98.6'}
                      value={tempInput}
                      onChange={e => setTempInput(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none pr-8 font-black"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-cozy-muted">°{unit}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Measurement Site</label>
                  <select
                    value={site}
                    onChange={e => setSite(e.target.value as any)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  >
                    <option value="oral">Oral (Mouth)</option>
                    <option value="forehead">Forehead (Temporal)</option>
                    <option value="axillary">Axillary (Armpit)</option>
                    <option value="ear">Ear (Tympanic)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Symptoms Observed</label>
                <div className="grid grid-cols-2 gap-2">
                  {FEVER_SYMPTOMS_LIST.map(sym => {
                    const isSelected = selectedSymptoms.includes(sym.id);
                    return (
                      <button
                        key={sym.id}
                        type="button"
                        onClick={() => toggleSymptom(sym.id)}
                        className={`p-2 rounded-2xl text-[11px] font-semibold border text-left flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-amber-100/70 dark:bg-amber-900/40 border-amber-400 text-amber-900 dark:text-amber-100'
                            : 'border-slate-200 dark:border-slate-800 text-cozy-muted'
                        }`}
                      >
                        <span className="truncate">{sym.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  Medication Administered (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paracetamol 500mg, Crocin 650mg"
                  value={medication}
                  onChange={e => setMedication(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {isSubmitting ? 'Saving...' : 'Save Temperature'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
