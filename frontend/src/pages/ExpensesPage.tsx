import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import {
  formatCurrencyAmount,
  PAYMENT_METHODS,
  INCOME_CATEGORIES,
  INCOME_PAYMENT_METHODS
} from 'cozynest-shared';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  CreditCard,
  Tag,
  User,
  ArrowUpDown,
  FileText,
  TrendingUp,
  Receipt,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  Sparkles,
  PieChart,
  Paperclip,
  UploadCloud,
  Eye,
  Download,
  FileSpreadsheet,
  X
} from 'lucide-react';
import type {
  ExpenseSummary,
  ExpenseCategorySummary,
  IncomeSummary,
  MonthlyCashflowSummary
} from 'cozynest-shared';

export const ExpensesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user, activeFamily } = useAuthStore();

  // Active Tab: 'expenses' (Debits) | 'income' (Credits / Salary) | 'cashflow' (Monthly Statement)
  const initialTab = (searchParams.get('tab') as 'expenses' | 'income' | 'cashflow') || 'expenses';
  const [activeTab, setActiveTab] = useState<'expenses' | 'income' | 'cashflow'>(initialTab);

  const handleTabChange = (tab: 'expenses' | 'income' | 'cashflow') => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      next.delete('action');
      return next;
    }, { replace: true });
  };

  // ================= EXPENSES STATE =================
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [sortBy, setSortBy] = useState('expenseDate');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);

  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseSummary | null>(null);
  const [viewingExpense, setViewingExpense] = useState<ExpenseSummary | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Expense form state
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategoryId, setExpCategoryId] = useState('');
  const [expPaidByUserId, setExpPaidByUserId] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expPaymentMethod, setExpPaymentMethod] = useState('UPI');
  const [expMerchant, setExpMerchant] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expTags, setExpTags] = useState('');
  const [expReceiptFile, setExpReceiptFile] = useState<string>('');
  const [expReceiptName, setExpReceiptName] = useState<string>('');
  const [previewDocument, setPreviewDocument] = useState<{
    url: string;
    title: string;
    fileName?: string;
  } | null>(null);
  const expenseFileInputRef = useRef<HTMLInputElement>(null);

  // ================= INCOME / SALARY STATE =================
  const [incomeSearch, setIncomeSearch] = useState('');
  const [selectedIncomeCategory, setSelectedIncomeCategory] = useState<string>('');
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeSummary | null>(null);
  const [deletingIncomeId, setDeletingIncomeId] = useState<string | null>(null);

  // Income form state
  const [incTitle, setIncTitle] = useState('');
  const [incAmount, setIncAmount] = useState('');
  const [incSource, setIncSource] = useState('');
  const [incCategory, setIncCategory] = useState('Salary');
  const [incDate, setIncDate] = useState(new Date().toISOString().split('T')[0]);
  const [incPaymentMethod, setIncPaymentMethod] = useState('Bank Transfer');
  const [incDescription, setIncDescription] = useState('');

  // ================= CASHFLOW LEDGER STATE =================
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [cashflowYear, setCashflowYear] = useState(currentYear);
  const [cashflowMonth, setCashflowMonth] = useState(currentMonth);

  // ================= QUERIES & DATA =================
  // Fetch Categories for expense form
  const { data: categoriesData } = useQuery<{ categories: ExpenseCategorySummary[] }>({
    queryKey: ['categories', activeFamily?._id],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily?._id}/categories`);
      return res.data.data;
    },
    enabled: !!activeFamily?._id
  });

  // Fetch Family Members
  const { data: membersData } = useQuery({
    queryKey: ['members', activeFamily?._id],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily?._id}/members`);
      return res.data.data;
    },
    enabled: !!activeFamily?._id
  });

  // Fetch Family Expenses (Debits)
  const { data: expensesData, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ['expenses', activeFamily?._id, expenseSearch, selectedCategory, selectedMember, sortBy, sortOrder, page],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily?._id}/expenses`, {
        params: {
          search: expenseSearch,
          categoryId: selectedCategory || undefined,
          paidByUserId: selectedMember || undefined,
          sortBy,
          sortOrder,
          page,
          limit: 25
        }
      });
      return res.data.data;
    },
    enabled: !!activeFamily?._id && activeTab === 'expenses'
  });

  // Fetch Family Incomes (Credits / Salary)
  const { data: incomesData, isLoading: isLoadingIncomes } = useQuery({
    queryKey: ['incomes', activeFamily?._id, incomeSearch, selectedIncomeCategory],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily?._id}/incomes`, {
        params: {
          search: incomeSearch,
          category: selectedIncomeCategory || undefined,
          limit: 50
        }
      });
      return res.data.data;
    },
    enabled: !!activeFamily?._id && activeTab === 'income'
  });

  // Fetch Monthly Cashflow (Credit & Debit Ledger)
  const { data: cashflowData, isLoading: isLoadingCashflow } = useQuery<{ success: boolean; data: MonthlyCashflowSummary }>({
    queryKey: ['cashflow', activeFamily?._id, cashflowYear, cashflowMonth],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily?._id}/cashflow`, {
        params: {
          year: cashflowYear,
          month: cashflowMonth
        }
      });
      return res.data;
    },
    enabled: !!activeFamily?._id && activeTab === 'cashflow'
  });

  const currency = activeFamily?.defaultCurrency || user?.preferredCurrency || 'INR';
  const categories = useMemo(() => {
    const list = categoriesData?.categories || [];
    const seen = new Set<string>();
    // Prioritize activeFamily's categories if any mixed list exists
    const sorted = [...list].sort((a, b) => {
      const aFam = a.familyId === activeFamily?._id ? 0 : 1;
      const bFam = b.familyId === activeFamily?._id ? 0 : 1;
      return aFam - bFam;
    });
    return sorted.filter(c => {
      const key = c.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [categoriesData?.categories, activeFamily?._id]);
  const members = useMemo(() => membersData?.members || [], [membersData?.members]);
  const expenses: ExpenseSummary[] = useMemo(() => expensesData?.expenses || [], [expensesData?.expenses]);
  const incomes: IncomeSummary[] = useMemo(() => incomesData?.incomes || [], [incomesData?.incomes]);
  const cashflow = cashflowData?.data;

  // Check URL query action and sync tab safely
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const actionParam = searchParams.get('action');

    if (tabParam && ['expenses', 'income', 'cashflow'].includes(tabParam)) {
      setActiveTab(prev => (prev !== tabParam ? (tabParam as 'expenses' | 'income' | 'cashflow') : prev));
    }

    if (actionParam === 'add') {
      if (tabParam === 'income') {
        setIsAddIncomeModalOpen(true);
      } else {
        setIsAddExpenseModalOpen(true);
      }
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Set default paidByUser when members or user load
  useEffect(() => {
    if (user && !expPaidByUserId) {
      setExpPaidByUserId(user._id);
    }
  }, [user, expPaidByUserId]);

  // Set default category when categories load if not yet selected
  useEffect(() => {
    if (categories.length > 0 && !expCategoryId) {
      setExpCategoryId(categories[0]._id);
    }
  }, [categories, expCategoryId]);

  // ================= EXPENSE MUTATIONS & HELPERS =================
  const handleExpenseFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File exceeds 10MB limit. Please upload a smaller file.');
      return;
    }
    setExpReceiptName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      setExpReceiptFile(e.target?.result as string);
      toast.success(`Attached bill/receipt: ${file.name} 📎`);
    };
    reader.readAsDataURL(file);
  };

  const openEditExpense = (exp: ExpenseSummary) => {
    setEditingExpense(exp);
    setExpTitle(exp.title);
    setExpAmount((exp.amountMinor / 100).toString());
    setExpCategoryId(typeof exp.categoryId === 'object' ? (exp.categoryId as any)._id : exp.categoryId);
    setExpPaidByUserId(typeof exp.paidByUserId === 'object' ? (exp.paidByUserId as any)._id : exp.paidByUserId);
    setExpDate(new Date(exp.expenseDate).toISOString().split('T')[0]);
    setExpPaymentMethod(exp.paymentMethod || 'UPI');
    setExpMerchant(exp.merchant || '');
    setExpDescription(exp.description || '');
    setExpTags(exp.tags?.join(', ') || '');
    setExpReceiptFile(exp.receiptUrl || '');
    setExpReceiptName(exp.receiptUrl ? 'Attached Bill / Receipt' : '');
    setIsAddExpenseModalOpen(true);
  };

  const resetExpenseForm = () => {
    setExpTitle('');
    setExpAmount('');
    setExpCategoryId(categories[0]?._id || '');
    setExpPaidByUserId(user?._id || '');
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpPaymentMethod('UPI');
    setExpMerchant('');
    setExpDescription('');
    setExpTags('');
    setExpReceiptFile('');
    setExpReceiptName('');
    setEditingExpense(null);
  };

  const saveExpenseMutation = useMutation({
    mutationFn: async () => {
      const amtNum = parseFloat(expAmount);
      if (isNaN(amtNum) || amtNum <= 0) throw new Error('Please enter a valid amount');
      if (!expTitle.trim()) throw new Error('Expense title is required');
      const catId = expCategoryId || categories[0]?._id;
      if (!catId) throw new Error('Category is required');

      const cleanCatId = typeof catId === 'object' ? (catId as any)._id : catId;
      const cleanPaidBy = expPaidByUserId || user?._id;
      const cleanPayerId = typeof cleanPaidBy === 'object' ? (cleanPaidBy as any)._id : cleanPaidBy;

      const payload = {
        title: expTitle.trim(),
        amount: amtNum,
        currency,
        categoryId: cleanCatId,
        paidByUserId: cleanPayerId,
        expenseDate: (() => {
          if (!expDate) return new Date().toISOString();
          const d = new Date(expDate);
          const now = new Date();
          if (d.toDateString() === now.toDateString()) {
            d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          }
          return d.toISOString();
        })(),
        paymentMethod: expPaymentMethod,
        merchant: expMerchant.trim(),
        description: expDescription.trim(),
        tags: expTags ? expTags.split(',').map(t => t.trim()).filter(Boolean) : [],
        receiptUrl: expReceiptFile || ''
      };

      if (editingExpense) {
        await api.patch(`/families/${activeFamily?._id}/expenses/${editingExpense._id}`, payload);
      } else {
        await api.post(`/families/${activeFamily?._id}/expenses`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success(editingExpense ? 'Expense updated! 🌷' : 'Expense recorded successfully! 🧾');
      setIsAddExpenseModalOpen(false);
      resetExpenseForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save expense.');
    }
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/families/${activeFamily?._id}/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Expense removed! 🗑️');
      setDeletingExpenseId(null);
    }
  });

  // ================= INCOME MUTATIONS =================
  const resetIncomeForm = () => {
    setIncTitle('');
    setIncAmount('');
    setIncSource('');
    setIncCategory('Salary');
    setIncDate(new Date().toISOString().split('T')[0]);
    setIncPaymentMethod('Bank Transfer');
    setIncDescription('');
    setEditingIncome(null);
  };

  const saveIncomeMutation = useMutation({
    mutationFn: async () => {
      const amtNum = parseFloat(incAmount);
      if (isNaN(amtNum) || amtNum <= 0) throw new Error('Please enter a valid amount');
      if (!incTitle.trim()) throw new Error('Income title is required (e.g. October Salary)');
      if (!incSource.trim()) throw new Error('Source / Employer is required (e.g. Company name, Client, Tenant)');

      const payload = {
        title: incTitle.trim(),
        amount: amtNum,
        currency,
        source: incSource.trim(),
        category: incCategory,
        receivedDate: (() => {
          if (!incDate) return new Date().toISOString();
          const d = new Date(incDate);
          const now = new Date();
          if (d.toDateString() === now.toDateString()) {
            d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
          }
          return d.toISOString();
        })(),
        paymentMethod: incPaymentMethod,
        description: incDescription.trim()
      };

      if (editingIncome) {
        await api.patch(`/families/${activeFamily?._id}/incomes/${editingIncome._id}`, payload);
      } else {
        await api.post(`/families/${activeFamily?._id}/incomes`, payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success(editingIncome ? 'Income updated! 🌷' : 'Salary / Income recorded! 💰');
      setIsAddIncomeModalOpen(false);
      resetIncomeForm();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to save income.');
    }
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/families/${activeFamily?._id}/incomes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['cashflow'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Income record removed! 🗑️');
      setDeletingIncomeId(null);
    }
  });

  // Populate edit expense
  useEffect(() => {
    if (editingExpense) {
      setExpTitle(editingExpense.title);
      setExpAmount((editingExpense.amountMinor / 100).toString());

      const rawCat = editingExpense.categoryId;
      const catId = typeof rawCat === 'string'
        ? rawCat
        : (rawCat as any)?._id || editingExpense.category?._id || '';
      setExpCategoryId(catId || categories[0]?._id || '');

      const rawPayer = editingExpense.paidByUserId;
      const payerId = typeof rawPayer === 'string'
        ? rawPayer
        : (rawPayer as any)?._id || editingExpense.paidByUser?._id || '';
      setExpPaidByUserId(payerId || user?._id || '');

      setExpDate(new Date(editingExpense.expenseDate).toISOString().split('T')[0]);
      setExpPaymentMethod(editingExpense.paymentMethod || 'UPI');
      setExpMerchant(editingExpense.merchant || '');
      setExpDescription(editingExpense.description || '');
      setExpTags(editingExpense.tags?.join(', ') || '');
      setIsAddExpenseModalOpen(true);
    }
  }, [editingExpense, categories, user]);

  // Populate edit income
  useEffect(() => {
    if (editingIncome) {
      setIncTitle(editingIncome.title);
      setIncAmount((editingIncome.amountMinor / 100).toString());
      setIncSource(editingIncome.source);
      setIncCategory(editingIncome.category);
      setIncDate(new Date(editingIncome.receivedDate).toISOString().split('T')[0]);
      setIncPaymentMethod(editingIncome.paymentMethod || 'Bank Transfer');
      setIncDescription(editingIncome.description || '');
      setIsAddIncomeModalOpen(true);
    }
  }, [editingIncome]);

  return (
    <div className="space-y-6">
      {/* Page Title & Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
            Expenses & Cashflow
          </h2>
          <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
            Manage household expenses (debits), add salary (credits) & track monthly cashflow
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'income' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetIncomeForm();
                setIsAddIncomeModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft-sm"
            >
              <TrendingUp className="w-4 h-4 mr-1.5" /> + Add Salary / Income
            </Button>
          ) : activeTab === 'cashflow' ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetIncomeForm();
                  setIsAddIncomeModalOpen(true);
                }}
                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                <TrendingUp className="w-4 h-4 mr-1.5" /> + Add Salary
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  resetExpenseForm();
                  setIsAddExpenseModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1.5" /> + Add Expense
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetExpenseForm();
                setIsAddExpenseModalOpen(true);
              }}
              className="shadow-soft-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" /> + Add Expense
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-3xl w-full max-w-xl border border-purple-50 dark:border-purple-900/30">
        <button
          onClick={() => handleTabChange('expenses')}
          className={`flex-1 py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'expenses'
              ? 'bg-white dark:bg-cozy-darkCard text-purple-700 dark:text-purple-300 shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <Receipt className="w-4 h-4 text-cozy-lavender" />
          <span>Expenses (Debits)</span>
        </button>

        <button
          onClick={() => handleTabChange('income')}
          className={`flex-1 py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'income'
              ? 'bg-white dark:bg-cozy-darkCard text-emerald-700 dark:text-emerald-400 shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Salary & Income (Credits)</span>
        </button>

        <button
          onClick={() => handleTabChange('cashflow')}
          className={`flex-1 py-2 px-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'cashflow'
              ? 'bg-white dark:bg-cozy-darkCard text-sky-700 dark:text-sky-300 shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <PieChart className="w-4 h-4 text-sky-500" />
          <span>Monthly Cashflow Ledger</span>
        </button>
      </div>

      {/* ================= TAB 1: EXPENSES (DEBITS) ================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-cozy-muted" />
                <input
                  type="text"
                  placeholder="Search by title, store, tag..."
                  value={expenseSearch}
                  onChange={e => setExpenseSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-purple-50 dark:border-purple-900/30 rounded-2xl pl-10 pr-4 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-purple-50 dark:border-purple-900/30 rounded-2xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="">All Categories (23+)</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedMember}
                onChange={e => setSelectedMember(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-purple-50 dark:border-purple-900/30 rounded-2xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="">Paid By: Everyone</option>
                {members.map((m: any) => (
                  <option key={m.userId} value={m.userId}>
                    {m.nickname || m.fullName}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800/40 border border-purple-50 dark:border-purple-900/30 rounded-2xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
                >
                  <option value="expenseDate">Sort by Date</option>
                  <option value="amountMinor">Sort by Amount</option>
                  <option value="title">Sort by Title</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2 rounded-2xl border border-purple-100 dark:border-purple-900/40 hover:bg-cozy-lavender-soft/60 text-cozy-muted hover:text-cozy-text"
                  title="Toggle sort direction"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>

          {/* Expenses List */}
          {isLoadingExpenses ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-3xl" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon="🧾"
              title="No household expenses found"
              description="Record your family groceries, bills, dinners, and shopping to start organizing your home finances."
              actionLabel="Add First Expense"
              onAction={() => {
                resetExpenseForm();
                setIsAddExpenseModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-3">
              {expenses.map(exp => {
                const catObj = exp.category || (typeof exp.categoryId === 'object' ? (exp.categoryId as any) : null);
                const catName = catObj?.name || 'General';
                const catIcon = catObj?.icon || '🧾';
                const catColor = catObj?.color || '#A78BFA';
                const paidByObj = exp.paidByUser || (typeof exp.paidByUserId === 'object' ? (exp.paidByUserId as any) : null);
                const paidByName = paidByObj?.nickname || paidByObj?.fullName || 'Family Member';

                return (
                  <Card
                    key={exp._id}
                    className="p-4 hover:border-purple-200 dark:hover:border-purple-800/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-soft-sm"
                        style={{ backgroundColor: `${catColor}25` }}
                      >
                        {catIcon}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText truncate">
                            {exp.title}
                          </h4>
                          {exp.isRecurring && (
                            <Badge variant="lavender" size="sm">Recurring</Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-cozy-muted">
                          <span className="font-medium text-purple-700 dark:text-purple-300">
                            {catName}
                          </span>
                          <span>•</span>
                          <span>{new Date(exp.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {paidByName}
                          </span>
                        {exp.merchant && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 dark:text-slate-400 italic">
                              At: {exp.merchant}
                            </span>
                          </>
                        )}
                      </div>

                      {exp.receiptUrl && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDocument({
                                url: exp.receiptUrl!,
                                title: `${exp.title} - Receipt / Bill`,
                                fileName: `${exp.title.replace(/\s+/g, '_')}_receipt`
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 text-[11px] font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all shadow-soft-sm"
                            title="Click to view verified bill/receipt"
                          >
                            <Receipt className="w-3.5 h-3.5 text-cozy-lavender" />
                            <span>Receipt Attached</span>
                            <Eye className="w-3 h-3 ml-0.5 opacity-80" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-purple-50 dark:border-purple-900/20">
                    <p className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                      - {formatCurrencyAmount(exp.amountMinor, exp.currency)}
                    </p>

                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {exp.receiptUrl && (
                        <button
                          onClick={() => setPreviewDocument({
                            url: exp.receiptUrl!,
                            title: `${exp.title} - Receipt / Bill`,
                            fileName: `${exp.title.replace(/\s+/g, '_')}_receipt`
                          })}
                          className="p-1.5 rounded-xl text-cozy-muted hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                          title="View Receipt"
                        >
                          <Receipt className="w-4 h-4 text-cozy-lavender" />
                        </button>
                      )}
                      <button
                        onClick={() => setViewingExpense(exp)}
                        className="p-1.5 rounded-xl text-cozy-muted hover:text-cozy-lavender hover:bg-cozy-lavender-soft/60"
                        title="View Details"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditExpense(exp)}
                        className="p-1.5 rounded-xl text-cozy-muted hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingExpenseId(exp._id)}
                        className="p-1.5 rounded-xl text-cozy-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: SALARY & INCOME (CREDITS) ================= */}
      {activeTab === 'income' && (
        <div className="space-y-4">
          {/* Income Header Highlight Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-200/60 dark:border-emerald-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-2xl shrink-0">
                💼
              </div>
              <div>
                <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
                  Salary & Cash Inflow Tracker
                </h3>
                <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted mt-0.5">
                  Record monthly salaries, freelance income, investments, rental income & gifts.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetIncomeForm();
                setIsAddIncomeModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shrink-0 shadow-soft-sm"
            >
              <Plus className="w-4 h-4 mr-1.5" /> + Add Salary / Income
            </Button>
          </div>

          {/* Income Filters */}
          <Card className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-cozy-muted" />
                <input
                  type="text"
                  placeholder="Search by employer, source, title..."
                  value={incomeSearch}
                  onChange={e => setIncomeSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/40 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl pl-10 pr-4 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={selectedIncomeCategory}
                onChange={e => setSelectedIncomeCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-emerald-500"
              >
                <option value="">All Inflow Categories</option>
                {INCOME_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Income Records List */}
          {isLoadingIncomes ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-3xl" />
              ))}
            </div>
          ) : incomes.length === 0 ? (
            <EmptyState
              icon="💰"
              title="No salary or income records yet"
              description="Add your monthly salary or any cash inflow to track exactly where money came from and compute your total monthly credits."
              actionLabel="Add Your Salary"
              onAction={() => {
                resetIncomeForm();
                setIsAddIncomeModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-3">
              {incomes.map(inc => (
                <Card
                  key={inc._id}
                  className="p-4 hover:border-emerald-300 dark:hover:border-emerald-800/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group bg-gradient-to-r from-white via-white to-emerald-50/20 dark:from-cozy-darkCard dark:to-emerald-950/20"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl shrink-0 shadow-soft-sm">
                      {INCOME_CATEGORIES.find(c => c.id === inc.category || c.label === inc.category)?.icon || '💰'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText truncate">
                          {inc.title}
                        </h4>
                        <Badge variant="mint" size="sm">CREDIT +</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-cozy-muted">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          From: {inc.source}
                        </span>
                        <span>•</span>
                        <span>{inc.category}</span>
                        <span>•</span>
                        <span>{new Date(inc.receivedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>Deposited via {inc.paymentMethod}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-50 dark:border-emerald-900/20">
                    <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                      + {formatCurrencyAmount(inc.amountMinor, inc.currency)}
                    </p>

                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingIncome(inc)}
                        className="p-1.5 rounded-xl text-cozy-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        title="Edit Income"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingIncomeId(inc._id)}
                        className="p-1.5 rounded-xl text-cozy-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete Income"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: MONTHLY CASHFLOW LEDGER (CREDIT & DEBIT) ================= */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          {/* Month Selector & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/30">
            <div>
              <h3 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                Complete Monthly Credit & Debit Statement
              </h3>
              <p className="text-xs text-cozy-muted mt-0.5">
                Full accounting of money in (salary/credits) and money out (expenses/debits)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={cashflowMonth}
                onChange={e => setCashflowMonth(parseInt(e.target.value, 10))}
                className="bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-1.5 text-xs font-bold text-cozy-text dark:text-cozy-darkText outline-none"
              >
                {[
                  'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'
                ].map((m, idx) => (
                  <option key={idx + 1} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={cashflowYear}
                onChange={e => setCashflowYear(parseInt(e.target.value, 10))}
                className="bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-1.5 text-xs font-bold text-cozy-text dark:text-cozy-darkText outline-none"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3 Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Credits */}
            <Card className="p-5 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 dark:from-emerald-950/40 dark:to-cozy-darkCard border-emerald-200/60 dark:border-emerald-800/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Total Monthly Credits
                </span>
                <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 truncate">
                + {formatCurrencyAmount(cashflow?.totalCreditsMinor || 0, currency)}
              </p>
              <p className="text-[11px] text-cozy-muted mt-1">
                {cashflow?.creditsCount || 0} inflow transactions (Salary & Incomes)
              </p>
            </Card>

            {/* Total Debits */}
            <Card className="p-5 bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 dark:from-rose-950/40 dark:to-cozy-darkCard border-rose-200/60 dark:border-rose-800/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  Total Monthly Debits
                </span>
                <span className="p-2 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                  <ArrowDownRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2 truncate">
                - {formatCurrencyAmount(cashflow?.totalDebitsMinor || 0, currency)}
              </p>
              <p className="text-[11px] text-cozy-muted mt-1">
                {cashflow?.debitsCount || 0} household spending transactions
              </p>
            </Card>

            {/* Net Savings */}
            <Card className="p-5 bg-gradient-to-br from-sky-500/10 via-white to-purple-500/5 dark:from-sky-950/40 dark:to-cozy-darkCard border-sky-200/60 dark:border-sky-800/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
                  Net Monthly Savings
                </span>
                <span className="p-2 rounded-2xl bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                  <Coins className="w-4 h-4" />
                </span>
              </div>
              <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-2 truncate">
                {formatCurrencyAmount(cashflow?.netSavingsMinor || 0, currency)}
              </p>
              <p className="text-[11px] text-cozy-muted mt-1">
                Savings rate: <span className="font-bold text-sky-700 dark:text-sky-300">{cashflow?.savingsRatePercent || 0}%</span> of total income
              </p>
            </Card>
          </div>

          {/* Attribution Panels: Where it came from & where it was done */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Where Money Came */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-50 dark:border-purple-900/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🏢</span>
                  <h4 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText uppercase tracking-wider">
                    From Where Money Came (Inflows)
                  </h4>
                </div>
                <Badge variant="mint" size="sm">Credits</Badge>
              </div>

              {cashflow?.topIncomeSources?.length === 0 ? (
                <p className="text-xs text-cozy-muted py-4 text-center">No income sources recorded for this month</p>
              ) : (
                <div className="space-y-2.5">
                  {cashflow?.topIncomeSources?.map((src, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-cozy-text dark:text-cozy-darkText truncate max-w-[200px]">
                        {src.source}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        + {formatCurrencyAmount(src.amountMinor, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Where It Was Done */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-purple-50 dark:border-purple-900/20 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛍️</span>
                  <h4 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText uppercase tracking-wider">
                    Where Money Was Spent (Outflows)
                  </h4>
                </div>
                <Badge variant="lavender" size="sm">Debits</Badge>
              </div>

              {cashflow?.topExpenseDestinations?.length === 0 ? (
                <p className="text-xs text-cozy-muted py-4 text-center">No expenses recorded for this month</p>
              ) : (
                <div className="space-y-2.5">
                  {cashflow?.topExpenseDestinations?.map((dest, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-cozy-text dark:text-cozy-darkText truncate max-w-[200px]">
                        {dest.destination}
                      </span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        - {formatCurrencyAmount(dest.amountMinor, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Combined Chronological Ledger Table */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-purple-50 dark:border-purple-900/20 pb-3">
              <div>
                <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                  Chronological Transaction Flow
                </h4>
                <p className="text-xs text-cozy-muted mt-0.5">
                  Every credit and debit item in {cashflow?.monthName || 'this month'}
                </p>
              </div>
              <Badge variant="lavender" size="sm">
                {cashflow?.ledger?.length || 0} transactions
              </Badge>
            </div>

            {isLoadingCashflow ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-2xl" />
                ))}
              </div>
            ) : cashflow?.ledger?.length === 0 ? (
              <EmptyState
                icon="📊"
                title="No transactions for this month"
                description="Add your monthly salary or record expenses to generate your complete monthly financial flow."
              />
            ) : (
              <div className="space-y-2.5">
                {(cashflow?.ledger || []).map(item => {
                  const isCredit = item.type === 'credit';
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl border border-purple-50 dark:border-purple-900/30 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCredit
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                          }`}
                        >
                          {isCredit ? '+' : '-'}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate">
                              {item.title}
                            </span>
                            <Badge variant={isCredit ? 'mint' : 'lavender'} size="sm">
                              {isCredit ? 'CREDIT' : 'DEBIT'}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-cozy-muted">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.sourceOrDestination}
                            </span>
                            <span>•</span>
                            <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            <span>•</span>
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>via {item.paymentMethod}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm font-black ${
                            isCredit
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isCredit ? '+' : '-'} {formatCurrencyAmount(item.amountMinor, item.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT EXPENSE ================= */}
      <Modal
        isOpen={isAddExpenseModalOpen}
        onClose={() => {
          setIsAddExpenseModalOpen(false);
          resetExpenseForm();
        }}
        title={editingExpense ? 'Edit Household Expense' : 'Add Household Expense'}
        description="Record money spent, the merchant/store, and payment method."
        maxWidth="lg"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            saveExpenseMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Expense Title"
              placeholder="e.g. Weekly Groceries, Electric Bill"
              value={expTitle}
              onChange={e => setExpTitle(e.target.value)}
              required
            />
            <Input
              label={`Amount (${currency})`}
              type="number"
              step="0.01"
              placeholder="e.g. 2450.50"
              value={expAmount}
              onChange={e => setExpAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Category
              </label>
              <select
                value={expCategoryId || (categories[0]?._id ?? '')}
                onChange={e => setExpCategoryId(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
                required
              >
                {categories.length === 0 && <option value="">Loading categories...</option>}
                {categories.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Paid By
              </label>
              <select
                value={expPaidByUserId}
                onChange={e => setExpPaidByUserId(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                {members.map((m: any) => (
                  <option key={m.userId} value={m.userId}>
                    {m.nickname || m.fullName} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Where was it spent? (Store / Merchant)"
              placeholder="e.g. Reliance Fresh, Amazon, Shell"
              value={expMerchant}
              onChange={e => setExpMerchant(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Payment Method
              </label>
              <select
                value={expPaymentMethod}
                onChange={e => setExpPaymentMethod(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm.id} value={pm.id}>
                    {pm.icon} {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={expDate}
              onChange={e => setExpDate(e.target.value)}
              required
            />
            <Input
              label="Tags (comma separated)"
              placeholder="e.g. essentials, organic, urgent"
              value={expTags}
              onChange={e => setExpTags(e.target.value)}
            />
          </div>

          <Input
            label="Notes / Description (Optional)"
            placeholder="Add details, receipt reference, or extra info"
            value={expDescription}
            onChange={e => setExpDescription(e.target.value)}
          />

          {/* Bill / Receipt Attachment */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-cozy-lavender" />
                <span>Attach Bill or Receipt (PDF, Image, Word, Excel)</span>
              </span>
              <span className="text-[10px] text-cozy-muted font-normal">Optional</span>
            </label>

            {expReceiptFile ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/40">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-purple-200/60 dark:bg-purple-900/60 flex items-center justify-center shrink-0 text-purple-700 dark:text-purple-300">
                    {expReceiptName.toLowerCase().endsWith('.pdf') || expReceiptFile.startsWith('data:application/pdf') ? (
                      <FileText className="w-4 h-4" />
                    ) : expReceiptName.toLowerCase().endsWith('.xls') || expReceiptName.toLowerCase().endsWith('.xlsx') ? (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate">
                      {expReceiptName || 'Attached Receipt'}
                    </p>
                    <p className="text-[10px] text-cozy-muted">
                      Ready to attach to this expense
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDocument({
                        url: expReceiptFile,
                        title: expReceiptName || 'Attached Receipt',
                        fileName: expReceiptName
                      });
                    }}
                    className="p-1.5 rounded-lg text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
                    title="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpReceiptFile('');
                      setExpReceiptName('');
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove Attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => expenseFileInputRef.current?.click()}
                className="p-3.5 border-2 border-dashed border-purple-200 dark:border-purple-900/40 hover:border-purple-400 dark:hover:border-purple-600 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 transition-all text-center space-y-1 group"
              >
                <input
                  ref={expenseFileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      handleExpenseFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  Click to upload bill or receipt document
                </p>
                <p className="text-[10px] text-cozy-muted">
                  Supports PDF, JPG, PNG, Word (.docx), Excel (.xlsx) up to 10MB
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddExpenseModalOpen(false);
                resetExpenseForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saveExpenseMutation.isPending}
            >
              {editingExpense ? 'Save Changes' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: ADD / EDIT SALARY & INCOME ================= */}
      <Modal
        isOpen={isAddIncomeModalOpen}
        onClose={() => {
          setIsAddIncomeModalOpen(false);
          resetIncomeForm();
        }}
        title={editingIncome ? 'Edit Income Record' : 'Add Salary / Cash Inflow'}
        description="Record your monthly salary, employer details, and cash received."
        maxWidth="lg"
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            saveIncomeMutation.mutate();
          }}
          className="space-y-4 pt-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Income Title"
              placeholder="e.g. October Salary, Freelance Design"
              value={incTitle}
              onChange={e => setIncTitle(e.target.value)}
              required
            />
            <Input
              label={`Amount (${currency})`}
              type="number"
              step="0.01"
              placeholder="e.g. 75000"
              value={incAmount}
              onChange={e => setIncAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Where did money come from? (Source / Employer)"
              placeholder="e.g. Google India, Infosys, Upwork Client"
              value={incSource}
              onChange={e => setIncSource(e.target.value)}
              required
              hint="Answers: from where money came"
            />

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Inflow Category
              </label>
              <select
                value={incCategory}
                onChange={e => setIncCategory(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                {INCOME_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Deposit / Payment Method
              </label>
              <select
                value={incPaymentMethod}
                onChange={e => setIncPaymentMethod(e.target.value)}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                {INCOME_PAYMENT_METHODS.map(pm => (
                  <option key={pm.id} value={pm.id}>
                    {pm.icon} {pm.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Received Date"
              type="date"
              value={incDate}
              onChange={e => setIncDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Notes / Description (Optional)"
            placeholder="Add details, bonus breakdown, or reference notes"
            value={incDescription}
            onChange={e => setIncDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddIncomeModalOpen(false);
                resetIncomeForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              isLoading={saveIncomeMutation.isPending}
            >
              {editingIncome ? 'Save Changes' : 'Record Salary / Inflow'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL: VIEW EXPENSE DETAILS ================= */}
      <Modal
        isOpen={!!viewingExpense}
        onClose={() => setViewingExpense(null)}
        title="Expense Details"
        maxWidth="md"
      >
        {viewingExpense && (
          <div className="space-y-4 pt-1 text-xs">
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                  {viewingExpense.title}
                </h4>
                <p className="text-[11px] text-cozy-muted">
                  {new Date(viewingExpense.expenseDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                - {formatCurrencyAmount(viewingExpense.amountMinor, viewingExpense.currency)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1.5 border-b border-purple-50 dark:border-purple-900/20">
                <span className="text-cozy-muted">Category</span>
                <span className="font-semibold">
                  {viewingExpense.category?.name || (typeof viewingExpense.categoryId === 'object' ? (viewingExpense.categoryId as any)?.name : null) || 'General'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-purple-50 dark:border-purple-900/20">
                <span className="text-cozy-muted">Paid By</span>
                <span className="font-semibold">
                  {viewingExpense.paidByUser?.nickname || viewingExpense.paidByUser?.fullName || (typeof viewingExpense.paidByUserId === 'object' ? ((viewingExpense.paidByUserId as any)?.nickname || (viewingExpense.paidByUserId as any)?.fullName) : null) || 'Family Member'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-purple-50 dark:border-purple-900/20">
                <span className="text-cozy-muted">Where it was done (Store/Merchant)</span>
                <span className="font-semibold">{viewingExpense.merchant || 'Direct'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-purple-50 dark:border-purple-900/20">
                <span className="text-cozy-muted">Payment Method</span>
                <span className="font-semibold">{viewingExpense.paymentMethod}</span>
              </div>
            </div>

            {viewingExpense.receiptUrl && (
              <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-cozy-text dark:text-cozy-darkText">Attached Receipt / Bill</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={viewingExpense.receiptUrl}
                      download={`${viewingExpense.title.replace(/\s+/g, '_')}_receipt`}
                      className="text-[11px] font-bold text-cozy-lavender hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewDocument({
                          url: viewingExpense.receiptUrl!,
                          title: `${viewingExpense.title} - Receipt / Bill`,
                          fileName: `${viewingExpense.title.replace(/\s+/g, '_')}_receipt`
                        });
                      }}
                      className="text-[11px] font-bold text-purple-600 dark:text-purple-300 hover:underline flex items-center gap-1 ml-2"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
                {viewingExpense.receiptUrl.startsWith('data:image') && (
                  <div className="rounded-xl overflow-hidden border border-purple-100 dark:border-purple-900/30 max-h-48 flex items-center justify-center bg-black/5">
                    <img src={viewingExpense.receiptUrl} alt="Receipt preview" className="max-h-48 object-contain" />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={() => setViewingExpense(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Expense Modal */}
      <Modal
        isOpen={!!deletingExpenseId}
        onClose={() => setDeletingExpenseId(null)}
        title="Delete Expense"
        description="Are you sure you want to remove this expense record?"
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setDeletingExpenseId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deletingExpenseId && deleteExpenseMutation.mutate(deletingExpenseId)}
            isLoading={deleteExpenseMutation.isPending}
          >
            Confirm Delete
          </Button>
        </div>
      </Modal>

      {/* Delete Income Modal */}
      <Modal
        isOpen={!!deletingIncomeId}
        onClose={() => setDeletingIncomeId(null)}
        title="Delete Income Record"
        description="Are you sure you want to remove this salary/income record?"
        maxWidth="sm"
      >
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" size="sm" onClick={() => setDeletingIncomeId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => deletingIncomeId && deleteIncomeMutation.mutate(deletingIncomeId)}
            isLoading={deleteIncomeMutation.isPending}
          >
            Confirm Delete
          </Button>
        </div>
      </Modal>

      {/* ================= MODAL: DOCUMENT PREVIEW (BILLS & RECEIPTS) ================= */}
      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-purple-100 dark:border-purple-900/40 shadow-soft-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-purple-50 dark:border-purple-900/20 shrink-0">
              <div className="min-w-0 pr-3">
                <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText truncate flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cozy-lavender shrink-0" />
                  <span className="truncate">{previewDocument.title}</span>
                </h3>
                <p className="text-xs text-cozy-muted">
                  Attached Receipt / Bill Document
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewDocument.url}
                  download={previewDocument.fileName || 'receipt-document'}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-cozy-muted hover:text-cozy-text transition-colors flex items-center gap-1.5 text-xs font-bold"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="p-2 rounded-xl text-cozy-muted hover:text-cozy-text text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[300px]">
              {previewDocument.url.startsWith('data:image') || previewDocument.url.match(/\.(jpeg|jpg|png|webp|gif)$/i) ? (
                <img
                  src={previewDocument.url}
                  alt={previewDocument.title}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-soft-sm"
                />
              ) : previewDocument.url.startsWith('data:application/pdf') || previewDocument.url.endsWith('.pdf') ? (
                <iframe
                  src={previewDocument.url}
                  title={previewDocument.title}
                  className="w-full h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 mx-auto flex items-center justify-center text-3xl">
                    📄
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">
                      Document Attached
                    </h4>
                    <p className="text-xs text-cozy-muted mt-1">
                      {previewDocument.fileName || 'Expense document file'}
                    </p>
                  </div>
                  <a
                    href={previewDocument.url}
                    download={previewDocument.fileName || 'expense-document'}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-soft-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download & Open File</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
