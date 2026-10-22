import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicationSummary, HouseholdItemSummary, HouseholdItemCategory } from 'cozynest-shared';
import { healthService } from '../../services/healthService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

// Elegant MUI Icons (No Emojis)
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import KitchenOutlinedIcon from '@mui/icons-material/KitchenOutlined';
import CleaningServicesOutlinedIcon from '@mui/icons-material/CleaningServicesOutlined';
import BathtubOutlinedIcon from '@mui/icons-material/BathtubOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';

interface StockInventoryTabProps {
  familyId: string;
  medications: MedicationSummary[];
  onRefillMedication: (medId: string, addedPills?: number) => Promise<void>;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Stock', IconComponent: Inventory2OutlinedIcon },
  { id: 'medicines', label: 'Medicines', IconComponent: MedicationOutlinedIcon },
  { id: 'pantry', label: 'Pantry & Food', IconComponent: KitchenOutlinedIcon },
  { id: 'cleaning', label: 'Cleaning & Wash', IconComponent: CleaningServicesOutlinedIcon },
  { id: 'toiletries', label: 'Toiletries', IconComponent: BathtubOutlinedIcon },
  { id: 'medical', label: 'First Aid & Health', IconComponent: MedicalServicesOutlinedIcon },
  { id: 'other', label: 'Other Supplies', IconComponent: CategoryOutlinedIcon }
];

