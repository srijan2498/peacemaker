import React, { useState, useRef } from 'react';
import { BillDocumentSummary, BILL_CATEGORIES, formatCurrencyAmount } from 'cozynest-shared';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import BiotechOutlinedIcon from '@mui/icons-material/BiotechOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCheck,
  Search,
  Plus,
  Eye,
  Trash2,
  ExternalLink,
  Receipt,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface BillVaultTabProps {
  bills: BillDocumentSummary[];
  currency?: string;
  onUploadBill: (payload: any) => Promise<void>;
  onLinkExpense: (billId: string) => Promise<void>;
  onDeleteBill: (billId: string) => Promise<void>;
}

export const BillVaultTab: React.FC<BillVaultTabProps> = ({
  bills,
  currency = 'INR',
  onUploadBill,
  onLinkExpense,
  onDeleteBill
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedBillForPreview, setSelectedBillForPreview] = useState<BillDocumentSummary | null>(null);

  // Upload Form State - no default prepopulated values
  const [storeName, setStoreName] = useState('');
  const [billCategory, setBillCategory] = useState<'medicine' | 'grocery' | 'diagnostic' | 'other' | ''>('');
  const [billDate, setBillDate] = useState('');
  const [amountMajor, setAmountMajor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [autoCreateExpense, setAutoCreateExpense] = useState(false);

  // File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileFormat, setFileFormat] = useState<'pdf' | 'image' | 'word' | 'excel'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const processFile = (file: File) => {
    setSelectedFile(file);

    // Detect format
    const nameLower = file.name.toLowerCase();
    let fmt: 'pdf' | 'image' | 'word' | 'excel' = 'image';

    if (nameLower.endsWith('.pdf')) {
      fmt = 'pdf';
    } else if (nameLower.endsWith('.doc') || nameLower.endsWith('.docx')) {
      fmt = 'word';
    } else if (nameLower.endsWith('.xls') || nameLower.endsWith('.xlsx') || nameLower.endsWith('.csv')) {
      fmt = 'excel';
    } else {
      fmt = 'image';
    }
    setFileFormat(fmt);

    // Read Base64 Data URL for in-browser preview and persistence
    const reader = new FileReader();
    reader.onload = e => {
      setFileBase64(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !storeName) return;

    setIsUploading(true);
    try {
      const amountMinor = amountMajor ? Math.round(parseFloat(amountMajor) * 100) : 0;
      const categoryToSave = billCategory || 'medicine';
      const dateToSave = billDate || new Date().toISOString().split('T')[0];
      const paymentToSave = paymentMethod || 'UPI';

      await onUploadBill({
        storeName,
        billCategory: categoryToSave,
        billDate: dateToSave,
        amountMinor,
        currency,
        invoiceNumber,
        paymentMethod: paymentToSave,
        fileName: selectedFile.name,
        fileFormat,
        mimeType: selectedFile.type || 'application/octet-stream',
        fileUrl: fileBase64,
        fileSizeBytes: selectedFile.size,
        notes,
        autoCreateExpense
      });

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setFileBase64('');
      setStoreName('');
      setBillCategory('');
      setBillDate('');
      setAmountMajor('');
      setInvoiceNumber('');
      setPaymentMethod('');
      setNotes('');
      setAutoCreateExpense(false);
    } finally {
      setIsUploading(false);
    }
  };

  // Filter bills
  const filteredBills = bills.filter(b => {
    const matchesCat = activeCategory === 'all' || b.billCategory === activeCategory;
    const matchesSearch =
      !searchQuery ||
      b.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      b.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Upload Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-amber-500/10 border border-purple-100 dark:border-purple-900/30">
        <div>
          <h3 className="text-base font-black text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
            <ReceiptLongOutlinedIcon className="w-5 h-5 text-emerald-600" />
            <span>Medicine & Grocery Bill Vault</span>
          </h3>
          <p className="text-xs text-cozy-muted mt-0.5">
            Store and organize bills in PDF, Image, Word, or Excel format with one-click expense tracking.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-2xl flex items-center gap-1.5 shadow-soft-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Bill</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-purple-600 text-white shadow-soft-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-cozy-muted hover:text-cozy-text'
              }`}
            >
              All Bills ({bills.length})
            </button>
            {BILL_CATEGORIES.map(cat => {
              const count = bills.filter(b => b.billCategory === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    activeCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-soft-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-cozy-muted hover:text-cozy-text'
                  }`}
                >
                  {cat.id === 'medicine' && <MedicationOutlinedIcon className="w-3.5 h-3.5" />}
                  {cat.id === 'grocery' && <ShoppingCartOutlinedIcon className="w-3.5 h-3.5" />}
                  {cat.id === 'diagnostic' && <BiotechOutlinedIcon className="w-3.5 h-3.5" />}
                  {cat.id === 'other' && <DescriptionOutlinedIcon className="w-3.5 h-3.5" />}
                  <span>{cat.label.split(' ')[0]} ({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-cozy-muted" />
            <input
              type="text"
              placeholder="Search pharmacy, store, invoice..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
            />
          </div>
        </div>
      </Card>

      {/* Bills Grid / Gallery */}
      {filteredBills.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            <DescriptionOutlinedIcon className="w-8 h-8 text-purple-500" />
          </div>
          <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">No bills found in this vault</h4>
          <p className="text-xs text-cozy-muted max-w-sm mx-auto">
            Upload pharmacy receipts, grocery superstore bills, or clinic invoices to keep them safe and synced.
          </p>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsUploadModalOpen(true)}
            className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            Upload Medicine or Grocery Bill
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map(bill => {
            const isMedicine = bill.billCategory === 'medicine';
            const isGrocery = bill.billCategory === 'grocery';

            return (
              <Card
                key={bill._id}
                className="p-4 border-purple-100 dark:border-purple-900/30 bg-white dark:bg-cozy-darkCard space-y-3 shadow-soft-sm hover:shadow-soft-md transition-shadow group"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                        isMedicine
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'
                          : isGrocery
                          ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600'
                          : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600'
                      }`}
                    >
                      {isMedicine ? (
                        <MedicationOutlinedIcon className="w-4 h-4 text-emerald-600" />
                      ) : isGrocery ? (
                        <ShoppingCartOutlinedIcon className="w-4 h-4 text-amber-600" />
                      ) : (
                        <BiotechOutlinedIcon className="w-4 h-4 text-purple-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate">
                        {bill.storeName}
                      </h4>
                      <p className="text-[10px] text-cozy-muted">
                        {bill.billDate} {bill.invoiceNumber ? `• Inv #${bill.invoiceNumber}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* File Format Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 ${
                      bill.fileFormat === 'pdf'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                        : bill.fileFormat === 'excel'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : bill.fileFormat === 'word'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    }`}
                  >
                    {bill.fileFormat}
                  </span>
                </div>

                {/* Amount and Linking Status */}
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-purple-50 dark:border-purple-900/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-cozy-muted block">Total Bill Amount</span>
                    <span className="text-sm font-black text-cozy-text dark:text-cozy-darkText">
                      {formatCurrencyAmount(bill.amountMinor, bill.currency || currency)}
                    </span>
                  </div>

                  {bill.expenseId ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-xl">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>In Cashflow</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onLinkExpense(bill._id)}
                      className="text-[10px] font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 px-2 py-1 rounded-xl transition-colors"
                      title="Sync this bill as an Expense in CozyNest"
                    >
                      + Add to Expense
                    </button>
                  )}
                </div>

                {/* File Name & Preview Action */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1 text-[11px] text-cozy-muted truncate max-w-[180px]">
                    {bill.fileFormat === 'pdf' ? (
                      <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : bill.fileFormat === 'excel' ? (
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                    )}
                    <span className="truncate">{bill.fileName}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedBillForPreview(bill)}
                      className="p-1.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/40 text-cozy-lavender transition-colors"
                      title="Preview Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteBill(bill._id)}
                      className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/40 text-cozy-muted hover:text-rose-500 transition-colors"
                      title="Delete Bill"
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

      {/* Upload Bill Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-purple-100 dark:border-purple-900/40 shadow-soft-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-purple-50 dark:border-purple-900/20">
              <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
                <ReceiptLongOutlinedIcon className="w-5 h-5 text-emerald-600" />
                <span>Upload Medicine or Grocery Bill</span>
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-cozy-muted hover:text-cozy-text text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer text-center transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20'
                    : selectedFile
                    ? 'border-purple-400 bg-purple-50/50 dark:bg-purple-950/30'
                    : 'border-slate-300 dark:border-slate-700 hover:border-purple-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*,.doc,.docx,.xls,.xlsx,.csv"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      processFile(e.target.files[0]);
                    }
                  }}
                />

                {selectedFile ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                    <FileCheck className="w-6 h-6 text-emerald-500" />
                    <div>
                      <p className="truncate max-w-xs">{selectedFile.name}</p>
                      <p className="text-[10px] text-cozy-muted font-normal">
                        {(selectedFile.size / 1024).toFixed(0)} KB • Format: {fileFormat.toUpperCase()} (Click to change)
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 text-cozy-lavender animate-bounce" />
                    <div>
                      <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                        Click or drag bill document here
                      </p>
                      <p className="text-[10px] text-cozy-muted mt-0.5">
                        Supported: PDF, Images (PNG/JPG), Word (.doc/.docx), Excel (.xlsx/.csv)
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Form Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Bill Category</label>
                  <select
                    value={billCategory}
                    onChange={e => setBillCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  >
                    <option value="">Select Category...</option>
                    <option value="medicine">Medicine & Pharmacy</option>
                    <option value="grocery">Groceries & Supermarket</option>
                    <option value="diagnostic">Lab & Diagnostic Report</option>
                    <option value="other">Other Receipt</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Store / Pharmacy Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo Pharmacy, Blinkit, D-Mart"
                    value={storeName}
                    onChange={e => setStoreName(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Total Amount ({currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amountMajor}
                    onChange={e => setAmountMajor(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Bill Date</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={e => setBillDate(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Invoice / Bill Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-8941"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-cozy-text dark:text-cozy-darkText">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-purple-100 dark:border-purple-900/30 text-xs text-cozy-text dark:text-cozy-darkText outline-none"
                  >
                    <option value="">Select Payment Method...</option>
                    <option value="UPI">UPI / Instant Pay</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>

              {/* Auto Create Expense Checkbox */}
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreateExpense}
                  onChange={e => setAutoCreateExpense(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText block">
                    Automatically record in Family Expenses
                  </span>
                  <span className="text-[10px] text-cozy-muted">
                    Creates an expense entry in "Healthcare & Medical" or "Groceries & Household" linked to this bill.
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUploading || !selectedFile || !storeName}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isUploading ? 'Uploading & Processing...' : 'Save to Vault'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document In-Browser Preview Modal */}
      {selectedBillForPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-cozy-darkCard p-6 border border-purple-100 dark:border-purple-900/40 shadow-soft-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-purple-50 dark:border-purple-900/20 shrink-0">
              <div>
                <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText flex items-center gap-2">
                  {selectedBillForPreview.fileFormat === 'pdf' ? (
                    <PictureAsPdfOutlinedIcon className="w-5 h-5 text-rose-500" />
                  ) : selectedBillForPreview.fileFormat === 'excel' ? (
                    <TableChartOutlinedIcon className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <ImageOutlinedIcon className="w-5 h-5 text-purple-500" />
                  )}
                  <span>{selectedBillForPreview.storeName} — {selectedBillForPreview.fileName}</span>
                </h3>
                <p className="text-xs text-cozy-muted">
                  {selectedBillForPreview.billDate} • {formatCurrencyAmount(selectedBillForPreview.amountMinor, selectedBillForPreview.currency || currency)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedBillForPreview.fileUrl && (
                  <a
                    href={selectedBillForPreview.fileUrl}
                    download={selectedBillForPreview.fileName}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-cozy-muted hover:text-cozy-text transition-colors"
                    title="Download File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedBillForPreview(null)}
                  className="p-2 text-cozy-muted hover:text-cozy-text text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* In-Browser Preview Render Body */}
            <div className="flex-1 overflow-auto rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[300px]">
              {selectedBillForPreview.fileFormat === 'image' && selectedBillForPreview.fileUrl ? (
                <img
                  src={selectedBillForPreview.fileUrl}
                  alt={selectedBillForPreview.fileName}
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-soft-sm"
                />
              ) : selectedBillForPreview.fileFormat === 'pdf' && selectedBillForPreview.fileUrl ? (
                <iframe
                  src={selectedBillForPreview.fileUrl}
                  title="PDF Preview"
                  className="w-full h-[60vh] rounded-xl border border-slate-200 dark:border-slate-800"
                />
              ) : selectedBillForPreview.fileFormat === 'excel' ? (
                <div className="w-full space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Spreadsheet Bill Document ({selectedBillForPreview.fileName})</span>
                  </div>
                  {/* Sample parsed tabular view */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-cozy-muted font-bold">
                          <th className="p-2">Item Description</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100 dark:border-slate-800">
                          <td className="p-2 font-medium">{selectedBillForPreview.storeName} Order Items</td>
                          <td className="p-2 text-center">1</td>
                          <td className="p-2 text-right font-bold">{formatCurrencyAmount(selectedBillForPreview.amountMinor, currency)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2 p-8">
                  <FileText className="w-12 h-12 text-blue-500 mx-auto" />
                  <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">{selectedBillForPreview.fileName}</p>
                  <p className="text-[11px] text-cozy-muted">Word Document (.docx)</p>
                  {selectedBillForPreview.fileUrl && (
                    <a
                      href={selectedBillForPreview.fileUrl}
                      download={selectedBillForPreview.fileName}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-soft-sm mt-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download & Open in Word</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
