import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { formatCurrencyAmount } from 'cozynest-shared';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import type { AnalyticsSummaryResponse } from 'cozynest-shared';

// Helper to remove any emojis from text to guarantee clean typography
const stripEmojis = (str: string) =>
  str.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '').trim();

export const AnalyticsPage: React.FC = () => {
  const { activeFamily, user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery<{ success: boolean; data: AnalyticsSummaryResponse }>({
    queryKey: ['analytics', activeFamily?._id, selectedMonth, selectedYear],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily?._id}/analytics/summary`, {
        params: { month: selectedMonth, year: selectedYear }
      });
      return res.data;
    },
    enabled: !!activeFamily?._id
  });

  const analytics = data?.data;
  const currency = activeFamily?.defaultCurrency || user?.preferredCurrency || 'INR';

  // Prepare Pie Chart data (strip emojis from category names)
  const pieData =
    analytics?.categoryBreakdown.map(c => ({
      name: stripEmojis(c.name) || 'Category',
      value: c.amountMinor / 100,
      color: c.color,
      percentage: c.percentage
    })) || [];

  // Monthly trend data
  const trendData =
    analytics?.monthlyTrend.map(t => ({
      month: t.month,
      amount: t.amountMinor / 100
    })) || [];

  // Member contributions data
  const memberData =
    analytics?.memberContributions.map(m => ({
      name: stripEmojis(m.name) || 'Member',
      amount: m.amountMinor / 100,
      percentage: m.percentage
    })) || [];

  // Budget vs Actual data
  const budgetData =
    analytics?.budgetVsActual.map(b => ({
      category: stripEmojis(b.categoryName) || 'Category',
      Budget: b.budgetMinor / 100,
      Actual: b.actualMinor / 100
    })) || [];

  // Common Recharts Tooltip styling for Dark & Light modes
  const chartTooltipStyle = {
    borderRadius: '16px',
    backgroundColor: isDark ? '#1e1b4b' : 'rgba(255, 255, 255, 0.96)',
    border: isDark ? '1px solid #4338ca' : '1px solid #E9D5FF',
    color: isDark ? '#f8fafc' : '#1e1b4b',
    boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(167, 139, 250, 0.15)',
    fontSize: '12px',
    fontWeight: 600
  };

  const chartAxisTickColor = isDark ? '#cbd5e1' : '#64748b';
  const chartNameTickColor = isDark ? '#f8fafc' : '#1e293b';

  return (
    <div className="space-y-6">
      {/* Page Title & Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
            Financial Analytics
          </h2>
          <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
            Visual insights, trends & comparisons
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
            className="bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/60 rounded-2xl px-3 py-2 text-xs font-semibold text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender shadow-soft-xs"
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ].map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
            className="bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/60 rounded-2xl px-3 py-2 text-xs font-semibold text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender shadow-soft-xs"
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* AI Smart Rule-Based Insights Card */}
      {analytics?.insights && analytics.insights.length > 0 && (
        <Card className="bg-gradient-to-r from-amber-50/70 via-purple-50/60 to-pink-50/60 dark:from-amber-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-purple-100 dark:border-purple-800/40 p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 flex items-center justify-center shrink-0">
              <LightbulbOutlinedIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-800 dark:text-purple-300">
                Personalized Household Insights
              </h4>
              <div className="space-y-1 text-xs text-cozy-text dark:text-cozy-darkText font-medium">
                {analytics.insights.map((insight, idx) => (
                  <p key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-cozy-lavender shrink-0" />
                    <span>{stripEmojis(insight)}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2-Column Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
                Spending by Category
              </h3>
              <p className="text-xs text-cozy-muted">Donut distribution for selected month</p>
            </div>
            <PieChartOutlinedIcon className="w-5 h-5 text-cozy-lavender" />
          </div>

          {isLoading ? (
            <Skeleton className="h-64 rounded-3xl" />
          ) : pieData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <CategoryOutlinedIcon className="w-8 h-8 text-cozy-lavender mb-2 opacity-60" />
              <p className="text-xs text-cozy-muted">No expenses recorded for this month</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#A78BFA'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${currency} ${val.toFixed(2)}`, 'Spent']}
                    contentStyle={chartTooltipStyle}
                    itemStyle={{ color: isDark ? '#f8fafc' : '#1e1b4b' }}
                    labelStyle={{ color: isDark ? '#f8fafc' : '#1e1b4b', fontWeight: 700 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Category Pills (High Contrast, Beautiful Dark Mode Support & Zero Emojis) */}
          <div className="flex flex-wrap gap-2 pt-2">
            {pieData.slice(0, 8).map((c, i) => (
              <span
                key={i}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border transition-all text-slate-800 dark:text-slate-100 bg-white/90 dark:bg-slate-800/90 shadow-soft-xs"
                style={{
                  borderColor: `${c.color}60`
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: c.color }} />
                <span>{c.name}:</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400">{c.percentage}%</span>
              </span>
            ))}
          </div>
        </Card>

        {/* Monthly Spending Trend Area Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
                Monthly Spending Trend
              </h3>
              <p className="text-xs text-cozy-muted">Last 6 months progression</p>
            </div>
            <TrendingUpOutlinedIcon className="w-5 h-5 text-cozy-lavender" />
          </div>

          {isLoading ? (
            <Skeleton className="h-64 rounded-3xl" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A78BFA" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#A78BFA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: chartAxisTickColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartAxisTickColor }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={val => `${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${currency} ${val.toFixed(2)}`, 'Total Expenses']}
                    contentStyle={chartTooltipStyle}
                    itemStyle={{ color: isDark ? '#f8fafc' : '#1e1b4b' }}
                    labelStyle={{ color: isDark ? '#f8fafc' : '#1e1b4b', fontWeight: 700 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#A78BFA"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSpent)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Member Contribution Comparison Bar Chart */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
                Member Contributions
              </h3>
              <p className="text-xs text-cozy-muted">Who paid what this month</p>
            </div>
            <PeopleAltOutlinedIcon className="w-5 h-5 text-cozy-lavender" />
          </div>

          {isLoading ? (
            <Skeleton className="h-56 rounded-3xl" />
          ) : memberData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <PeopleAltOutlinedIcon className="w-8 h-8 text-cozy-lavender mb-2 opacity-60" />
              <p className="text-xs text-cozy-muted">No member contributions recorded yet</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberData} layout="vertical">
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: chartAxisTickColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: chartNameTickColor, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${currency} ${val.toFixed(2)}`, 'Paid']}
                    contentStyle={chartTooltipStyle}
                    itemStyle={{ color: isDark ? '#f8fafc' : '#1e1b4b' }}
                    labelStyle={{ color: isDark ? '#f8fafc' : '#1e1b4b', fontWeight: 700 }}
                  />
                  <Bar dataKey="amount" fill="#B7E4C7" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Budget vs Actual Comparison */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
                Budget Target vs Actual
              </h3>
              <p className="text-xs text-cozy-muted">Category spending limits monitoring</p>
            </div>
            <TrackChangesOutlinedIcon className="w-5 h-5 text-cozy-lavender" />
          </div>

          {isLoading ? (
            <Skeleton className="h-56 rounded-3xl" />
          ) : budgetData.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center">
              <TrackChangesOutlinedIcon className="w-8 h-8 text-cozy-lavender mb-2 opacity-60" />
              <p className="text-xs text-cozy-muted">
                No category budgets configured yet. Admin can set targets under Budgets.
              </p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetData}>
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: chartAxisTickColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: chartAxisTickColor }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: number) => [`${currency} ${val.toFixed(2)}`]}
                    contentStyle={chartTooltipStyle}
                    itemStyle={{ color: isDark ? '#f8fafc' : '#1e1b4b' }}
                    labelStyle={{ color: isDark ? '#f8fafc' : '#1e1b4b', fontWeight: 700 }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: chartAxisTickColor, paddingTop: '8px' }} />
                  <Bar dataKey="Budget" fill="#DDD6FE" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Actual" fill="#F472B6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