export const StockInventoryTab: React.FC<StockInventoryTabProps> = ({
  familyId,
  medications,
  onRefillMedication
}) => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State for new household item - STRICTLY NO DEFAULT VALUES
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<HouseholdItemCategory>('pantry');
  const [newItemQuantity, setNewItemQuantity] = useState<string>('');
  const [newItemUnit, setNewItemUnit] = useState('units');
  const [newItemThreshold, setNewItemThreshold] = useState<string>('');
  const [newItemLocation, setNewItemLocation] = useState('');
  const [newItemExpiry, setNewItemExpiry] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Household items
  const { data: householdItems = [], isLoading } = useQuery<HouseholdItemSummary[]>({
    queryKey: ['household-stock', familyId],
    queryFn: () => healthService.getHouseholdStock(familyId),
    enabled: !!familyId
  });

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: healthService.createHouseholdItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-stock', familyId] });
      queryClient.invalidateQueries({ queryKey: ['householdStock'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Item added to household stock');
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add item')
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      healthService.adjustHouseholdItemStock(id, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-stock', familyId] });
      queryClient.invalidateQueries({ queryKey: ['householdStock'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to adjust stock')
  });

  const deleteItemMutation = useMutation({
    mutationFn: healthService.deleteHouseholdItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household-stock', familyId] });
      queryClient.invalidateQueries({ queryKey: ['householdStock'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Item removed from inventory');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete item')
  });

  const resetForm = () => {
    setNewItemName('');
    setNewItemCategory('pantry');
    setNewItemQuantity('');
    setNewItemUnit('units');
    setNewItemThreshold('');
    setNewItemLocation('');
    setNewItemExpiry('');
    setNewItemNotes('');
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error('Item name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createItemMutation.mutateAsync({
        familyId,
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: newItemQuantity !== '' ? parseFloat(newItemQuantity) : 0,
        unit: newItemUnit.trim() || 'units',
        minThreshold: newItemThreshold !== '' ? parseFloat(newItemThreshold) : 0,
        location: newItemLocation.trim(),
        expiryDate: newItemExpiry || undefined,
        notes: newItemNotes.trim() || undefined
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Identify low stock items
  const lowStockMeds = medications.filter(m => (m.pillsRemaining ?? m.totalPills) <= (m.lowStockThreshold || 5));
  const lowStockHousehold = householdItems.filter(h => h.quantity <= h.minThreshold);
  const totalLowStockCount = lowStockMeds.length + lowStockHousehold.length;

  // Copy shopping list to clipboard (no emojis)
  const handleCopyShoppingList = () => {
    const listLines: string[] = ['CozyNest Restock & Shopping List:'];

    if (lowStockMeds.length > 0) {
      listLines.push('\nMedications to Refill:');
      lowStockMeds.forEach(m => {
        listLines.push(`- ${m.name} (${m.dosage}) : Only ${m.pillsRemaining ?? m.totalPills} pills left`);
      });
    }

    if (lowStockHousehold.length > 0) {
      listLines.push('\nHousehold & Pantry Supplies to Buy:');
      lowStockHousehold.forEach(h => {
        listLines.push(`- ${h.name} : Current ${h.quantity} ${h.unit} (Min threshold: ${h.minThreshold})`);
      });
    }

    if (listLines.length === 1) {
      listLines.push('All stock is healthy. No urgent supplies needed.');
    }

    navigator.clipboard.writeText(listLines.join('\n'));
    toast.success('Shopping list copied to clipboard. Ready to paste.');
  };

  // Filter household items based on category and search query
  const filteredHousehold = householdItems.filter(item => {
    const matchesCategory =
      selectedCategory === 'all' ||
      selectedCategory === 'household' ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const filteredMeds = medications.filter(med => {
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'medicines';
    const matchesSearch =
      !searchQuery ||
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (med.purpose && med.purpose.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner with Low Stock Alert Center */}
      <div className={`p-5 rounded-3xl border transition-all ${
        totalLowStockCount > 0
          ? 'bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 border-rose-300 dark:border-rose-900/40'
          : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-emerald-200/50 dark:border-emerald-900/30'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Inventory2OutlinedIcon className="text-indigo-600 dark:text-indigo-400" sx={{ fontSize: 22 }} />
              <h3 className="text-base font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
                Medicine & Household Stock Management
              </h3>
              {totalLowStockCount > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] animate-pulse">
                  {totalLowStockCount} ITEM{totalLowStockCount > 1 ? 'S' : ''} LOW STOCK
                </span>
              ) : (
                <Badge variant="mint" size="sm" className="font-bold">
                  ALL WELL-STOCKED
                </Badge>
              )}
            </div>
            <p className="text-xs text-cozy-muted mt-0.5">
              Automated stock level tracking, pill reserves, low-inventory notifications, and 1-click shopping lists.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyShoppingList}
              className="text-xs font-bold border-amber-300 dark:border-amber-900 bg-white dark:bg-cozy-darkCard text-amber-800 dark:text-amber-200 shadow-soft-sm flex items-center gap-1.5"
            >
              <ContentCopyOutlinedIcon sx={{ fontSize: 15 }} className="text-amber-600" />
              <span>Copy Restock List</span>
            </Button>

            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft-sm flex items-center gap-1.5"
            >
              <AddOutlinedIcon sx={{ fontSize: 16 }} />
              <span>Add Stock Item</span>
            </Button>
          </div>
        </div>

        {/* Low Stock Urgent Items Carousel / Ticker */}
        {totalLowStockCount > 0 && (
          <div className="mt-4 pt-3 border-t border-rose-200/50 dark:border-rose-900/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-300">
              <WarningAmberOutlinedIcon sx={{ fontSize: 16 }} className="animate-pulse" />
              <span>URGENT RESTOCK NEEDED:</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {lowStockMeds.map(m => (
                <div
                  key={m._id}
                  className="p-2 px-3 rounded-2xl bg-white dark:bg-cozy-darkCard border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 shrink-0 shadow-soft-sm"
                >
                  <MedicationOutlinedIcon sx={{ fontSize: 16 }} className="text-rose-500" />
                  <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">{m.name}</span>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                    {m.pillsRemaining ?? m.totalPills} pills left
                  </span>
                  <button
                    onClick={() => onRefillMedication(m._id, 30)}
                    className="ml-1 text-[10px] font-black bg-rose-50 hover:bg-rose-100 text-rose-700 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <AutorenewOutlinedIcon sx={{ fontSize: 12 }} />
                    <span>+30 Refill</span>
                  </button>
                </div>
              ))}

              {lowStockHousehold.map(h => (
                <div
                  key={h._id}
                  className="p-2 px-3 rounded-2xl bg-white dark:bg-cozy-darkCard border border-amber-200 dark:border-amber-900/50 flex items-center gap-2 shrink-0 shadow-soft-sm"
                >
                  <Inventory2OutlinedIcon sx={{ fontSize: 16 }} className="text-amber-500" />
                  <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">{h.name}</span>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                    {h.quantity} {h.unit} left
                  </span>
                  <button
                    onClick={() => adjustStockMutation.mutateAsync({ id: h._id, delta: 1 })}
                    className="ml-1 text-[10px] font-black bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <AddCircleOutlineIcon sx={{ fontSize: 12 }} />
                    <span>+1 Restock</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Search and Category Filter Bar */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <SearchOutlinedIcon
            sx={{ fontSize: 18 }}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cozy-muted"
          />
          <input
            type="text"
            placeholder="Search items, medicines, locations (e.g. Rice, Paracetamol, Pantry, Shelf)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none shadow-soft-sm"
          />
        </div>

        {/* Elegant MUI Category Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.IconComponent;
            const isSelected = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-soft-sm scale-[1.02]'
                    : 'bg-white dark:bg-cozy-darkCard text-cozy-muted hover:text-cozy-text border border-purple-100 dark:border-purple-900/30'
                }`}
              >
                <Icon sx={{ fontSize: 16 }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: Medicine Stock Cards (if category matches) */}
      {(selectedCategory === 'all' || selectedCategory === 'medicines') && filteredMeds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black text-cozy-muted uppercase tracking-wider flex items-center gap-1.5">
              <MedicationOutlinedIcon sx={{ fontSize: 16 }} className="text-rose-500" />
              <span>Prescription & Supplement Stock ({filteredMeds.length})</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredMeds.map(med => {
              const threshold = med.lowStockThreshold || 5;
              const remaining = med.pillsRemaining ?? med.totalPills ?? 0;
              const isLow = remaining <= threshold;
              const percent = Math.min(100, Math.round((remaining / Math.max(1, med.totalPills || 30)) * 100));

              return (
                <Card
                  key={med._id}
                  className={`p-4 border transition-all space-y-3 ${
                    isLow
                      ? 'border-rose-300 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20'
                      : 'border-purple-100 dark:border-purple-900/30 bg-white dark:bg-cozy-darkCard'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="text-xs font-black text-cozy-text dark:text-cozy-darkText">
                        {med.name}
                      </h5>
                      <span className="text-[10px] text-cozy-muted font-bold block mt-0.5">
                        {med.dosage} • {med.form} • {med.frequencyDescription}
                      </span>
                    </div>

                    {isLow ? (
                      <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-black animate-pulse flex items-center gap-1">
                        <WarningAmberOutlinedIcon sx={{ fontSize: 13 }} />
                        <span>LOW STOCK</span>
                      </span>
                    ) : (
                      <Badge variant="mint" size="sm">
                        HEALTHY
                      </Badge>
                    )}
                  </div>

                  {/* Stock Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-cozy-muted font-semibold">Pills Remaining</span>
                      <span className="font-black text-cozy-text dark:text-cozy-darkText">
                        {remaining} / {med.totalPills || 30}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow
                            ? 'bg-rose-500'
                            : percent < 40
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-purple-50 dark:border-purple-900/20">
                    <span className="text-[10px] text-cozy-muted">
                      Alert when ≤ {threshold} pills
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onRefillMedication(med._id, 30)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 px-2 py-1 h-auto flex items-center gap-1"
                    >
                      <AutorenewOutlinedIcon sx={{ fontSize: 13 }} />
                      <span>+30 Refill</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 2: Household & Pantry Inventory Items */}
      {selectedCategory !== 'medicines' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black text-cozy-muted uppercase tracking-wider flex items-center gap-1.5">
              <Inventory2OutlinedIcon sx={{ fontSize: 16 }} className="text-indigo-600 dark:text-indigo-400" />
              <span>Household & Pantry Essentials ({filteredHousehold.length})</span>
            </h4>
          </div>

          {filteredHousehold.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-cozy-darkCard border border-dashed border-purple-200 dark:border-purple-900/40">
              <Inventory2OutlinedIcon sx={{ fontSize: 32 }} className="text-indigo-400 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                No household items logged yet.
              </p>
              <p className="text-[11px] text-cozy-muted mt-1">
                Add groceries, cleaning items, and home supplies to track inventory and get low stock alerts.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  resetForm();
                  setIsAddModalOpen(true);
                }}
                className="mt-3 text-xs bg-indigo-600 text-white"
              >
                <AddOutlinedIcon sx={{ fontSize: 15, mr: 0.5 }} />
                <span>Add Household Item</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredHousehold.map(item => {
                const isLow = item.quantity <= item.minThreshold;

                return (
                  <Card
                    key={item._id}
                    className={`p-4 border transition-all flex flex-col justify-between gap-3 ${
                      isLow
                        ? 'border-amber-300 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20'
                        : 'border-purple-100 dark:border-purple-900/30 bg-white dark:bg-cozy-darkCard'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                            {item.category}
                          </span>
                          <h5 className="text-xs font-black text-cozy-text dark:text-cozy-darkText mt-0.5">
                            {item.name}
                          </h5>
                        </div>

                        {isLow ? (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[10px] font-black animate-pulse flex items-center gap-1">
                            <WarningAmberOutlinedIcon sx={{ fontSize: 13 }} />
                            <span>REFILL NEEDED</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-cozy-muted text-[10px] font-bold">
                            OK
                          </span>
                        )}
                      </div>

                      {item.location && (
                        <div className="flex items-center gap-1 text-[11px] text-cozy-muted mt-1.5">
                          <PlaceOutlinedIcon sx={{ fontSize: 14 }} className="text-cozy-muted shrink-0" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Stock Counter with Instant +/- Controls */}
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-50 dark:border-purple-900/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustStockMutation.mutateAsync({ id: item._id, delta: -1 })}
                          disabled={item.quantity <= 0}
                          className="w-7 h-7 rounded-xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/30 text-cozy-text font-bold flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 transition-colors"
                          title="Decrease quantity by 1"
                        >
                          <RemoveCircleOutlineIcon sx={{ fontSize: 16 }} />
                        </button>
                        <div className="text-center min-w-[50px]">
                          <span className="text-sm font-black text-cozy-text dark:text-cozy-darkText">
                            {item.quantity}
                          </span>
                          <span className="text-[10px] text-cozy-muted ml-1 font-semibold">
                            {item.unit}
                          </span>
                        </div>
                        <button
                          onClick={() => adjustStockMutation.mutateAsync({ id: item._id, delta: 1 })}
                          className="w-7 h-7 rounded-xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/30 text-cozy-text font-bold flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                          title="Increase quantity by 1"
                        >
                          <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
                        </button>
                      </div>

                      <button
                        onClick={() => deleteItemMutation.mutateAsync(item._id)}
                        className="p-1.5 text-cozy-muted hover:text-rose-500 rounded-lg transition-colors"
                        title="Delete item"
                      >
                        <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-cozy-muted pt-1 border-t border-purple-50 dark:border-purple-900/20">
                      <span>Min alert threshold: {item.minThreshold} {item.unit}</span>
                      {item.expiryDate && (
                        <span className="font-semibold text-amber-700 dark:text-amber-300">
                          Exp: {item.expiryDate}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add New Stock Item Modal (Clean, No Prepopulated Values) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-cozy-darkCard p-4 sm:p-6 border border-purple-100 dark:border-purple-900/40 shadow-soft-xl space-y-4 max-h-[calc(100dvh-1.5rem)] overflow-y-auto my-auto flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-purple-50 dark:border-purple-900/20">
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
                <Inventory2OutlinedIcon sx={{ fontSize: 19 }} className="text-indigo-600" />
                <span>Add Household Stock Item</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-cozy-muted hover:text-cozy-text text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Basmati Rice, Olive Oil, Toilet Paper, Dish Soap"
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={e => setNewItemCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                  >
                    <option value="pantry">Pantry & Food</option>
                    <option value="cleaning">Cleaning & Laundry</option>
                    <option value="toiletries">Toiletries & Personal</option>
                    <option value="medical">Medical & First Aid</option>
                    <option value="other">Other Supplies</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Storage Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Kitchen Cabinet, Master Bathroom"
                    value={newItemLocation}
                    onChange={e => setNewItemLocation(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 2"
                    value={newItemQuantity}
                    onChange={e => setNewItemQuantity(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Unit</label>
                  <select
                    value={newItemUnit}
                    onChange={e => setNewItemUnit(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  >
                    <option value="units">units</option>
                    <option value="kg">kg</option>
                    <option value="litres">litres</option>
                    <option value="packs">packs</option>
                    <option value="bottles">bottles</option>
                    <option value="rolls">rolls</option>
                    <option value="boxes">boxes</option>
                    <option value="pieces">pieces</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Alert Below</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 1"
                    value={newItemThreshold}
                    onChange={e => setNewItemThreshold(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={newItemExpiry}
                    onChange={e => setNewItemExpiry(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Preferred brand"
                    value={newItemNotes}
                    onChange={e => setNewItemNotes(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  {isSubmitting ? 'Saving...' : 'Add Stock Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
