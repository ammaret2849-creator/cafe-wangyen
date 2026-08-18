import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  QrCode, 
  Download, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Receipt, 
  Calendar, 
  Clock,
  FileSpreadsheet,
  Check,
  AlertCircle,
  RotateCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Upload
} from 'lucide-react';
import { Transaction, CafeSettings, FilterOptions } from '../types';
import { 
  formatCurrency, 
  formatDateThai, 
  formatDateRangeThai, 
  getTodayDateString, 
  getYesterdayDateString, 
  getDaysAgoDateString, 
  getFirstDayOfMonthString, 
  getLastDayOfMonthString 
} from '../utils/formatters';
import { ALL_DEFAULT_CATEGORIES } from '../data/categories';

interface TransactionListProps {
  transactions: Transaction[];
  settings: CafeSettings;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onViewReceipt: (tx: Transaction) => void;
  onAddNew: (type: 'income' | 'expense') => void;
  onOpenPrint?: () => void;
  onOpenImport?: () => void;
  filter: FilterOptions;
  setFilter: React.Dispatch<React.SetStateAction<FilterOptions>>;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  settings,
  onEdit,
  onDelete,
  onViewReceipt,
  onAddNew,
  onOpenPrint,
  onOpenImport,
  filter,
  setFilter,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState<boolean>(false);

  // Quick Date Preset Handler
  const handleApplyDatePreset = (preset: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'custom') => {
    if (preset === 'all') {
      setFilter(prev => ({
        ...prev,
        datePreset: 'all',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
      }));
    } else if (preset === 'today') {
      const today = getTodayDateString();
      setFilter(prev => ({
        ...prev,
        datePreset: 'today',
        startDate: today,
        endDate: today,
      }));
    } else if (preset === 'yesterday') {
      const yesterday = getYesterdayDateString();
      setFilter(prev => ({
        ...prev,
        datePreset: 'yesterday',
        startDate: yesterday,
        endDate: yesterday,
      }));
    } else if (preset === 'last_7_days') {
      const start = getDaysAgoDateString(6);
      const end = getTodayDateString();
      setFilter(prev => ({
        ...prev,
        datePreset: 'last_7_days',
        startDate: start,
        endDate: end,
      }));
    } else if (preset === 'this_month') {
      const start = getFirstDayOfMonthString();
      const end = getLastDayOfMonthString();
      setFilter(prev => ({
        ...prev,
        datePreset: 'this_month',
        startDate: start,
        endDate: end,
      }));
    } else {
      setFilter(prev => ({ ...prev, datePreset: 'custom' }));
    }
  };

  // Quick Time Shift Handler
  const handleApplyTimeShift = (shift: 'all_day' | 'morning' | 'afternoon') => {
    if (shift === 'all_day') {
      setFilter(prev => ({ ...prev, startTime: '', endTime: '' }));
    } else if (shift === 'morning') {
      setFilter(prev => ({ ...prev, startTime: '06:00', endTime: '14:00' }));
    } else if (shift === 'afternoon') {
      setFilter(prev => ({ ...prev, startTime: '14:00', endTime: '22:00' }));
    }
  };

  const handleResetFilters = () => {
    setFilter({
      search: '',
      type: 'all',
      category: 'all',
      paymentMethod: 'all',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      hasSlipOnly: false,
      datePreset: 'all',
    });
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('ไม่มีข้อมูลรายการสำหรับส่งออก');
      return;
    }

