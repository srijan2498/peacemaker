import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { toast } from 'sonner';
import {
  CalendarCheck,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { ScheduleEventSummary, ScheduleCategorySummary } from 'cozynest-shared';

export const SchedulePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [recurrenceRule, setRecurrenceRule] = useState('none');

  // Custom Category Inline Creation
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🌷');

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setIsAddModalOpen(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const dateStr = selectedDate.toISOString().split('T')[0];

  // Fetch Schedule Events for Selected Date
  const { data, isLoading } = useQuery<{
    events: ScheduleEventSummary[];
    progress: { total: number; completed: number; message: string };
  }>({
    queryKey: ['schedules', dateStr],
    queryFn: async () => {
      const res = await api.get('/schedules', {
        params: { date: dateStr }
      });
      return res.data.data;
    }
  });

  // Fetch Schedule Categories (personal + defaults)
  const { data: categoriesData } = useQuery<{ categories: ScheduleCategorySummary[] }>({
    queryKey: ['schedule-categories'],
    queryFn: async () => {
      const res = await api.get('/schedules/categories');
      return res.data.data;
    }
  });

  const events = data?.events || [];
  const progress = data?.progress || { total: 0, completed: 0, message: '' };
  const categories = categoriesData?.categories || [];

  const createEventMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Activity title is required.');

      const [sH, sM] = startTime.split(':').map(Number);
      const startAtDate = new Date(selectedDate);
      startAtDate.setHours(sH, sM, 0, 0);

      const [eH, eM] = endTime.split(':').map(Number);
      const endAtDate = new Date(selectedDate);
      endAtDate.setHours(eH, eM, 0, 0);

      return api.post('/schedules', {
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        startAt: startAtDate.toISOString(),
        endAt: endAtDate.toISOString(),
        priority,
        recurrenceRule
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Activity added to your day! 🌷');
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to add activity.');
    }
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/schedules/${id}/toggle-status`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Activity removed.');
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!newCatName.trim()) throw new Error('Category name required');
      const res = await api.post('/schedules/categories', {
        name: newCatName.trim(),
        icon: newCatIcon,
        color: '#93C5FD'
      });
      return res.data.data.category;
    },
    onSuccess: (newCat: ScheduleCategorySummary) => {
      queryClient.invalidateQueries({ queryKey: ['schedule-categories'] });
      setCategoryId(newCat._id);
      setIsCreatingCategory(false);
      setNewCatName('');
      toast.success('Category created!');
    }
  });

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const today = () => setSelectedDate(new Date());

  const isTodaySelected = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
              My Daily Schedule
            </h2>
            <Badge variant="sky" size="sm">
              Strictly Private 🔒
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
            Your private daily rhythm, study, exercise, mindfulness & routines
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="shadow-soft-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Add Activity
        </Button>
      </div>

      {/* Encouraging Daily Progress Banner */}
      {progress.total > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 dark:from-purple-950/30 dark:via-pink-950/20 dark:to-slate-900/40 border-purple-100 dark:border-purple-800/40 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-cozy-darkCard shadow-xs flex items-center justify-center text-xl">
                🌷
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  Daily Progress
                </h4>
                <p className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                  {progress.message}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-48 bg-white/80 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-purple-100 dark:border-purple-900/40">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-300"
                style={{
                  width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Date Navigation & View Mode */}
      <Card className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevDay}
            className="p-2 rounded-xl text-cozy-muted hover:text-cozy-text hover:bg-cozy-lavender-soft/60"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-cozy-text dark:text-cozy-darkText px-2">
            {selectedDate.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>

          <button
            onClick={nextDay}
            className="p-2 rounded-xl text-cozy-muted hover:text-cozy-text hover:bg-cozy-lavender-soft/60"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isTodaySelected && (
            <Button variant="ghost" size="sm" onClick={today} className="text-xs text-cozy-lavender ml-1">
              Today
            </Button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'timeline' ? 'bg-white dark:bg-cozy-darkCard shadow-xs text-cozy-lavender' : 'text-cozy-muted'
            }`}
          >
            Timeline 📋
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'calendar' ? 'bg-white dark:bg-cozy-darkCard shadow-xs text-cozy-lavender' : 'text-cozy-muted'
            }`}
          >
            Calendar 📅
          </button>
        </div>
      </Card>

      {/* Schedule Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-3xl" />
          <Skeleton className="h-16 rounded-3xl" />
          <Skeleton className="h-16 rounded-3xl" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon="☀️"
          title="Your day is a blank canvas"
          description="What would you like to accomplish today? Add activities for work, study, reading, or calm reflection."
          actionLabel="Schedule Activity"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {events.map((evt, idx) => {
            const isCompleted = evt.status === 'completed';
            const startTimeStr = new Date(evt.startAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
            const endTimeStr = evt.endAt
              ? new Date(evt.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={evt._id}
                className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 opacity-75'
                    : 'bg-white dark:bg-cozy-darkCard border-purple-50 dark:border-purple-900/30 shadow-soft-sm'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Complete checkbox button */}
                  <button
                    onClick={() => toggleStatusMutation.mutate(evt._id)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'border-2 border-purple-200 dark:border-purple-700 text-transparent hover:border-cozy-lavender'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Category icon */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${evt.category?.color || '#93C5FD'}30` }}
                  >
                    {evt.category?.icon || '✨'}
                  </div>

                  {/* Title & Notes */}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        isCompleted
                          ? 'line-through text-cozy-muted'
                          : 'text-cozy-text dark:text-cozy-darkText'
                      }`}
                    >
                      {evt.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-cozy-muted">
                      <span>{evt.category?.name || 'General'}</span>
                      {evt.description && <span>• {evt.description}</span>}
                    </div>
                  </div>
                </div>

                {/* Right time & delete */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                      {startTimeStr}
                    </span>
                    {endTimeStr && (
                      <span className="text-[10px] text-cozy-muted block">to {endTimeStr}</span>
                    )}
                  </div>

                  <button
                    onClick={() => deleteEventMutation.mutate(evt._id)}
                    className="p-1.5 text-cozy-muted hover:text-rose-500 rounded-lg hover:bg-rose-50"
                    title="Remove activity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Activity Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Personal Activity"
        description="Visible strictly to you"
        maxWidth="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            createEventMutation.mutate();
          }}
          className="space-y-4 text-left"
        >
          <Input
            label="Activity Title"
            placeholder="e.g. Morning Mindfulness, Study Math, Evening Walk"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                className="text-[11px] font-bold text-cozy-lavender hover:underline"
              >
                + New Private Category
              </button>
            </div>

            {!isCreatingCategory ? (
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2.5 text-sm text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="">Select Category (15+)</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New category name..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="flex-1 bg-white dark:bg-cozy-darkCard border border-purple-100 rounded-2xl px-3 py-2 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => createCategoryMutation.mutate()}
                  isLoading={createCategoryMutation.isPending}
                >
                  Save
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2.5 text-sm text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority ⭐</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Recurrence
              </label>
              <select
                value={recurrenceRule}
                onChange={e => setRecurrenceRule(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2.5 text-sm text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="none">Today only</option>
                <option value="daily">Every day</option>
                <option value="weekdays">Weekdays (Mon-Fri)</option>
                <option value="weekends">Weekends only</option>
              </select>
            </div>
          </div>

          <Input
            label="Notes (Optional)"
            placeholder="Add details, reminders, or locations"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createEventMutation.isPending}>
              Add to Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
