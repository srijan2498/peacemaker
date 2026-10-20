import React, { useState } from 'react';
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
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MessageCircle,
  Trash2
} from 'lucide-react';
import type { MoneyTransactionSummary } from 'cozynest-shared';

export const MoneyTrackerPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currency = user?.preferredCurrency || 'INR';

  const [activeTab, setActiveTab] = useState<'all' | 'lent' | 'borrowed'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [repaymentTxn, setRepaymentTxn] = useState<MoneyTransactionSummary | null>(null);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [repaymentNotes, setRepaymentNotes] = useState('');

  // Add Transaction Form State
  const [txnType, setTxnType] = useState<'lent' | 'borrowed'>('lent');
  const [personName, setPersonName] = useState('');
  const [contactRef, setContactRef] = useState('');
  const [principal, setPrincipal] = useState('');
  const [txnDate, setTxnDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch Transactions
  const { data, isLoading } = useQuery({
    queryKey: ['money-transactions', activeTab],
    queryFn: async () => {
      const res = await api.get('/money-transactions', {
        params: { type: activeTab !== 'all' ? activeTab : undefined }
      });
      return res.data.data;
    }
  });

  const transactions: MoneyTransactionSummary[] = data?.transactions || [];
  const summary = data?.summary || {
    totalLentMinor: 0,
    totalBorrowedMinor: 0,
    outstandingReceivablesMinor: 0,
    outstandingPayablesMinor: 0,
    overdueMinor: 0
  };

  const createTxnMutation = useMutation({
    mutationFn: async () => {
      const num = parseFloat(principal);
      if (isNaN(num) || num <= 0) throw new Error('Please enter a valid amount.');
      if (!personName.trim()) throw new Error('Please enter the person’s name.');

      return api.post('/money-transactions', {
        type: txnType,
        personName: personName.trim(),
        contactReference: contactRef.trim(),
        principalAmount: num,
        currency,
        transactionDate: new Date(txnDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        notes: notes.trim()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Transaction recorded! 🤝');
      setIsAddModalOpen(false);
      setPersonName('');
      setContactRef('');
      setPrincipal('');
      setNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save transaction.');
    }
  });

  const addRepaymentMutation = useMutation({
    mutationFn: async () => {
      if (!repaymentTxn) return;
      const num = parseFloat(repaymentAmount);
      if (isNaN(num) || num <= 0) throw new Error('Please enter a valid repayment amount.');

      return api.post(`/money-transactions/${repaymentTxn._id}/repayments`, {
        amount: num,
        notes: repaymentNotes.trim()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Repayment recorded successfully! ✨');
      setRepaymentTxn(null);
      setRepaymentAmount('');
      setRepaymentNotes('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to record repayment.');
    }
  });

  const deleteTxnMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/money-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['money-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Record removed.');
    }
  });

  const copyFriendlyReminder = (t: MoneyTransactionSummary) => {
    const formattedAmt = formatCurrencyAmount(t.remainingMinor, t.currency || currency);
    const dateStr = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'soon';
    const text = `Hi ${t.personName}, just a friendly note regarding the ${formattedAmt} due on ${dateStr}. Hope you are having a wonderful week! Thanks 🌷`;

    navigator.clipboard.writeText(text);
    toast.success('Copied friendly reminder to clipboard! 📋');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
              Money Tracker
            </h2>
            <Badge variant="mint" size="sm">
              Strictly Private 🔒
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
            Keep track of money lent to friends or borrowed without awkwardness
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="shadow-soft-sm">
          <Plus className="w-4 h-4 mr-1.5" /> Record Lent / Borrowed
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 bg-gradient-to-br from-white to-emerald-50/40 dark:from-cozy-darkCard dark:to-emerald-950/20">
          <span className="text-[11px] font-bold text-cozy-muted uppercase">To Receive (Lent)</span>
          <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
            {formatCurrencyAmount(summary.outstandingReceivablesMinor, currency)}
          </p>
          <span className="text-[10px] text-cozy-muted">Active receivables</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-rose-50/40 dark:from-cozy-darkCard dark:to-rose-950/20">
          <span className="text-[11px] font-bold text-cozy-muted uppercase">To Return (Borrowed)</span>
          <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-2 truncate">
            {formatCurrencyAmount(summary.outstandingPayablesMinor, currency)}
          </p>
          <span className="text-[10px] text-cozy-muted">Pending payables</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-sky-50/40 dark:from-cozy-darkCard dark:to-sky-950/20">
          <span className="text-[11px] font-bold text-cozy-muted uppercase">Total Lent All Time</span>
          <p className="text-lg font-black text-cozy-text dark:text-cozy-darkText mt-2 truncate">
            {formatCurrencyAmount(summary.totalLentMinor, currency)}
          </p>
          <span className="text-[10px] text-cozy-muted">Recorded principal</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-white to-amber-50/40 dark:from-cozy-darkCard dark:to-amber-950/20">
          <span className="text-[11px] font-bold text-cozy-muted uppercase">Overdue Amount</span>
          <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-2 truncate">
            {formatCurrencyAmount(summary.overdueMinor, currency)}
          </p>
          <span className="text-[10px] text-cozy-muted">Passed scheduled due date</span>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-purple-100 dark:border-purple-900/30 pb-2">
        {(['all', 'lent', 'borrowed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold capitalize transition-all ${
              activeTab === tab
                ? 'bg-cozy-lavender text-white shadow-soft-sm'
                : 'text-cozy-muted hover:text-cozy-text'
            }`}
          >
            {tab === 'all' ? 'All Transactions' : tab === 'lent' ? 'Money Lent 🤝' : 'Money Borrowed 💳'}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="No money tracker records yet"
          description="Log money lent to friends or borrowed to keep tabs on repayments peace of mind."
          actionLabel="Record First Transaction"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transactions.map(t => {
            const isLent = t.type === 'lent';
            const isFullyPaid = t.status === 'fully_paid';
            const progressPct =
              t.principalMinor > 0 ? Math.round((t.totalRepaidMinor / t.principalMinor) * 100) : 0;

            return (
              <Card
                key={t._id}
                className="p-5 space-y-3 bg-white dark:bg-cozy-darkCard border-purple-100 dark:border-purple-900/40 relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${
                        isLent
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700'
                          : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700'
                      }`}
                    >
                      {isLent ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                        {t.personName}
                      </h4>
                      <p className="text-[11px] text-cozy-muted">
                        {isLent ? 'Lent to' : 'Borrowed from'} •{' '}
                        {new Date(t.transactionDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={isFullyPaid ? 'mint' : t.totalRepaidMinor > 0 ? 'sky' : 'yellow'}
                    size="sm"
                  >
                    {isFullyPaid ? 'Fully Paid ✨' : t.totalRepaidMinor > 0 ? 'Partially Paid' : 'Active'}
                  </Badge>
                </div>

                {/* Amounts & Progress Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-cozy-muted">
                      Remaining:{' '}
                      <span className="text-cozy-text dark:text-cozy-darkText font-black">
                        {formatCurrencyAmount(t.remainingMinor, t.currency || currency)}
                      </span>
                    </span>
                    <span className="text-cozy-muted">
                      Principal: {formatCurrencyAmount(t.principalMinor, t.currency || currency)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFullyPaid ? 'bg-emerald-500' : 'bg-cozy-lavender'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {t.dueDate && (
                  <p className="text-[11px] text-cozy-muted flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    Due by: {new Date(t.dueDate).toLocaleDateString()}
                  </p>
                )}

                {t.notes && (
                  <p className="text-[11px] text-cozy-muted bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl italic">
                    "{t.notes}"
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-purple-50 dark:border-purple-900/20">
                  <div className="flex items-center gap-2">
                    {!isFullyPaid && isLent && (
                      <button
                        onClick={() => copyFriendlyReminder(t)}
                        className="text-[11px] font-semibold text-cozy-lavender hover:underline flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> Copy Reminder
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isFullyPaid && (
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => {
                          setRepaymentTxn(t);
                          setRepaymentAmount((t.remainingMinor / 100).toString());
                        }}
                      >
                        Record Repayment
                      </Button>
                    )}
                    <button
                      onClick={() => deleteTxnMutation.mutate(t._id)}
                      className="p-1.5 text-cozy-muted hover:text-rose-500 rounded-lg hover:bg-rose-50"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Lent or Borrowed Money"
        description="Private member-only record"
        maxWidth="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            createTxnMutation.mutate();
          }}
          className="space-y-4 text-left"
        >
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setTxnType('lent')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                txnType === 'lent'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-cozy-muted hover:text-cozy-text'
              }`}
            >
              Money Lent (To Collect)
            </button>
            <button
              type="button"
              onClick={() => setTxnType('borrowed')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                txnType === 'borrowed'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-cozy-muted hover:text-cozy-text'
              }`}
            >
              Money Borrowed (To Pay)
            </button>
          </div>

          <Input
            label="Person's Name"
            placeholder="e.g. Rahul Verma, Uncle Dave"
            value={personName}
            onChange={e => setPersonName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Principal Amount (${currency})`}
              type="number"
              step="0.01"
              placeholder="e.g. 5000"
              value={principal}
              onChange={e => setPrincipal(e.target.value)}
              required
            />
            <Input
              label="Contact Info (Optional)"
              placeholder="Phone or email"
              value={contactRef}
              onChange={e => setContactRef(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Transaction Date"
              type="date"
              value={txnDate}
              onChange={e => setTxnDate(e.target.value)}
              required
            />
            <Input
              label="Due Date (Optional)"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
            />
          </div>

          <Input
            label="Notes / Purpose (Optional)"
            placeholder="e.g. Emergency medication loan"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createTxnMutation.isPending}>
              Save Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Repayment Modal */}
      <Modal
        isOpen={!!repaymentTxn}
        onClose={() => setRepaymentTxn(null)}
        title="Record Repayment"
        description={
          repaymentTxn
            ? `Remaining balance: ${formatCurrencyAmount(repaymentTxn.remainingMinor, repaymentTxn.currency || currency)}`
            : ''
        }
        maxWidth="sm"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            addRepaymentMutation.mutate();
          }}
          className="space-y-4 text-left"
        >
          <Input
            label={`Repayment Amount (${currency})`}
            type="number"
            step="0.01"
            placeholder="e.g. 2000"
            value={repaymentAmount}
            onChange={e => setRepaymentAmount(e.target.value)}
            required
          />

          <Input
            label="Repayment Notes (Optional)"
            placeholder="e.g. Paid via GPay UPI"
            value={repaymentNotes}
            onChange={e => setRepaymentNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setRepaymentTxn(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={addRepaymentMutation.isPending}>
              Record Repayment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