    const headers = ['เลขที่อ้างอิง', 'ประเภท', 'วันที่', 'เวลา', 'หมวดหมู่', 'จำนวนเงิน', 'วิธีการชำระ', 'คู่ค้า/ลูกค้า', 'บันทึก', 'มีสลิปแนบ'];
    const rows = transactions.map(t => [
      t.referenceNumber || t.id,
      t.type === 'income' ? 'รายรับ' : 'รายจ่าย',
      t.date,
      t.time || '',
      t.category,
      t.amount,
      t.paymentMethod,
      t.vendorOrCustomer ? `"${t.vendorOrCustomer.replace(/"/g, '""')}"` : '',
      t.note ? `"${t.note.replace(/"/g, '""')}"` : '',
      t.slipUrl ? 'มีสลิป' : 'ไม่มี',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cafe_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryColor = (catName: string) => {
    const found = ALL_DEFAULT_CATEGORIES.find(c => c.name === catName);
    return found?.color || '#6B705C';
  };

  // Filtered stats calculation
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const isFilteredActive = !!(
    filter.search || 
    filter.type !== 'all' || 
    filter.category !== 'all' || 
    filter.paymentMethod !== 'all' || 
    filter.startDate || 
    filter.endDate || 
    filter.startTime || 
    filter.endTime || 
    filter.hasSlipOnly
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Receipt className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">
              รายการบันทึกรายรับ-รายจ่าย
            </h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700 font-bold border border-slate-200">
              {transactions.length} รายการ
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isFilteredActive 
              ? `ช่วงเวลาที่ค้นหา: ${formatDateRangeThai(filter.startDate, filter.endDate, filter.startTime, filter.endTime)}` 
              : 'ค้นหาวันเวลา แก้ไขรายละเอียดรายการ และสั่งพิมพ์รายงานพร้อม QR Code สลิป'}
          </p>
        </div>

        {/* Quick Actions & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 transition-colors shadow-2xs"
              title="นำเข้าไฟล์ Excel / CSV หรือวางไฟล์เพื่อสรุปผลทันที"
            >
              <Upload className="h-3.5 w-3.5 text-emerald-600" />
              <span>นำเข้า Excel / CSV</span>
            </button>
          )}

          {onOpenPrint && (
            <button
              onClick={onOpenPrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
              title="สั่งพิมพ์รายงานตามช่วงวันเวลาที่ค้นหา"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600" />
              <span>พิมพ์รายงาน</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="ดาวน์โหลดไฟล์ CSV"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-600" />
            <span>ส่งออก CSV</span>
          </button>

          <button
            onClick={() => onAddNew('income')}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>เพิ่มรายรับ</span>
          </button>

          <button
            onClick={() => onAddNew('expense')}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>เพิ่มรายจ่าย</span>
          </button>
        </div>
      </div>

      {/* Date-Time Search & Filtering Section */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3.5">
        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              ช่วงเวลา:
            </span>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('all')}
              className={`rounded-xl px-2.5 py-1 font-semibold transition-all ${
                (!filter.startDate && !filter.endDate)
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('today')}
              className={`rounded-xl px-2.5 py-1 font-semibold transition-all ${
                filter.datePreset === 'today' || (filter.startDate === getTodayDateString() && filter.endDate === getTodayDateString())
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('yesterday')}
              className={`rounded-xl px-2.5 py-1 font-semibold transition-all ${
                filter.datePreset === 'yesterday'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              เมื่อวาน
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('last_7_days')}
              className={`rounded-xl px-2.5 py-1 font-semibold transition-all ${
                filter.datePreset === 'last_7_days'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              7 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => handleApplyDatePreset('this_month')}
              className={`rounded-xl px-2.5 py-1 font-semibold transition-all ${
                filter.datePreset === 'this_month'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              เดือนนี้
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            className="flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>{showAdvancedFilter ? 'ย่อตัวกรองละเอียด' : 'ค้นหาระบุวัน-เวลาแบบละเอียด'}</span>
            {showAdvancedFilter ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Primary Filter Bar: Search, Type, Payment, Slip toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อรายการ, คู่ค้า, เลขที่อ้างอิง, โน้ต..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">ทุกประเภท (รับ + จ่าย)</option>
              <option value="income">เฉพาะรายรับ (+)</option>
              <option value="expense">เฉพาะรายจ่าย (-)</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <select
              value={filter.paymentMethod}
              onChange={(e) => setFilter(prev => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs text-slate-800 font-medium focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">ทุกวิธีชำระเงิน</option>
              <option value="qr_promptpay">QR / พร้อมเพย์</option>
              <option value="transfer">โอนเงินธนาคาร</option>
              <option value="cash">เงินสด</option>
              <option value="credit_card">บัตรเครดิต</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>

          {/* Slip Only Toggle */}
          <div className="flex items-center justify-between sm:justify-start">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 px-2 py-1">
              <input
                type="checkbox"
                checked={!!filter.hasSlipOnly}
                onChange={(e) => setFilter(prev => ({ ...prev, hasSlipOnly: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <span className="truncate font-semibold text-xs">เฉพาะที่มีสลิป</span>
            </label>

            {isFilteredActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 ml-auto font-medium"
                title="ล้างตัวกรองทั้งหมด"
              >
                <RotateCcw className="h-3 w-3" />
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Detailed Date Range & Time Filter (Expandable) */}
        {showAdvancedFilter && (
          <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-indigo-600" /> วันที่เริ่มต้น:
              </label>
              <input
                type="date"
                value={filter.startDate || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value, datePreset: 'custom' }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-indigo-600" /> วันที่สิ้นสุด:
              </label>
              <input
                type="date"
                value={filter.endDate || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value, datePreset: 'custom' }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Clock className="h-3 w-3 text-indigo-600" /> เวลาเริ่มต้น:
              </label>
              <input
                type="time"
                value={filter.startTime || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* End Time & Shift Presets */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-indigo-600" /> เวลาสิ้นสุด:
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleApplyTimeShift('morning')}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    กะเช้า
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleApplyTimeShift('afternoon')}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    กะบ่าย
                  </button>
                </div>
              </div>
              <input
                type="time"
                value={filter.endTime || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Filter Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-200">
          <div className="flex items-center gap-4 text-slate-700 font-medium">
            <span>
              รายรับ: <strong className="text-emerald-700 font-bold">+{formatCurrency(totalIncome, settings.currencySymbol)}</strong>
            </span>
            <span>
              รายจ่าย: <strong className="text-rose-700 font-bold">-{formatCurrency(totalExpense, settings.currencySymbol)}</strong>
            </span>
            <span>
              คงเหลือ: <strong className={`font-bold ${netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance, settings.currencySymbol)}
              </strong>
            </span>
          </div>

          {isFilteredActive && (
            <div className="text-[11px] text-indigo-700 font-bold flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              กำลังแสดงผลลัพธ์ตามเงื่อนไขค้นหา ({transactions.length} รายการ)
            </div>
          )}
        </div>
      </div>

      {/* Transaction List Cards / Table */}
      <div className="space-y-2 pt-1">
        {transactions.length > 0 ? (
          transactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const catColor = getCategoryColor(tx.category);

            return (
              <div
                key={tx.id}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-300 hover:shadow-xs"
              >
                {/* Left details */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  {/* Category color bullet / icon */}
                  <div 
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold transition-transform group-hover:scale-105 ${
                      isIncome ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-rose-50 text-rose-600 border border-rose-200'
                    }`}
                  >
                    {isIncome ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {tx.category}
                      </span>
                      <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        {tx.referenceNumber || tx.id.slice(0, 8)}
                      </span>
                      {tx.isOfflinePending && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          รอซิงค์คลาวด์
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {formatDateThai(tx.date, tx.time)}
                      </span>
                      {tx.vendorOrCustomer && (
                        <span className="text-slate-800 font-medium">
                          • {tx.vendorOrCustomer}
                        </span>
                      )}
                      {tx.note && (
                        <span className="text-slate-600 truncate max-w-sm">
                          • {tx.note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Payment badge, Slip preview, Amount, Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {/* Payment method badge */}
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700 font-semibold border border-slate-200">
                    {tx.paymentMethod === 'cash' && 'เงินสด'}
                    {tx.paymentMethod === 'qr_promptpay' && 'QR พร้อมเพย์'}
                    {tx.paymentMethod === 'transfer' && 'โอนธนาคาร'}
                    {tx.paymentMethod === 'credit_card' && 'บัตรเครดิต'}
                    {tx.paymentMethod === 'other' && 'อื่นๆ'}
                  </span>

                  {/* Slip preview / QR trigger */}
                  {tx.slipUrl ? (
                    <button
                      onClick={() => onViewReceipt(tx)}
                      className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                      title="คลิกเพื่อดูสลิปภาพต้นฉบับ & QR Code"
                    >
                      <QrCode className="h-3.5 w-3.5 text-indigo-600" />
                      <span>ดูสลิป</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 px-2 font-medium">ไม่มีสลิป</span>
                  )}

                  {/* Amount */}
                  <div className={`text-right font-extrabold text-base min-w-[100px] ${
                    isIncome ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {isIncome ? '+' : '-'}{formatCurrency(tx.amount, settings.currencySymbol)}
                  </div>

                  {/* Action buttons: Edit and Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEdit(tx)}
                      className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="แก้ไขข้อมูลรายการบันทึกนี้"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {deleteConfirmId === tx.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl border border-rose-200">
                        <button
                          onClick={() => {
                            onDelete(tx.id);
                            setDeleteConfirmId(null);
                          }}
                          className="text-xs text-white bg-rose-600 font-bold px-2 py-0.5 hover:bg-rose-700 rounded-lg transition-colors"
                        >
                          ยืนยันลบ
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs text-slate-500 hover:text-slate-800 px-1.5"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(tx.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="ลบรายการ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-14 text-center text-slate-400">
            <Receipt className="h-12 w-12 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-bold text-slate-800">ไม่พบรายการบันทึกตามเงื่อนไขที่เลือก</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              ลองปรับเปลี่ยนช่วงวัน-เวลา คำค้นหา หรือกดปุ่ม "ล้างตัวกรอง" เพื่อแสดงรายการทั้งหมด
            </p>
            {isFilteredActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                ล้างตัวกรองและแสดงทั้งหมด
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
