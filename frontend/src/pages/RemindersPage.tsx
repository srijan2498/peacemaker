import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrencyAmount } from 'cozynest-shared';
import { toast } from 'sonner';
import {
  BellRing,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  Repeat,
  Trash2,
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { PaymentReminderSummary, ExpenseCategorySummary } from 'cozynest-shared';

export const RemindersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, activeFamily } = useAuthStore();
  const currency = activeFamily?.defaultCurrency || user?.preferredCurrency || 'INR';

  const [activeView, setActiveView] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [completingReminder, setCompletingReminder] = useState<PaymentReminderSummary | null>(null);
  const [snoozeReminderId, setSnoozeReminderId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueAt, setDueAt] = useState(new Date().toISOString().split('T')[0]);
  const [recurrenceRule, setRecurrenceRule] = useState('none');
  const [categoryId, setCategoryId] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'family'>('family');

  // Fetch Reminders
  const { data, isLoading } = useQuery<{ reminders: PaymentReminderSummary[] }>({
    queryKey: ['reminders', activeFamily?._id, activeView],
    queryFn: async () => {
      const res = await api.get('/reminders', {
        params: {
          familyId: activeFamily?._id,
          view: activeView !== 'all' ? activeView : undefined
        }
      });
      return res.data.data;
    }
  });

  // Fetch Categories
  const { data: categoriesData } = useQuery<{ categories: ExpenseCategorySummary[] }>({
    queryKey: ['categories', activeFamily?._id],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily?._id}/categories`);
      return res.data.data;
    },
    enabled: !!activeFamily?._id
  });

  const reminders = data?.reminders || [];
  const categories: ExpenseCategorySummary[] = useMemo(() => {
    const list: ExpenseCategorySummary[] = categoriesData?.categories || [];
    const seen = new Set<string>();
    return list.filter((c: ExpenseCategorySummary) => {
      const key = c.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a: ExpenseCategorySummary, b: ExpenseCategorySummary) => a.name.localeCompare(b.name));
  }, [categoriesData?.categories]);

  const createReminderMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Reminder title is required.');
      const parsedAmount = parseFloat(amount) || 0;

      return api.post('/reminders', {
        title: title.trim(),
        description: description.trim(),
        amount: parsedAmount,
        currency,
        dueAt: new Date(dueAt).toISOString(),
        recurrenceRule,
        categoryId: categoryId || undefined,
        visibility,
        familyId: activeFamily?._id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Reminder scheduled! 🔔');
      setIsAddModalOpen(false);
      setTitle('');
      setDescription('');
      setAmount('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create reminder.');
    }
  });

  const completeReminderMutation = useMutation({
    mutationFn: async ({ id, recordAsExpense }: { id: string; recordAsExpense: boolean }) => {
      return api.post(`/reminders/${id}/complete`, {
        recordAsExpense,
        familyId: activeFamily?._id
      });
    },
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(res.data.message || 'Payment completed! 🌷');
      setCompletingReminder(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to complete reminder.');
    }
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      return api.post(`/reminders/${id}/snooze`, { days });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder snoozed! ⏰');
      setSnoozeReminderId(null);
    }
  });

  const deleteReminderMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Reminder removed.');
    }
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
            Payment & Bill Reminders
          </h2>
          <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
            Never miss household utilities, subscriptions, rent, or EMI deadlines
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="shadow-soft-sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Reminder
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-purple-100 dark:border-purple-900/30 pb-2">
        {[
          { id: 'all', label: 'All Bills' },
          { id: 'today', label: 'Due Today ⏰' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'overdue', label: 'Overdue ⚠️' },
          { id: 'completed', label: 'Settled ✨' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all ${
              activeView === tab.id
                ? 'bg-cozy-lavender text-white shadow-soft-sm'
                : 'text-cozy-muted hover:text-cozy-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reminders Grid */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
        </div>
      ) : reminders.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="All clear! Nothing needs your attention right now."
          description="Schedule electricity, internet, rent, or credit card bills to get timely notifications."
          actionLabel="Schedule First Reminder"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map(r => {
            const isPaid = r.status === 'paid';
            const isDueToday = new Date(r.dueAt).toDateString() === new Date().toDateString();
            const isOverdue = new Date(r.dueAt) < new Date() && !isPaid;

            return (
              <Card
                key={r._id}
                className={`p-5 space-y-3 transition-all ${
                  isPaid ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/20' : 'bg-white dark:bg-cozy-darkCard'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${r.category?.color || '#A78BFA'}30` }}
                    >
                      {r.category?.icon || '🔔'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText truncate">
                        {r.title}
                      </h4>
                      <p className="text-[11px] text-cozy-muted">
                        {r.category?.name || 'General Utility'} •{' '}
                        {r.visibility === 'family' ? 'Family Shared' : 'Private'}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={isPaid ? 'mint' : isOverdue ? 'pink' : isDueToday ? 'yellow' : 'lavender'}
                    size="sm"
                  >
                    {isPaid ? 'Paid ✨' : isOverdue ? 'Overdue ⚠️' : isDueToday ? 'Today!' : 'Pending'}
                  </Badge>
                </div>

                {/* Amount & Due Date */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-base font-black text-cozy-text dark:text-cozy-darkText">
                    {formatCurrencyAmount(r.amountMinor, r.currency || currency)}
                  </span>
                  <span className="text-cozy-muted flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    Due {new Date(r.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {r.recurrenceRule && r.recurrenceRule !== 'none' && (
                  <p className="text-[11px] text-purple-600 dark:text-purple-300 flex items-center gap-1 font-semibold">
                    <Repeat className="w-3 h-3" />
                    Repeats {r.recurrenceRule}
                  </p>
                )}

                {r.description && (
                  <p className="text-[11px] text-cozy-muted bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                    {r.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-50 dark:border-purple-900/20">
                  <button
                    onClick={() => deleteReminderMutation.mutate(r._id)}
                    className="p-1.5 text-cozy-muted hover:text-rose-500 rounded-lg hover:bg-rose-50"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2">
                    {!isPaid && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSnoozeReminderId(r._id)}
                          className="text-xs text-cozy-muted"
                        >
                          Snooze
                        </Button>
                        <Button
                          variant="soft"
                          size="sm"
                          onClick={() => setCompletingReminder(r)}
                        >
                          Mark as Paid
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Payment Reminder"
        description="Receive persistent notifications before the bill is due"
        maxWidth="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            createReminderMutation.mutate();
          }}
          className="space-y-4 text-left"
        >
          <Input
            label="Bill / Reminder Title"
            placeholder="e.g. Broadband Fiber, Electricity Bill, Flat Rent"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Amount (${currency})`}
              type="number"
              step="0.01"
              placeholder="e.g. 1450"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            <Input
              label="Due Date"
              type="date"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Category
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2.5 text-sm text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
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
                <option value="none">One-time payment</option>
                <option value="weekly">Every week</option>
                <option value="monthly">Every month</option>
                <option value="yearly">Every year</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
              Visibility
            </label>
            <div className="flex gap-4 text-xs font-semibold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'family'}
                  onChange={() => setVisibility('family')}
                />
                Family Shared (Visible to family members)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                />
                Private (Visible only to me)
              </label>
            </div>
          </div>

          <Input
            label="Notes / Reference (Optional)"
            placeholder="Account number, bill reference, consumer ID"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createReminderMutation.isPending}>
              Schedule Reminder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Complete Reminder Prompt Modal (Ask to Record as Family Expense) */}
      <Modal
        isOpen={!!completingReminder}
        onClose={() => setCompletingReminder(null)}
        title="Mark Bill as Paid"
        description="Choose how you would like to complete this reminder"
        maxWidth="md"
      >
        {completingReminder && (
          <div className="space-y-4 text-left">
            <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                {completingReminder.title}
              </p>
              <p className="text-base font-black text-emerald-900 dark:text-emerald-200 mt-1">
                {formatCurrencyAmount(completingReminder.amountMinor, completingReminder.currency || currency)}
              </p>
            </div>

            <p className="text-xs text-cozy-muted leading-relaxed">
              Would you like to automatically record this payment into your family expenses? This ensures
              your monthly spending graphs stay accurate without entering details twice.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() =>
                  completeReminderMutation.mutate({
                    id: completingReminder._id,
                    recordAsExpense: false
                  })
                }
              >
                Mark Paid Only
              </Button>
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                onClick={() =>
                  completeReminderMutation.mutate({
                    id: completingReminder._id,
                    recordAsExpense: true
                  })
                }
              >
                Mark Paid & Add to Expenses 🌷
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Snooze Modal */}
      <Modal
        isOpen={!!snoozeReminderId}
        onClose={() => setSnoozeReminderId(null)}
        title="Snooze Reminder"
        description="Delay reminder notification"
        maxWidth="sm"
      >
        <div className="grid grid-cols-3 gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => snoozeReminderId && snoozeMutation.mutate({ id: snoozeReminderId, days: 1 })}
          >
            +1 Day
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => snoozeReminderId && snoozeMutation.mutate({ id: snoozeReminderId, days: 3 })}
          >
            +3 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => snoozeReminderId && snoozeMutation.mutate({ id: snoozeReminderId, days: 7 })}
          >
            +1 Week
          </Button>
        </div>
      </Modal>
    </div>
  );
};
