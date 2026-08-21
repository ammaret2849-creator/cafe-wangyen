import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  QrCode, 
  Calendar, 
  Clock,
  Building, 
  CheckCircle2, 
  Receipt,
  Download,
  Filter,
  DollarSign,
  Search,
  RotateCcw,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Transaction, CafeSettings, MonthlyStats, FilterOptions } from '../types';
import { 
  formatCurrency, 
  formatDateThai, 
  formatMonthYearThai,
  formatDateRangeThai,
  getTodayDateString,
  getYesterdayDateString,
  getDaysAgoDateString,
  getFirstDayOfMonthString,
  getLastDayOfMonthString
} from '../utils/formatters';
import { getReceiptQrUrl } from '../utils/imageHelper';
import { CollegeLogo } from './CollegeLogo';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  stats: MonthlyStats;
  settings: CafeSettings;
  selectedMonth: string;
  initialFilter?: FilterOptions;
}

type PrintFormat = 'monthly_full' | 'expense_vouchers' | 'daily_summary' | 'thermal_pos';

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  transactions,
  stats,
  settings,
  selectedMonth,
  initialFilter,
}) => {
  const [printFormat, setPrintFormat] = useState<PrintFormat>('monthly_full');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [slipsOnly, setSlipsOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [datePreset, setDatePreset] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Initialize or synchronize filter when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialFilter) {
        setFilterType(initialFilter.type as any || 'all');
        setSlipsOnly(!!initialFilter.hasSlipOnly);
        setSearchQuery(initialFilter.search || '');
        setStartDate(initialFilter.startDate || '');
        setEndDate(initialFilter.endDate || '');
        setStartTime(initialFilter.startTime || '');
        setEndTime(initialFilter.endTime || '');
        setDatePreset(initialFilter.datePreset || (initialFilter.startDate ? 'custom' : 'all'));
        setSelectedCategory(initialFilter.category || 'all');
      } else if (selectedMonth !== 'all') {
        setStartDate(`${selectedMonth}-01`);
        setEndDate(getLastDayOfMonthString(selectedMonth));
        setDatePreset('month');
      }
    }
  }, [isOpen, initialFilter, selectedMonth]);

  if (!isOpen) return null;

  // Preset Date Handlers
  const handleApplyPreset = (preset: string) => {
    setDatePreset(preset);
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      setStartTime('');
      setEndTime('');
    } else if (preset === 'today') {
      const today = getTodayDateString();
      setStartDate(today);
      setEndDate(today);
    } else if (preset === 'yesterday') {
      const yesterday = getYesterdayDateString();
      setStartDate(yesterday);
      setEndDate(yesterday);
    } else if (preset === 'last_7_days') {
      setStartDate(getDaysAgoDateString(6));
      setEndDate(getTodayDateString());
    } else if (preset === 'this_month') {
      setStartDate(getFirstDayOfMonthString());
      setEndDate(getLastDayOfMonthString());
    }
  };

  const handleApplyShift = (shift: 'all_day' | 'morning' | 'afternoon') => {
    if (shift === 'all_day') {
      setStartTime('');
      setEndTime('');
    } else if (shift === 'morning') {
      setStartTime('06:00');
      setEndTime('14:00');
    } else if (shift === 'afternoon') {
      setStartTime('14:00');
      setEndTime('22:00');
    }
  };

  const handleResetFilters = () => {
    setFilterType('all');
    setSlipsOnly(false);
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setDatePreset('all');
    setSelectedCategory('all');
  };

  // Filter transactions for printing with full date-time logic
  const printList = transactions
    .filter((tx) => {
      // Date range
      if (startDate && endDate) {
        if (tx.date < startDate || tx.date > endDate) return false;
      } else if (startDate) {
        if (tx.date < startDate) return false;
      } else if (endDate) {
        if (tx.date > endDate) return false;
      }

      // Time range
      if (startTime || endTime) {
        const txTime = tx.time || '00:00';
        if (startDate && endDate && startDate === endDate) {
          if (startTime && txTime < startTime) return false;
          if (endTime && txTime > endTime) return false;
        } else if (startDate && tx.date === startDate && startTime) {
          if (txTime < startTime) return false;
        } else if (endDate && tx.date === endDate && endTime) {
          if (txTime > endTime) return false;
        } else if (!startDate && !endDate) {
          if (startTime && txTime < startTime) return false;
          if (endTime && txTime > endTime) return false;
        }
      }

      // Type
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // Category
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) return false;

      // Slips Only
      if (slipsOnly && !tx.slipUrl) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchNote = tx.note?.toLowerCase().includes(query) || false;
        const matchCategory = tx.category.toLowerCase().includes(query);
        const matchVendor = tx.vendorOrCustomer?.toLowerCase().includes(query) || false;
        const matchRef = tx.referenceNumber?.toLowerCase().includes(query) || false;
        if (!matchNote && !matchCategory && !matchVendor && !matchRef) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const timeA = a.date + 'T' + (a.time || '00:00');
      const timeB = b.date + 'T' + (b.time || '00:00');
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });

  const totalFilteredIncome = printList.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalFilteredExpense = printList.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netFilteredProfit = totalFilteredIncome - totalFilteredExpense;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (printList.length === 0) {
      alert('ไม่มีข้อมูลรายการสำหรับส่งออก');
      return;
    }

    const headers = ['ลำดับ', 'เลขที่อ้างอิง', 'ประเภท', 'วันที่', 'เวลา', 'หมวดหมู่', 'จำนวนเงิน', 'วิธีการชำระ', 'คู่ค้า/ลูกค้า', 'บันทึก', 'ลิงก์สลิปQR'];
    const rows = printList.map((t, idx) => [
      idx + 1,
      t.referenceNumber || t.id,
      t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      t.date,
      t.time || '',
      t.category,
      t.amount,
      t.paymentMethod,
      t.vendorOrCustomer ? `"${t.vendorOrCustomer.replace(/"/g, '""')}"` : '',
      t.note ? `"${t.note.replace(/"/g, '""')}"` : '',
      t.slipUrl ? getReceiptQrUrl(t.id) : '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cafe_report_${startDate || 'all'}_to_${endDate || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const nowThaiStr = formatDateThai(new Date().toISOString().slice(0, 10), new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));

  const dateRangeDisplay = formatDateRangeThai(startDate, endDate, startTime, endTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-2 sm:p-4 backdrop-blur-xs">
      <div 
        className="relative flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white border border-stone-200 text-stone-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Controls (Hidden during print via print:hidden) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 px-6 py-4 bg-stone-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900">
                ระบบค้นหาวันเวลา & สั่งพิมพ์รายงานคาเฟ่
              </h3>
              <p className="text-xs text-stone-500">
                สลิปหลักฐานจะถูกแปลงเป็น QR Code ในใบพิมพ์โดยอัตโนมัติ เพื่อให้ผู้ตรวจสอบสแกนเปิดดูภาพสลิปต้นฉบับได้
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              ส่งออก CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2 text-sm font-bold text-white hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              พิมพ์เอกสาร (Print Report)
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Rich Date & Time Search / Filter Controls Panel (Hidden during print) */}
        <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-3.5 space-y-3 text-xs print:hidden">
          {/* Row 1: Format & Date Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Format selector */}
            <div className="flex items-center gap-2">
              <span className="text-stone-700 font-bold">รูปแบบเอกสาร:</span>
              <select
                value={printFormat}
                onChange={(e) => setPrintFormat(e.target.value as PrintFormat)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 font-semibold focus:border-amber-700 focus:outline-none"
              >
                <option value="monthly_full">รายงานสรุปรายรับ-รายจ่ายมาตรฐาน (A4)</option>
                <option value="expense_vouchers">ใบสำคัญจ่ายพร้อม QR สลิป (Vouchers)</option>
                <option value="daily_summary">รายงานแจกแจงรายวัน</option>
                <option value="thermal_pos">ใบสรุปย่อ POS (80mm Thermal Receipt)</option>
              </select>
            </div>

            {/* Quick date presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-stone-600 font-bold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-amber-800" /> ช่วงเวลา:
              </span>
              <button
                type="button"
                onClick={() => handleApplyPreset('all')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  datePreset === 'all'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:border-stone-400'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('today')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  datePreset === 'today'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:border-stone-400'
                }`}
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('yesterday')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  datePreset === 'yesterday'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:border-stone-400'
                }`}
              >
                เมื่อวาน
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('last_7_days')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  datePreset === 'last_7_days'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:border-stone-400'
                }`}
              >
                7 วันล่าสุด
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('this_month')}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                  datePreset === 'this_month'
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-white text-stone-700 border border-stone-300 hover:border-stone-400'
                }`}
              >
                เดือนนี้
              </button>
            </div>
          </div>

          {/* Row 2: Custom Date & Time Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1 border-t border-stone-200">
            {/* Start Date */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-stone-400" /> ตั้งแต่วันที่:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-stone-400" /> ถึงวันที่:
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <Clock className="h-3 w-3 text-stone-400" /> เวลาเริ่ม:
              </span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
              />
            </div>

            {/* End Time & Shift Quick Toggle */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-stone-400" /> ถึงเวลา:
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleApplyShift('morning')}
                    className="text-amber-800 font-bold hover:underline cursor-pointer"
                  >
                    กะเช้า
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleApplyShift('afternoon')}
                    className="text-amber-800 font-bold hover:underline cursor-pointer"
                  >
                    กะบ่าย
                  </button>
                </div>
              </div>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
              />
            </div>

            {/* Search Query Filter */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <Search className="h-3 w-3 text-stone-400" /> ค้นหาคำค้น:
              </span>
              <input
                type="text"
                placeholder="ชื่อรายการ, ร้านค้า, เลขบิล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 3: Type Filter, Slip Toggle, Active count */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1.5 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-stone-700 font-bold">ประเภท:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="rounded-xl border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-900 font-semibold focus:border-amber-700 focus:outline-none"
                >
                  <option value="all">ทั้งหมด (รายรับ + รายจ่าย)</option>
                  <option value="expense">เฉพาะรายจ่าย (Expenses)</option>
                  <option value="income">เฉพาะรายรับ (Income)</option>
                </select>
              </div>

              <label className="flex items-center gap-1.5 text-stone-700 cursor-pointer hover:text-stone-900 font-semibold">
                <input
                  type="checkbox"
                  checked={slipsOnly}
                  onChange={(e) => setSlipsOnly(e.target.checked)}
                  className="rounded border-stone-300 text-amber-800 focus:ring-0 h-3.5 w-3.5"
                />
                <span>เฉพาะที่มีสลิปแนบ</span>
              </label>

              {(startDate || endDate || startTime || endTime || searchQuery || filterType !== 'all' || slipsOnly) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-[11px] text-stone-400 hover:text-rose-600 font-medium cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" /> ล้างตัวกรอง
                </button>
              )}
            </div>

            <div className="text-xs text-stone-600 font-semibold">
              ตรงกับเงื่อนไขค้นหา: <span className="text-stone-900 font-bold">{printList.length}</span> รายการ
            </div>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="flex-1 overflow-y-auto bg-stone-200/70 p-4 sm:p-6 print:p-0 print:bg-white print:overflow-visible">
          {/* Paper Sheet Preview */}
          <div 
            ref={printAreaRef}
            id="printable-area"
            className={`mx-auto bg-white text-stone-900 p-8 shadow-xl print:shadow-none print:p-0 print:m-0 border border-stone-200 print:border-0 ${
              printFormat === 'thermal_pos' 
                ? 'max-w-[420px] font-mono text-xs' 
                : 'max-w-[900px] rounded-2xl'
            }`}
          >
            {/* Header section */}
            <div className="border-b-2 border-[#6B705C] pb-4 mb-6">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3.5">
                  <CollegeLogo size={60} customUrl={settings.logoUrl} className="shrink-0" />
                  <div>
                    <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#3F4238] uppercase leading-tight">
                      {settings.cafeName}
                    </h1>
                    <p className="text-sm text-stone-600 font-medium mt-0.5">
                      {settings.cafeBranch || 'วิทยาลัยเทคนิควังน้ำเย็น'} • โทร {settings.phone || '-'}
                    </p>
                    {settings.taxId && (
                      <p className="text-xs text-stone-500">
                        เลขประจำตัวผู้เสียภาษี: {settings.taxId}
                      </p>
                    )}
                    {settings.address && (
                      <p className="text-xs text-stone-500 max-w-md mt-0.5">
                        {settings.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-block bg-[#6B705C] text-white px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-1">
                    {printFormat === 'expense_vouchers' 
                      ? 'ใบสำคัญจ่าย / EXPENSE VOUCHER' 
                      : (printFormat === 'daily_summary' ? 'รายงานแจกแจงรายวัน / DAILY SUMMARY' : 'รายงานบันทึกและสรุปรายรับรายจ่าย')}
                  </div>
                  <div className="text-xs text-stone-700 font-medium">
                    ช่วงเวลาที่เลือก: <strong className="text-stone-900">{dateRangeDisplay}</strong>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">
                    พิมพ์เมื่อ: {nowThaiStr}
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="grid grid-cols-3 gap-4 mb-6 bg-[#F9F7F2] p-4 rounded-xl border border-[#E6E1D3]">
              <div>
                <span className="text-[11px] font-bold text-[#6B705C] uppercase">ยอดรายรับรวม ({printList.filter(t => t.type === 'income').length} รายการ)</span>
                <div className="text-lg font-extrabold text-[#6B705C]">
                  {formatCurrency(totalFilteredIncome, settings.currencySymbol)}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#BC6C25] uppercase">ยอดรายจ่ายรวม ({printList.filter(t => t.type === 'expense').length} รายการ)</span>
                <div className="text-lg font-extrabold text-[#BC6C25]">
                  {formatCurrency(totalFilteredExpense, settings.currencySymbol)}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#3F4238] uppercase">กำไรสุทธิคงเหลือ</span>
                <div className={`text-lg font-extrabold ${netFilteredProfit >= 0 ? 'text-[#6B705C]' : 'text-[#BC6C25]'}`}>
                  {netFilteredProfit >= 0 ? '+' : ''}{formatCurrency(netFilteredProfit, settings.currencySymbol)}
                </div>
              </div>
            </div>

            {/* Main Transactions Table with QR Codes for Receipts */}
            <div className="mb-6 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-[#6B705C] bg-[#F0EDE5] text-[#3F4238] font-bold uppercase">
                    <th className="py-2.5 px-2">ลำดับ / เลขที่</th>
                    <th className="py-2.5 px-2">วัน-เวลา</th>
                    <th className="py-2.5 px-2">หมวดหมู่ & รายการ</th>
                    <th className="py-2.5 px-2">ชำระโดย</th>
                    <th className="py-2.5 px-2 text-right">จำนวนเงิน</th>
                    <th className="py-2.5 px-2 text-center w-24">สลิปหลักฐาน (QR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {printList.map((tx, idx) => {
                    const qrUrl = getReceiptQrUrl(tx.id);
                    return (
                      <tr key={tx.id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-2 font-mono text-[11px] align-top text-stone-600">
                          {idx + 1}. <span className="font-semibold text-stone-900">{tx.referenceNumber || tx.id.slice(0, 8)}</span>
                        </td>
                        <td className="py-3 px-2 align-top text-stone-700 whitespace-nowrap">
                          {formatDateThai(tx.date)}
                          {tx.time && <div className="text-[10px] text-stone-400 font-mono">{tx.time} น.</div>}
                        </td>
                        <td className="py-3 px-2 align-top">
                          <div className="font-semibold text-stone-900">{tx.category}</div>
                          {tx.note && <div className="text-stone-600 mt-0.5">{tx.note}</div>}
                          {tx.vendorOrCustomer && (
                            <div className="text-[11px] text-stone-500">คู่ค้า: {tx.vendorOrCustomer}</div>
                          )}
                        </td>
                        <td className="py-3 px-2 align-top text-stone-600 whitespace-nowrap">
                          {tx.paymentMethod === 'cash' && 'เงินสด'}
                          {tx.paymentMethod === 'qr_promptpay' && 'QR พร้อมเพย์'}
                          {tx.paymentMethod === 'transfer' && 'โอนธนาคาร'}
                          {tx.paymentMethod === 'credit_card' && 'บัตรเครดิต'}
                          {tx.paymentMethod === 'other' && 'อื่นๆ'}
                        </td>
                        <td className="py-3 px-2 align-top text-right whitespace-nowrap">
                          <span className={`font-bold ${
                            tx.type === 'income' ? 'text-[#6B705C]' : 'text-[#BC6C25]'
                          }`}>
                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, settings.currencySymbol)}
                          </span>
                        </td>
                        {/* QR CODE FOR SLIP */}
                        <td className="py-3 px-2 align-top text-center">
                          {tx.slipUrl ? (
                            <div className="flex flex-col items-center justify-center">
                              <div className="p-1 bg-white border border-stone-300 rounded shadow-xs inline-block">
                                <QRCodeSVG
                                  value={qrUrl}
                                  size={52}
                                  level="M"
                                  includeMargin={false}
                                />
                              </div>
                              <span className="text-[9px] text-stone-500 font-medium mt-1 leading-tight block">
                                สแกนดูสลิป
                              </span>
                            </div>
                          ) : (
                            <span className="text-stone-300 text-center block">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {printList.length === 0 && (
                <div className="py-8 text-center text-xs text-stone-400">
                  ไม่มีข้อมูลรายการตามช่วงวันเวลาและเงื่อนไขที่เลือก
                </div>
              )}
            </div>

            {/* Signature & Verification Block */}
            <div className="mt-10 pt-6 border-t border-stone-300 grid grid-cols-2 gap-8 text-center text-xs text-stone-700">
              <div>
                <div className="h-12 border-b border-dashed border-stone-400 mx-8"></div>
                <p className="mt-2 font-semibold">ผู้จัดทำรายการ / พนักงานร้าน</p>
                <p className="text-[10px] text-stone-400">วันที่: ......./......./.......</p>
              </div>
              <div>
                <div className="h-12 border-b border-dashed border-stone-400 mx-8"></div>
                <p className="mt-2 font-semibold">ผู้ตรวจสอบ / เจ้าของร้านกาแฟ</p>
                <p className="text-[10px] text-stone-400">วันที่: ......./......./.......</p>
              </div>
            </div>

            {/* Footer Note */}
            <div className="mt-6 text-center text-[10px] text-stone-400 border-t border-stone-200 pt-2">
              * เอกสารนี้จัดทำโดยระบบจัดการรายรับรายจ่ายคาเฟ่ (เชื่อมโยง Firebase โครงการ cafe-cd) • สามารถสแกน QR Code บนรายการเพื่อเปิดดูสลิปภาพจริงได้ตลอดเวลา
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
