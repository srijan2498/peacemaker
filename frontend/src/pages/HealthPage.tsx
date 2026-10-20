import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { healthService } from '../services/healthService';
import { api } from '../services/api';
import { toast } from 'sonner';
import {
  HeartPulse,
  Receipt,
  Users,
  UtensilsCrossed,
  Boxes
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

// Child components
import { SleepTrackerCard } from '../components/health/SleepTrackerCard';
import { PeriodTrackerCard } from '../components/health/PeriodTrackerCard';
import { FeverTrackerCard } from '../components/health/FeverTrackerCard';
import { MedicineTrackerCard } from '../components/health/MedicineTrackerCard';
import { VitalsQuickCards } from '../components/health/VitalsQuickCards';
import { BillVaultTab } from '../components/health/BillVaultTab';
import { RecipeKitchenTab } from '../components/health/RecipeKitchenTab';
import { StockInventoryTab } from '../components/health/StockInventoryTab';

export const HealthPage: React.FC = () => {
  const { activeFamily, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'trackers' | 'recipes' | 'stock' | 'bills'>('trackers');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');

  // Fetch Family Members for Member Filter
  const { data: membersData } = useQuery({
    queryKey: ['members', activeFamily?._id],
    queryFn: async () => {
      const res = await api.get(`/families/${activeFamily?._id}/members`);
      return res.data.data;
    },
    enabled: !!activeFamily?._id
  });

  const members = membersData?.members || [];

  // Fetch Health Summary (Latest vitals)
  const { data: summaryData, refetch: refetchSummary } = useQuery({
    queryKey: ['healthSummary', activeFamily?._id, selectedMemberId],
    queryFn: () =>
      healthService.getHealthSummary({
        familyId: activeFamily?._id || '',
        memberId: selectedMemberId || undefined
      }),
    enabled: !!activeFamily?._id
  });

  // Fetch Medications
  const { data: medicationsData = [], refetch: refetchMedications } = useQuery({
    queryKey: ['medications', activeFamily?._id, selectedMemberId],
    queryFn: () =>
      healthService.getMedications({
        familyId: activeFamily?._id || '',
        memberId: selectedMemberId || undefined
      }),
    enabled: !!activeFamily?._id
  });

  // Fetch Bills Vault
  const { data: billsData = [], refetch: refetchBills } = useQuery({
    queryKey: ['bills', activeFamily?._id],
    queryFn: () =>
      healthService.getBills({
        familyId: activeFamily?._id || ''
      }),
    enabled: !!activeFamily?._id
  });

  // Fetch Household Stock
  const { data: householdStockData = [], refetch: refetchHouseholdStock } = useQuery({
    queryKey: ['householdStock', activeFamily?._id],
    queryFn: () => healthService.getHouseholdStock(activeFamily?._id || ''),
    enabled: !!activeFamily?._id
  });

  // Calculate low stock items across medicines & household essentials
  const lowStockMedsCount = (medicationsData as any[]).filter(
    m => (m.pillsInStock ?? 0) <= (m.lowStockThreshold ?? 5)
  ).length;
  const lowStockHouseholdCount = (householdStockData as any[]).filter(
    h => (h.quantity ?? 0) <= (h.minThreshold ?? 2)
  ).length;
  const totalLowStock = lowStockMedsCount + lowStockHouseholdCount;

  // Mutations
  const saveHealthRecordMutation = useMutation({
    mutationFn: healthService.saveHealthRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthSummary'] });
      toast.success('Health vital recorded successfully.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save vital')
  });

  const toggleMedicationMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { date: string; timeSlot: string } }) =>
      healthService.toggleMedicationTaken(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast.success('Medication adherence updated.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update dose')
  });

  const addMedicationMutation = useMutation({
    mutationFn: (payload: any) =>
      healthService.createMedication({
        ...payload,
        familyId: activeFamily?._id || '',
        userId: selectedMemberId || user?._id
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast.success('Medication added to schedule.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add medication')
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: (medId: string) => healthService.deleteMedication(medId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast.success('Medication removed');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete medication')
  });

  const refillMedicationMutation = useMutation({
    mutationFn: ({ id, pillsToAdd }: { id: string; pillsToAdd: number }) =>
      healthService.refillMedication(id, pillsToAdd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['householdStock'] });
      toast.success('Pill inventory refilled.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to refill medication')
  });

  const uploadBillMutation = useMutation({
    mutationFn: (payload: any) =>
      healthService.uploadBill({
        ...payload,
        familyId: activeFamily?._id || ''
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Bill stored in document vault.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to upload bill')
  });

  const linkBillMutation = useMutation({
    mutationFn: (billId: string) => healthService.linkBillToExpense(billId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Bill recorded into family expenses ledger.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to link bill to expense')
  });

  const deleteBillMutation = useMutation({
    mutationFn: (billId: string) => healthService.deleteBill(billId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      toast.success('Bill deleted from vault');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete bill')
  });

  // Handler helpers
  const handleSaveVitals = async (type: string, data: any, notes?: string) => {
    const today = new Date().toISOString().split('T')[0];
    await saveHealthRecordMutation.mutateAsync({
      familyId: activeFamily?._id || '',
      userId: selectedMemberId || user?._id,
      type,
      date: today,
      data,
      notes
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
              Health, Wellness & Bill Vault
            </h1>
            <Badge variant="mint" size="sm" className="font-bold">
              FAMILY CARE
            </Badge>
          </div>
          <p className="text-xs text-cozy-muted mt-1">
            Track daily vitals, sleep, cycle, fever, and medicines • Smart recipe kitchen • Upload pharmacy and grocery bills
          </p>
        </div>

        {/* Member Filter Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 px-3 rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/30 text-xs shadow-soft-sm">
            <Users className="w-3.5 h-3.5 text-cozy-lavender" />
            <select
              value={selectedMemberId}
              onChange={e => setSelectedMemberId(e.target.value)}
              className="bg-transparent font-bold text-cozy-text dark:text-cozy-darkText outline-none"
            >
              <option value="">Tracking For: Myself ({user?.fullName || 'Me'})</option>
              {members.map((m: any) => (
                <option key={m.userId} value={m.userId}>
                  {m.nickname || m.fullName} ({m.role || 'Member'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-purple-100/50 dark:border-purple-900/20 max-w-3xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('trackers')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'trackers'
              ? 'bg-white dark:bg-cozy-darkCard text-emerald-700 dark:text-emerald-300 shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <HeartPulse className="w-4 h-4 text-emerald-500" />
          <span>Vitals & Health</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 relative ${
            activeTab === 'stock'
              ? 'bg-white dark:bg-cozy-darkCard text-amber-700 dark:text-amber-300 shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <Boxes className="w-4 h-4 text-amber-500" />
          <span>Stock & Supplies</span>
          {totalLowStock > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse shadow-sm">
              {totalLowStock} Low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'recipes'
              ? 'bg-white dark:bg-cozy-darkCard text-orange-700 dark:text-orange-300 shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4 text-orange-500" />
          <span>Smart Recipe Kitchen</span>
        </button>

        <button
          onClick={() => setActiveTab('bills')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            activeTab === 'bills'
              ? 'bg-white dark:bg-cozy-darkCard text-sky-700 dark:text-sky-300 shadow-soft-sm'
              : 'text-cozy-muted hover:text-cozy-text'
          }`}
        >
          <Receipt className="w-4 h-4 text-sky-500" />
          <span>Bills & Receipts</span>
        </button>
      </div>

      {/* ================= TAB 1: VITALS & HEALTH TRACKERS ================= */}
      {activeTab === 'trackers' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics (Steps, Water, BP, Weight) */}
          <VitalsQuickCards
            todaySteps={summaryData?.todaySteps}
            todayWater={summaryData?.todayWater}
            latestBp={summaryData?.latestBp}
            latestWeight={summaryData?.latestWeight}
            onSaveVitals={handleSaveVitals}
          />

          {/* Deep Trackers Grid (Sleep, Period, Fever, Medicine) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sleep & Rest Recovery */}
            <SleepTrackerCard
              latestRecord={summaryData?.latestSleep}
              onSaveSleep={(data, notes) => handleSaveVitals('sleep', data, notes)}
            />

            {/* Menstrual & Period Tracker */}
            <PeriodTrackerCard
              latestRecord={summaryData?.latestPeriod}
              onSavePeriod={(data, notes) => handleSaveVitals('period', data, notes)}
            />

            {/* Fever & Temperature Log */}
            <FeverTrackerCard
              latestRecord={summaryData?.latestFever}
              onSaveFever={(data, notes) => handleSaveVitals('fever', data, notes)}
            />

            {/* Medication & Pill Reminder */}
            <MedicineTrackerCard
              medications={medicationsData}
              onToggleTaken={(medId, date, slot) =>
                toggleMedicationMutation.mutateAsync({ id: medId, payload: { date, timeSlot: slot } })
              }
              onAddMedication={payload => addMedicationMutation.mutateAsync(payload)}
              onDeleteMedication={medId => deleteMedicationMutation.mutateAsync(medId)}
              onRefillMedication={async (medId, addedPills) => {
                await refillMedicationMutation.mutateAsync({ id: medId, pillsToAdd: addedPills || 30 });
              }}
            />
          </div>
        </div>
      )}

      {/* ================= TAB 2: MEDICINE & HOUSEHOLD STOCK MANAGEMENT ================= */}
      {activeTab === 'stock' && (
        <div className="animate-fade-in">
          <StockInventoryTab
            familyId={activeFamily?._id || ''}
            medications={medicationsData}
            onRefillMedication={async (medId, addedPills) => {
              await refillMedicationMutation.mutateAsync({ id: medId, pillsToAdd: addedPills || 30 });
            }}
          />
        </div>
      )}

      {/* ================= TAB 3: SMART RECIPE KITCHEN ================= */}
      {activeTab === 'recipes' && (
        <div className="animate-fade-in">
          <RecipeKitchenTab />
        </div>
      )}

      {/* ================= TAB 4: MEDICINE & GROCERY BILL VAULT ================= */}
      {activeTab === 'bills' && (
        <div className="animate-fade-in">
          <BillVaultTab
            bills={billsData}
            currency={activeFamily?.currency || 'INR'}
            onUploadBill={payload => uploadBillMutation.mutateAsync(payload)}
            onLinkExpense={billId => linkBillMutation.mutateAsync(billId)}
            onDeleteBill={billId => deleteBillMutation.mutateAsync(billId)}
          />
        </div>
      )}
    </div>
  );
};

export default HealthPage;
