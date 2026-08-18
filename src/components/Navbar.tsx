import React from 'react';
import { 
  Coffee, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Printer, 
  Plus, 
  DollarSign, 
  Settings, 
  User, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  Sparkles,
  FileSpreadsheet,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../context/TransactionContext';
import { formatMonthYearThai } from '../utils/formatters';
import { CollegeLogo } from './CollegeLogo';

interface NavbarProps {
  onOpenAddIncome: () => void;
  onOpenAddExpense: () => void;
  onOpenPrint: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenImport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddIncome,
  onOpenAddExpense,
  onOpenPrint,
  onOpenSettings,
  onOpenAuth,
  onOpenImport,
}) => {
  const { user } = useAuth();
  const { 
    selectedMonth, 
    setSelectedMonth, 
    availableMonths, 
    settings, 
    isOnline, 
    pendingSyncCount 
  } = useTransactions();

  // Navigate months
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    const newMonthStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const next = new Date(y, m, 1);
    const newMonthStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Left: Brand Identity with Official College Logo */}
        <div className="flex items-center gap-3">
          <div 
            onClick={onOpenSettings} 
            className="cursor-pointer transition-transform hover:scale-105"
            title="ตราสัญลักษณ์ วิทยาลัยเทคนิควังน้ำเย็น (คลิกเพื่อดูการตั้งค่า)"
          >
            <CollegeLogo size={46} customUrl={settings.logoUrl} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
                {settings.cafeName}
              </h1>
              {settings.cafeBranch && (
                <span className="hidden sm:inline-block rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                  {settings.cafeBranch}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-medium text-slate-600">ระบบสรุปรายรับ-รายจ่าย</span>
              {pendingSyncCount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <WifiOff className="h-3 w-3" />
                    <span>รอซิงค์ {pendingSyncCount} รายการ</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Month Selector */}
        <div className="hidden md:flex items-center gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={handlePrevMonth}
            className="rounded-xl p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors shadow-2xs"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 text-xs font-bold text-slate-800">
            <Calendar className="h-3.5 w-3.5 text-indigo-600" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white text-slate-900 font-bold">
                📅 แสดงข้อมูลทุกเดือน (ทั้งหมด)
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-white text-slate-900">
                  {formatMonthYearThai(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="rounded-xl p-1.5 text-slate-600 hover:bg-white hover:text-slate-900 transition-colors shadow-2xs"
            title="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Actions (Print, Import, Add buttons, Profile) */}
        <div className="flex items-center gap-2">
          {/* Import / Paste File Instant Summarizer */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 transition-colors shadow-2xs"
            title="นำเข้าไฟล์ Excel / CSV หรือวางข้อความเพื่อสรุปผลทันที"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span className="hidden md:inline">นำเข้า & สรุปผล</span>
            <span className="md:hidden">นำเข้า</span>
          </button>

          {/* Print Button */}
          <button
            onClick={onOpenPrint}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
            title="สั่งพิมพ์รายงาน & ใบสลิป QR Code"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>

          {/* Quick Add Income */}
          <button
            onClick={onOpenAddIncome}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">เพิ่มรายรับ</span>
            <span className="sm:hidden">+รับ</span>
          </button>

          {/* Quick Add Expense */}
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">เพิ่มรายจ่าย</span>
            <span className="sm:hidden">-จ่าย</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="rounded-xl p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-colors border border-slate-200"
            title="ตั้งค่าร้านคาเฟ่ & สำรองข้อมูล"
          >
            <Settings className="h-5 w-5" />
          </button>

          {/* User Profile / Auth */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/90 pl-1.5 pr-2.5 py-1.5 hover:bg-slate-200/90 transition-all shadow-2xs"
            title="บัญชีผู้ใช้งาน / เข้าสู่ระบบ"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="h-7 w-7 rounded-lg object-cover border border-slate-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs shadow-2xs">
                {user ? user.displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>
            )}
            {user ? (
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 truncate max-w-[100px] leading-tight">
                  {user.displayName.split(' ')[0]}
                </span>
                <span className="text-[10px] text-indigo-600 font-semibold leading-none">
                  {user.role === 'owner' ? 'เจ้าของร้าน' : user.role === 'manager' ? 'ผู้จัดการ' : 'บาริสต้า'}
                </span>
              </div>
            ) : (
              <span className="hidden sm:inline text-xs font-bold text-slate-700">
                เข้าสู่ระบบ
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Month Switcher bar */}
      <div className="flex md:hidden items-center justify-between border-t border-slate-200 px-4 py-2 bg-slate-50 text-xs">
        <button
          onClick={handlePrevMonth}
          className="p-1 text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
          <Calendar className="h-3.5 w-3.5 text-indigo-600" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-slate-900 font-bold focus:outline-none"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-white text-slate-900">
                {formatMonthYearThai(m)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1 text-slate-600 hover:text-slate-900"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
