import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  Clipboard, 
  Sparkles, 
  Check, 
  X, 
  Trash2, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar, 
  Clock, 
  Tag, 
  CreditCard, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  FileCheck,
  RefreshCw,
  Printer,
  ChevronDown,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { 
  parseExcelFile, 
  parseCsvFile, 
  parsePastedText, 
  generateDemoImportData, 
  downloadSampleExcelTemplate, 
  downloadSampleCsvTemplate, 
  ParsedItem, 
  ParseResult 
} from '../utils/fileParser';
import { Transaction, TransactionType, PaymentMethod, CafeSettings } from '../types';
import { ALL_DEFAULT_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../data/categories';
import { formatCurrency, formatDateThai } from '../utils/formatters';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (items: Omit<Transaction, 'id' | 'createdAt'>[]) => Promise<void>;
  settings: CafeSettings;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  settings,
}) => {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCharts, setShowCharts] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clipboard paste listener when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      // Don't intercept if user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return;
      }

      const text = e.clipboardData?.getData('text');
      if (text && text.trim().length > 3) {
        e.preventDefault();
        setIsProcessing(true);
        try {
          const res = parsePastedText(text, 'ข้อความจากคลิปบอร์ด (Pasted Data)');
          setParseResult(res);
        } catch (err) {
          console.error('Failed to parse pasted data:', err);
        } finally {
          setIsProcessing(false);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Handle Drag Events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processUploadedFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processUploadedFile(files[0]);
    }
  };

  // Process File Dispatcher
  const processUploadedFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const fileName = file.name.toLowerCase();
      let res: ParseResult;

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        res = await parseExcelFile(file);
      } else if (fileName.endsWith('.csv')) {
        res = await parseCsvFile(file);
      } else {
        // Read as text
        const text = await file.text();
        res = parsePastedText(text, file.name);
      }

      setParseResult(res);
    } catch (err) {
      console.error('File parsing error:', err);
      alert('เกิดข้อผิดพลาดในการอ่านไฟล์ กรุณาตรวจสอบว่าเป็นไฟล์ Excel หรือ CSV ที่ถูกต้อง');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    try {
      const res = parsePastedText(pastedText, 'ข้อความที่วาง (Pasted Text)');
      setParseResult(res);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadDemo = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const res = generateDemoImportData();
      setParseResult(res);
      setIsProcessing(false);
    }, 250);
  };

  // Item modifications
  const handleToggleSelectAll = (checked: boolean) => {
    if (!parseResult) return;
    setParseResult({
      ...parseResult,
      items: parseResult.items.map(item => ({ ...item, selected: checked })),
    });
  };

  const handleToggleItem = (id: string) => {
    if (!parseResult) return;
    setParseResult({
      ...parseResult,
      items: parseResult.items.map(item => item.id === id ? { ...item, selected: !item.selected } : item),
    });
  };

  const handleUpdateItem = (id: string, updates: Partial<ParsedItem>) => {
    if (!parseResult) return;
    setParseResult({
      ...parseResult,
      items: parseResult.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // If type changed, ensure valid category
          if (updates.type && updates.type !== item.type) {
            updated.category = updates.type === 'income' ? 'กาแฟ & เครื่องดื่ม' : 'เมล็ดกาแฟ & นม/วัตถุดิบเครื่องดื่ม';
          }
          return updated;
        }
        return item;
      }),
    });
  };

  const handleDeleteItem = (id: string) => {
    if (!parseResult) return;
    setParseResult({
      ...parseResult,
      items: parseResult.items.filter(item => item.id !== id),
    });
  };

  const handleAddNewItem = () => {
    if (!parseResult) return;
    const newItem: ParsedItem = {
      id: 'custom_' + Date.now(),
      selected: true,
      type: 'income',
      amount: 100,
      category: 'กาแฟ & เครื่องดื่ม',
      date: new Date().toISOString().slice(0, 10),
      time: '12:00',
      paymentMethod: 'cash',
      note: 'รายการใหม่',
      confidence: 'high',
    };
    setParseResult({
      ...parseResult,
      items: [newItem, ...parseResult.items],
    });
  };

  // Calculate live dynamic totals for selected items
  const dynamicStats = useMemo(() => {
    if (!parseResult) {
      return { totalIncome: 0, totalExpense: 0, netProfit: 0, selectedCount: 0, incomeCount: 0, expenseCount: 0 };
    }

    let totalIncome = 0;
    let totalExpense = 0;
    let selectedCount = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    parseResult.items.forEach(item => {
      if (item.selected) {
        selectedCount++;
        if (item.type === 'income') {
          totalIncome += item.amount;
          incomeCount++;
        } else {
          totalExpense += item.amount;
          expenseCount++;
        }
      }
    });

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return { totalIncome, totalExpense, netProfit, profitMargin, selectedCount, incomeCount, expenseCount };
  }, [parseResult]);

  // Chart Data: Category Breakdown
  const categoryChartData = useMemo(() => {
    if (!parseResult) return { income: [], expense: [] };

    const incMap: Record<string, number> = {};
    const expMap: Record<string, number> = {};

    parseResult.items.forEach(item => {
      if (!item.selected) return;
      if (item.type === 'income') {
        incMap[item.category] = (incMap[item.category] || 0) + item.amount;
      } else {
        expMap[item.category] = (expMap[item.category] || 0) + item.amount;
      }
    });

    const incomeColors = ['#10B981', '#059669', '#34D399', '#047857', '#6EE7B7', '#065F46'];
    const expenseColors = ['#EF4444', '#DC2626', '#F87171', '#B91C1C', '#FCA5A5', '#991B1B'];

    const income = Object.entries(incMap).map(([name, value], i) => ({
      name,
      value,
      color: incomeColors[i % incomeColors.length],
    }));

    const expense = Object.entries(expMap).map(([name, value], i) => ({
      name,
      value,
      color: expenseColors[i % expenseColors.length],
    }));

    return { income, expense };
  }, [parseResult]);

  // Chart Data: Daily Cashflow Timeline
  const dailyChartData = useMemo(() => {
    if (!parseResult) return [];

    const dayMap: Record<string, { date: string; income: number; expense: number; net: number }> = {};

    parseResult.items.forEach(item => {
      if (!item.selected) return;
      const d = item.date;
      if (!dayMap[d]) {
        dayMap[d] = { date: d, income: 0, expense: 0, net: 0 };
      }
      if (item.type === 'income') {
        dayMap[d].income += item.amount;
      } else {
        dayMap[d].expense += item.amount;
      }
      dayMap[d].net = dayMap[d].income - dayMap[d].expense;
    });

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [parseResult]);

  // Filtered items in table
  const filteredItems = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.items.filter(item => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNote = item.note.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchAmt = item.amount.toString().includes(q);
        const matchDate = item.date.includes(q);
        if (!matchNote && !matchCat && !matchAmt && !matchDate) return false;
      }
      return true;
    });
  }, [parseResult, filterType, searchQuery]);

  // Submit and save selected items to Firestore / context
  const handleSaveToSystem = async () => {
    if (!parseResult) return;

    const selectedItems = parseResult.items.filter(item => item.selected && item.amount > 0);
    if (selectedItems.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการบันทึกอย่างน้อย 1 รายการ');
      return;
    }

    setIsSaving(true);
    try {
      const txDataList: Omit<Transaction, 'id' | 'createdAt'>[] = selectedItems.map(item => ({
        type: item.type,
        amount: item.amount,
        category: item.category,
        date: item.date,
        time: item.time,
        paymentMethod: item.paymentMethod,
        note: item.note,
        vendorOrCustomer: item.vendorOrCustomer,
        referenceNumber: item.referenceNumber,
      }));

      await onImportComplete(txDataList);
      onClose();
    } catch (err) {
      console.error('Failed to import transactions:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintSummary = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white border border-stone-200 text-stone-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50/90">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-stone-900">
                  นำเข้า & สรุปผลรายรับรายจ่ายทันที (Instant Summarizer)
                </h3>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  Excel / CSV / Paste
                </span>
              </div>
              <p className="text-xs text-stone-500">
                ลากวางไฟล์ Excel, CSV หรือกดวางข้อความ (Ctrl + V) เพื่อคำนวณและสรุปผลกำไร-ขาดทุนทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {parseResult && (
              <button
                type="button"
                onClick={() => setParseResult(null)}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>นำเข้าไฟล์อื่น</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* STEP 1: Upload / Drop Zone (Shown when no result yet) */}
          {!parseResult && (
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'upload'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    <span>อัปโหลด / ลากวางไฟล์ (Excel & CSV)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'paste'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    <Clipboard className="h-4 w-4" />
                    <span>คัดลอก & วางข้อความ (Ctrl + V)</span>
                  </button>
                </div>

                {/* Demo Quick Trigger */}
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                  <span>✨ ทดลองใช้ข้อมูลตัวอย่าง</span>
                </button>
              </div>

              {/* Upload Tab View */}
              {activeTab === 'upload' && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-emerald-600 bg-emerald-50/80 scale-[0.99]'
                      : 'border-stone-300 bg-stone-50/60 hover:border-emerald-500 hover:bg-emerald-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt,.json"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md border border-stone-200 text-emerald-600 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 stroke-[2]" />
                  </div>

                  <h4 className="mt-4 text-base font-bold text-stone-900">
                    ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                  </h4>
                  <p className="mt-1.5 text-xs text-stone-500 max-w-md">
                    รองรับไฟล์ <strong className="text-stone-700">Excel (.xlsx, .xls)</strong>, <strong className="text-stone-700">CSV (.csv)</strong>, รายงาน POS หรือ Statement บัญชีธนาคาร
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[11px] text-stone-500">
                    <span className="rounded-md bg-white px-2.5 py-1 font-semibold border border-stone-200 shadow-2xs">
                      📊 Excel Spreadsheets
                    </span>
                    <span className="rounded-md bg-white px-2.5 py-1 font-semibold border border-stone-200 shadow-2xs">
                      📑 CSV Files
                    </span>
                    <span className="rounded-md bg-white px-2.5 py-1 font-semibold border border-stone-200 shadow-2xs">
                      ⚡ สรุปผล Real-time อัตโนมัติ
                    </span>
                  </div>
                </div>
              )}

              {/* Paste Tab View */}
              {activeTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-700">
                      วางข้อความตารางจาก Excel, ข้อความแจ้งเตือน SMS ธนาคาร หรือบันทึกข้อความ
                    </label>
                    <span className="text-[11px] text-stone-400">
                      รองรับ Tab / Comma / ข้อความบรรทัดต่อบรรทัด
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="ตัวอย่างการวางข้อมูล:
2026-08-01	ขายกาแฟหน้าร้าน	กาแฟ & เครื่องดื่ม	รายรับ	3500	เงินสด
2026-08-01	ซื้อเมล็ดกาแฟคั่ว	เมล็ดกาแฟ & นม	รายจ่าย	1800	โอนเงิน
2026-08-02	ขายเค้กและขนม	เบเกอรี่ & ขนม	รายรับ	2100	เงินสด"
                    className="w-full rounded-2xl border border-stone-300 bg-stone-50 p-4 font-mono text-xs text-stone-900 focus:border-emerald-600 focus:bg-white focus:outline-none transition-colors"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleLoadDemo}
                      className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      หรือทดลองด้วยข้อมูลตัวอย่าง
                    </button>
                    <button
                      type="button"
                      disabled={!pastedText.trim() || isProcessing}
                      onClick={handlePasteSubmit}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                      <span>ประมวลผลและสรุปทันที</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Template Download Section */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                      <Download className="h-4 w-4 text-emerald-600" />
                      ดาวน์โหลดไฟล์แม่แบบตัวอย่าง (Sample Templates)
                    </h5>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      มีหัวคอลัมน์มาตรฐานครบถ้วน เช่น วันที่, รายการ, หมวดหมู่, ประเภท, จำนวนเงิน, วิธีชำระ
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadSampleExcelTemplate}
                      className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 hover:text-emerald-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>แม่แบบ Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={downloadSampleCsvTemplate}
                      className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-100 hover:text-emerald-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      <FileText className="h-3.5 w-3.5 text-stone-600" />
                      <span>แม่แบบ CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Instant Analysis & Live Summary (Shown when file is parsed) */}
          {parseResult && (
            <div className="space-y-6">
              {/* File Info Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-900 text-white p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate max-w-[280px] sm:max-w-md">
                        {parseResult.fileName}
                      </span>
                      <span className="rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                        {parseResult.fileType}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400">
                      ตรวจพบทั้งหมด {parseResult.items.length} รายการ • เลือกนำเข้า {dynamicStats.selectedCount} รายการ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCharts(!showCharts)}
                    className="flex items-center gap-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white px-3 py-1.5 text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
                  >
                    <span>{showCharts ? 'ซ่อนกราฟ' : 'ดูกราฟวิเคราะห์'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setParseResult(null)}
                    className="flex items-center gap-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white px-3 py-1.5 text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>เปลี่ยนไฟล์</span>
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Total Income */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800">ยอดรายรับรวม</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 font-bold text-xl sm:text-2xl text-emerald-900 tracking-tight">
                    {formatCurrency(dynamicStats.totalIncome)}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-emerald-700">
                    {dynamicStats.incomeCount} รายการ
                  </div>
                </div>

                {/* Total Expense */}
                <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800">ยอดรายจ่ายรวม</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-white shadow-2xs">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 font-bold text-xl sm:text-2xl text-rose-900 tracking-tight">
                    {formatCurrency(dynamicStats.totalExpense)}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-rose-700">
                    {dynamicStats.expenseCount} รายการ
                  </div>
                </div>

                {/* Net Profit */}
                <div className={`rounded-2xl border p-4 ${
                  dynamicStats.netProfit >= 0
                    ? 'border-amber-200 bg-amber-50/60 text-amber-950'
                    : 'border-rose-200 bg-rose-50/60 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">กำไรสุทธิ (Net Profit)</span>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-2xs ${
                      dynamicStats.netProfit >= 0 ? 'bg-amber-800' : 'bg-rose-600'
                    }`}>
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 font-bold text-xl sm:text-2xl tracking-tight">
                    {formatCurrency(dynamicStats.netProfit)}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold opacity-80">
                    {dynamicStats.netProfit >= 0 ? 'กระแสเงินสดเป็นบวก' : 'รายจ่ายสูงกว่ารายรับ'}
                  </div>
                </div>

                {/* Profit Margin */}
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">อัตรากำไร (Margin)</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-800 text-white shadow-2xs">
                      <Percent className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-2 font-bold text-xl sm:text-2xl text-stone-900 tracking-tight">
                    {dynamicStats.profitMargin.toFixed(1)}%
                  </div>
                  <div className="mt-1 text-[11px] font-semibold text-stone-500">
                    ของยอดรายรับรวม
                  </div>
                </div>
              </div>

              {/* Visual Breakdown Charts (Collapsible) */}
              {showCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Category Breakdown (Income) */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                    <h5 className="font-bold text-xs text-stone-800 flex items-center gap-1.5 mb-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      สัดส่วนรายรับตามหมวดหมู่
                    </h5>
                    {categoryChartData.income.length > 0 ? (
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryChartData.income}
                              cx="50%"
                              cy="50%"
                              innerRadius={36}
                              outerRadius={62}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {categoryChartData.income.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'ยอดเงิน']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-44 flex items-center justify-center text-xs text-stone-400">
                        ไม่มีข้อมูลรายรับ
                      </div>
                    )}
                    <div className="mt-1 space-y-1 max-h-24 overflow-y-auto text-[11px]">
                      {categoryChartData.income.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-stone-600">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </span>
                          <span className="font-bold text-stone-800">฿{c.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Breakdown (Expense) */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                    <h5 className="font-bold text-xs text-stone-800 flex items-center gap-1.5 mb-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      สัดส่วนรายจ่ายตามหมวดหมู่
                    </h5>
                    {categoryChartData.expense.length > 0 ? (
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryChartData.expense}
                              cx="50%"
                              cy="50%"
                              innerRadius={36}
                              outerRadius={62}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {categoryChartData.expense.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, 'ยอดเงิน']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-44 flex items-center justify-center text-xs text-stone-400">
                        ไม่มีข้อมูลรายจ่าย
                      </div>
                    )}
                    <div className="mt-1 space-y-1 max-h-24 overflow-y-auto text-[11px]">
                      {categoryChartData.expense.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-stone-600">
                          <span className="flex items-center gap-1.5 truncate">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            {c.name}
                          </span>
                          <span className="font-bold text-stone-800">฿{c.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Daily Trend Chart */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
                    <h5 className="font-bold text-xs text-stone-800 flex items-center gap-1.5 mb-2">
                      <Calendar className="h-4 w-4 text-amber-800" />
                      แนวโน้มกระแสเงินสดตามวัน
                    </h5>
                    {dailyChartData.length > 0 ? (
                      <div className="h-44 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(d) => d.slice(8, 10)} 
                              tick={{ fontSize: 10, fill: '#78716c' }} 
                            />
                            <YAxis tick={{ fontSize: 10, fill: '#78716c' }} tickFormatter={(v) => `฿${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                            <Tooltip formatter={(value: any) => [`฿${Number(value).toLocaleString()}`, '']} />
                            <Bar dataKey="income" name="รายรับ" fill="#10B981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expense" name="รายจ่าย" fill="#EF4444" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-44 flex items-center justify-center text-xs text-stone-400">
                        ไม่มีข้อมูลตามวัน
                      </div>
                    )}
                    <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-stone-600">
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" /> รายรับ
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> รายจ่าย
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Table Review & Edit Controls */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-stone-900">
                      รายการที่ตรวจพบ ({filteredItems.length} รายการ)
                    </h4>
                    <span className="text-xs text-stone-500">
                      (สามารถแก้ไข, ติ๊กเลือก หรือเพิ่มรายการได้โดยตรง)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Search in preview */}
                    <div className="relative flex-1 sm:w-48">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
                      <input
                        type="text"
                        placeholder="ค้นหา..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 pl-8 pr-3 py-1 text-xs text-stone-900 focus:bg-white focus:border-amber-700 focus:outline-none"
                      />
                    </div>

                    {/* Filter Type Pills */}
                    <div className="flex items-center rounded-xl bg-stone-100 p-0.5 border border-stone-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setFilterType('all')}
                        className={`rounded-lg px-2.5 py-1 font-bold transition-colors cursor-pointer ${
                          filterType === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        ทั้งหมด
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('income')}
                        className={`rounded-lg px-2.5 py-1 font-bold transition-colors cursor-pointer ${
                          filterType === 'income' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-600 hover:text-emerald-700'
                        }`}
                      >
                        รายรับ
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterType('expense')}
                        className={`rounded-lg px-2.5 py-1 font-bold transition-colors cursor-pointer ${
                          filterType === 'expense' ? 'bg-rose-600 text-white shadow-2xs' : 'text-stone-600 hover:text-rose-700'
                        }`}
                      >
                        รายจ่าย
                      </button>
                    </div>

                    {/* Add Custom Row */}
                    <button
                      type="button"
                      onClick={handleAddNewItem}
                      className="flex items-center gap-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 text-xs font-bold border border-stone-200 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>เพิ่มรายการ</span>
                    </button>
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-2xs max-h-[380px]">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="sticky top-0 z-10 bg-stone-50 border-b border-stone-200 font-bold text-stone-800">
                      <tr>
                        <th className="px-3 py-2.5 text-center w-10">
                          <input
                            type="checkbox"
                            checked={parseResult.items.length > 0 && parseResult.items.every(i => i.selected)}
                            onChange={(e) => handleToggleSelectAll(e.target.checked)}
                            className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-3 py-2.5 w-28">ประเภท</th>
                        <th className="px-3 py-2.5 w-32">วันที่ / เวลา</th>
                        <th className="px-3 py-2.5 min-w-[180px]">รายการ / คำอธิบาย</th>
                        <th className="px-3 py-2.5 min-w-[160px]">หมวดหมู่</th>
                        <th className="px-3 py-2.5 w-32 text-right">จำนวนเงิน (฿)</th>
                        <th className="px-3 py-2.5 w-28">วิธีชำระ</th>
                        <th className="px-3 py-2.5 text-center w-12">ลบ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-stone-400">
                            ไม่พบรายการที่ตรงกับเงื่อนไข
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                          <tr 
                            key={item.id} 
                            className={`transition-colors ${
                              item.selected ? 'hover:bg-stone-50/80' : 'bg-stone-50/40 opacity-50'
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => handleToggleItem(item.id)}
                                className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>

                            {/* Type Toggle */}
                            <td className="px-3 py-2">
                              <select
                                value={item.type}
                                onChange={(e) => handleUpdateItem(item.id, { type: e.target.value as TransactionType })}
                                className={`w-full rounded-lg px-2 py-1 text-xs font-bold border cursor-pointer focus:outline-none ${
                                  item.type === 'income'
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                    : 'bg-rose-50 text-rose-800 border-rose-300'
                                }`}
                              >
                                <option value="income">🟢 รายรับ</option>
                                <option value="expense">🔴 รายจ่าย</option>
                              </select>
                            </td>

                            {/* Date / Time */}
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1">
                                <input
                                  type="date"
                                  value={item.date}
                                  onChange={(e) => handleUpdateItem(item.id, { date: e.target.value })}
                                  className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
                                />
                              </div>
                            </td>

                            {/* Note / Description */}
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.note}
                                onChange={(e) => handleUpdateItem(item.id, { note: e.target.value })}
                                placeholder="รายละเอียด..."
                                className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
                              />
                            </td>

                            {/* Category Select */}
                            <td className="px-3 py-2">
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                                className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
                              >
                                {item.type === 'income' ? (
                                  DEFAULT_INCOME_CATEGORIES.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                  ))
                                ) : (
                                  DEFAULT_EXPENSE_CATEGORIES.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                  ))
                                )}
                              </select>
                            </td>

                            {/* Amount */}
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                step="any"
                                value={item.amount}
                                onChange={(e) => handleUpdateItem(item.id, { amount: parseFloat(e.target.value) || 0 })}
                                className={`w-full rounded-lg border px-2 py-1 text-right font-mono font-bold text-xs focus:outline-none ${
                                  item.type === 'income'
                                    ? 'border-emerald-300 text-emerald-900 bg-emerald-50/40'
                                    : 'border-rose-300 text-rose-900 bg-rose-50/40'
                                }`}
                              />
                            </td>

                            {/* Payment Method */}
                            <td className="px-3 py-2">
                              <select
                                value={item.paymentMethod}
                                onChange={(e) => handleUpdateItem(item.id, { paymentMethod: e.target.value as PaymentMethod })}
                                className="w-full rounded-lg border border-stone-200 bg-white px-1.5 py-1 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
                              >
                                <option value="cash">💵 เงินสด</option>
                                <option value="qr_promptpay">📱 โอน/QR</option>
                                <option value="credit_card">💳 บัตร</option>
                              </select>
                            </td>

                            {/* Delete Row */}
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id)}
                                className="rounded-lg p-1 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-200 px-6 py-4 bg-stone-50">
          <div className="text-xs text-stone-500">
            {parseResult ? (
              <span>
                พร้อมบันทึก <strong className="text-emerald-700">{dynamicStats.selectedCount}</strong> รายการ ลงระบบฐานข้อมูล
              </span>
            ) : (
              <span>รองรับการกด Ctrl+V วางข้อมูลได้ทุกที่ในหน้านี้</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>

            {parseResult && (
              <>
                <button
                  type="button"
                  onClick={handlePrintSummary}
                  className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-stone-600" />
                  <span>พิมพ์รายงานสรุปนี้</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving || dynamicStats.selectedCount === 0}
                  onClick={handleSaveToSystem}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>กำลังบันทึกลงระบบ...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 stroke-[2.5]" />
                      <span>บันทึกลงระบบทันที ({dynamicStats.selectedCount} รายการ)</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
