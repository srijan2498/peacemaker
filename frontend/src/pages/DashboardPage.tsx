import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrencyAmount } from 'cozynest-shared';
import {
  Plus,
  Receipt,
  BellRing,
  HandCoins,
  CalendarCheck,
  NotebookPen,
  Headphones,
  HeartPulse,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Coins,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { DashboardSummaryResponse } from 'cozynest-shared';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, activeFamily } = useAuthStore();

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: DashboardSummaryResponse }>({
    queryKey: ['dashboard', activeFamily?._id],
    queryFn: async () => {
      const res = await api.get('/dashboard/summary', {
        params: { familyId: activeFamily?._id }
      });
      return res.data;
    }
  });

  const dashboard = data?.data;
  const currency = activeFamily?.defaultCurrency || user?.preferredCurrency || 'INR';

  return (
    <div className="space-y-8">
      {/* Dynamic Greeting & Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-100/80 via-pink-50/70 to-amber-50/80 dark:from-purple-950/40 dark:via-purple-900/20 dark:to-slate-900/50 p-6 sm:p-8 border border-purple-100/80 dark:border-purple-800/30 shadow-soft-sm">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 dark:bg-cozy-darkCard/80 text-purple-700 dark:text-purple-300 text-xs font-bold mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-cozy-lavender" />
              Welcome home, {user?.nickname || user?.fullName?.split(' ')[0]}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
              {dashboard?.greeting || 'Good day! ☀️'}
            </h2>
            <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted mt-1">
              Here is how your household is doing this month in{' '}
              <span className="font-bold text-purple-700 dark:text-purple-300">
                {activeFamily?.name || 'Your Nest'}
              </span>
              .
            </p>
          </div>

          {/* Quick Action Pill Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => navigate('/expenses?action=add')}
              className="rounded-2xl"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Expense
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/expenses?tab=income&action=add')}
              className="rounded-2xl text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold"
            >
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> + Add Salary
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => navigate('/schedule?action=add')}
              className="rounded-2xl"
            >
              <CalendarCheck className="w-3.5 h-3.5 mr-1" /> Add Activity
            </Button>
            <Button
              size="sm"
              variant="soft"
              onClick={() => navigate('/notes?action=new')}
              className="rounded-2xl"
            >
              <NotebookPen className="w-3.5 h-3.5 mr-1" /> New Note
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/health')}
              className="rounded-2xl text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold"
            >
              <HeartPulse className="w-3.5 h-3.5 mr-1" /> Health & Vitals
            </Button>
          </div>
        </div>
      </div>

      {/* Pastel Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))
        ) : (
          <>
            {/* Total Monthly Income (Credits) */}
            <Card
              onClick={() => navigate('/expenses?tab=income')}
              className="p-4 cursor-pointer bg-gradient-to-br from-white to-emerald-50/60 dark:from-cozy-darkCard dark:to-emerald-950/20 border-emerald-100 dark:border-emerald-900/30"
            >
              <div className="flex items-center justify-between text-cozy-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Total Income
                </span>
                <span className="text-lg">💰</span>
              </div>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                + {formatCurrencyAmount(dashboard?.totalMonthlyIncomeMinor || 0, currency)}
              </p>
              <span className="text-[10px] text-cozy-muted">Salary & credits</span>
            </Card>

            {/* Total Monthly Expenses (Debits) */}
            <Card
              onClick={() => navigate('/expenses?tab=expenses')}
              className="p-4 cursor-pointer bg-gradient-to-br from-white to-purple-50/50 dark:from-cozy-darkCard dark:to-purple-950/20"
            >
              <div className="flex items-center justify-between text-cozy-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Spent</span>
                <span className="text-lg">🧾</span>
              </div>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-2 truncate">
                - {formatCurrencyAmount(dashboard?.totalMonthlyExpenseMinor || 0, currency)}
              </p>
              <span className="text-[10px] text-cozy-muted">This calendar month</span>
            </Card>

            {/* Net Monthly Savings */}
            <Card
              onClick={() => navigate('/expenses?tab=cashflow')}
              className="p-4 cursor-pointer bg-gradient-to-br from-white to-sky-50/50 dark:from-cozy-darkCard dark:to-sky-950/20"
            >
              <div className="flex items-center justify-between text-cozy-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
                  Net Savings
                </span>
                <span className="text-lg">💎</span>
              </div>
              <p className="text-lg font-black text-sky-600 dark:text-sky-400 mt-2 truncate">
                {formatCurrencyAmount(dashboard?.netMonthlySavingsMinor ?? dashboard?.netSavingsMinor ?? 0, currency)}
              </p>
              <span className="text-[10px] text-cozy-muted">Credit minus debit</span>
            </Card>

            {/* Budget Remaining */}
            <Card
              onClick={() => navigate('/analytics')}
              className="p-4 cursor-pointer bg-gradient-to-br from-white to-emerald-50/50 dark:from-cozy-darkCard dark:to-emerald-950/20"
            >
              <div className="flex items-center justify-between text-cozy-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Budget Left</span>
                <span className="text-lg">💰</span>
              </div>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                {formatCurrencyAmount(dashboard?.budgetRemainingMinor || 0, currency)}
              </p>
              <span className="text-[10px] text-cozy-muted">
                {dashboard?.budgetUsagePercentage || 0}% utilized
              </span>
            </Card>

            {/* Pending Payments */}
            <Card
              onClick={() => navigate('/reminders')}
              className="p-4 cursor-pointer bg-gradient-to-br from-white to-amber-50/50 dark:from-cozy-darkCard dark:to-amber-950/20"
            >
              <div className="flex items-center justify-between text-cozy-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending Bills</span>
                <span className="text-lg">🔔</span>
              </div>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-2 truncate">
                {formatCurrencyAmount(dashboard?.pendingPaymentsMinor || 0, currency)}
              </p>
              <span className="text-[10px] text-cozy-muted">Due obligations</span>
            </Card>

            {/* Money to Receive (Lent) */}
            <Card
              onClick={() => navigate('/money-tracker')}
              className="p-4 cursor-pointer bg-gradient-to-br from-white to-sky-50/50 dark:from-cozy-darkCard dark:to-sky-950/20"
            >
              <div className="flex items-center justify-between text-cozy-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">To Receive</span>
                <span className="text-lg">🤝</span>
              </div>
              <p className="text-lg font-black text-sky-600 dark:text-sky-400 mt-2 truncate">
                {formatCurrencyAmount(dashboard?.moneyToReceiveMinor || 0, currency)}
              </p>
              <span className="text-[10px] text-cozy-muted">Lent money balance</span>
            </Card>

            {/* My Monthly Contribution */}
            <Card
              onClick={() => navigate('/expenses')}
              className="p-4 cursor-pointer bg-gradient-to-br from-white to-pink-50/50 dark:from-cozy-darkCard dark:to-pink-950/20"
            >
              <div className="flex items-center justify-between text-cozy-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">My Share</span>
                <span className="text-lg">🌷</span>
              </div>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-2 truncate">
                {formatCurrencyAmount(dashboard?.myMonthlyContributionMinor || 0, currency)}
              </p>
              <span className="text-[10px] text-cozy-muted">
                {dashboard?.myMonthlyContributionPercentage || 0}% of household
              </span>
            </Card>

            {/* Upcoming Reminders count */}
            <Card
              onClick={() => navigate('/reminders')}
              className="p-4 cursor-pointer bg-gradient-to-br from-white to-violet-50/50 dark:from-cozy-darkCard dark:to-violet-950/20"
            >
              <div className="flex items-center justify-between text-cozy-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Reminders</span>
                <span className="text-lg">⏰</span>
              </div>
              <p className="text-lg font-black text-purple-600 dark:text-purple-400 mt-2">
                {dashboard?.upcomingRemindersCount || 0}
              </p>
              <span className="text-[10px] text-cozy-muted">Active payment alerts</span>
            </Card>
          </>
        )}
      </div>

      {/* Main Dashboard Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols wide on desktop): Recent Expenses + Reminders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Family Expenses */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
                  Recent Family Expenses
                </h3>
                <p className="text-xs text-cozy-muted">Shared household transactions</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/expenses')}
                className="text-xs text-cozy-lavender"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
              </div>
            ) : !dashboard?.recentExpenses || dashboard.recentExpenses.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-1">🛒</div>
                <p className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  No expenses recorded yet!
                </p>
                <p className="text-[11px] text-cozy-muted mt-0.5">
                  Click 'Add Expense' above to log groceries or utility bills.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-purple-50 dark:divide-purple-900/20">
                {dashboard.recentExpenses.map((exp: any) => (
                  <div
                    key={exp._id}
                    onClick={() => navigate('/expenses')}
                    className="py-3 flex items-center justify-between hover:bg-cozy-lavender-soft/30 px-2 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${exp.categoryId?.color || '#A78BFA'}30` }}
                      >
                        {exp.categoryId?.icon || '🏷️'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate">
                          {exp.title}
                        </p>
                        <p className="text-[11px] text-cozy-muted truncate">
                          Paid by {exp.paidByUserId?.nickname || exp.paidByUserId?.fullName || 'Family'} •{' '}
                          {exp.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-cozy-text dark:text-cozy-darkText">
                        {formatCurrencyAmount(exp.amountMinor, exp.currency || currency)}
                      </p>
                      <p className="text-[10px] text-cozy-muted">
                        {new Date(exp.expenseDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Upcoming Payment Reminders Preview */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
                  Upcoming Bill & Payment Reminders
                </h3>
                <p className="text-xs text-cozy-muted">Never miss a due date</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/reminders')}
                className="text-xs text-cozy-lavender"
              >
                View All <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {!dashboard?.upcomingReminders || dashboard.upcomingReminders.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-2xl mb-1">✨</div>
                <p className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  All clear! Nothing needs your attention right now.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dashboard.upcomingReminders.map((rem: any) => (
                  <div
                    key={rem._id}
                    onClick={() => navigate('/reminders')}
                    className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-purple-50 dark:border-purple-900/20 hover:border-purple-200 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 flex items-center justify-center shrink-0">
                        <BellRing className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate">
                          {rem.title}
                        </p>
                        <p className="text-[10px] text-cozy-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(rem.dueAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-cozy-text dark:text-cozy-darkText shrink-0">
                      {formatCurrencyAmount(rem.amountMinor, rem.currency || currency)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Private Schedule & Quick Notes Preview */}
        <div className="space-y-6">
          {/* Private Daily Schedule Preview (STRICT PRIVACY: ONLY CURRENT USER) */}
          <Card className="space-y-3 bg-gradient-to-br from-white to-blue-50/30 dark:from-cozy-darkCard dark:to-blue-950/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                    My Schedule Today
                  </h3>
                  <Badge variant="sky" size="sm">
                    Private 🔒
                  </Badge>
                </div>
                <p className="text-[11px] text-cozy-muted">Visible only to you</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/schedule')}
                className="text-xs text-cozy-lavender"
              >
                Planner <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {!dashboard?.todaySchedule || dashboard.todaySchedule.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-2xl mb-1">🌷</div>
                <p className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  No activities scheduled today
                </p>
                <p className="text-[10px] text-cozy-muted mt-0.5">Your day is a calm blank canvas.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dashboard.todaySchedule.map((evt: any) => (
                  <div
                    key={evt._id}
                    onClick={() => navigate('/schedule')}
                    className="p-2.5 rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-50 dark:border-purple-900/30 flex items-center justify-between cursor-pointer hover:shadow-xs transition-shadow"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{evt.category?.icon || '✨'}</span>
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${
                            evt.status === 'completed' ? 'line-through text-cozy-muted' : ''
                          }`}
                        >
                          {evt.title}
                        </p>
                        <p className="text-[10px] text-cozy-muted">
                          {new Date(evt.startAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    {evt.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Private Notes Preview (STRICT PRIVACY: ONLY CURRENT USER) */}
          <Card className="space-y-3 bg-gradient-to-br from-white to-amber-50/30 dark:from-cozy-darkCard dark:to-amber-950/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                    My Little Notes
                  </h3>
                  <Badge variant="yellow" size="sm">
                    Private 🔒
                  </Badge>
                </div>
                <p className="text-[11px] text-cozy-muted">Your private digital notebook</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/notes')}
                className="text-xs text-cozy-lavender"
              >
                Notes <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {!dashboard?.quickNotes || dashboard.quickNotes.length === 0 ? (
              <div className="text-center py-6">
                <div className="text-2xl mb-1">📝</div>
                <p className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  No notes written yet
                </p>
                <p className="text-[10px] text-cozy-muted mt-0.5">
                  Your little notebook is waiting for its first thought.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dashboard.quickNotes.map((note: any) => (
                  <div
                    key={note._id}
                    onClick={() => navigate('/notes')}
                    className="p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-xs"
                    style={{ backgroundColor: `${note.color || '#FFFFFF'}80` }}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate">
                        {note.icon} {note.title}
                      </h5>
                      {note.isPinned && <span className="text-xs">📌</span>}
                    </div>
                    <p className="text-[11px] text-cozy-muted line-clamp-2 mt-1">
                      {note.content || 'Empty note...'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Relaxation Sanctuary Card */}
          <div
            onClick={() => navigate('/relax')}
            className="p-5 rounded-3xl bg-gradient-to-r from-purple-400 via-indigo-400 to-sky-400 text-white shadow-soft-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-transform select-none"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🎧</span>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
                Public Sanctuary
              </span>
            </div>
            <h4 className="text-base font-black">Relax & Unwind</h4>
            <p className="text-xs text-white/90 mt-1 leading-snug">
              Listen to gentle rain, ocean waves, singing bowls, or set a sleep timer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
