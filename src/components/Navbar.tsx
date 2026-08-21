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
    <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-white/95 backdrop-blur-md shadow-2xs">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-5 sm:py-2.5">
        {/* Left: Brand Identity with Official College Logo */}
        <div className="flex items-center gap-2.5">
          <div 
            onClick={onOpenSettings} 
            className="cursor-pointer transition-transform hover:scale-105"
            title="ตราสัญลักษณ์ วิทยาลัยเทคนิควังน้ำเย็น (คลิกเพื่อดูการตั้งค่า)"
          >
            <CollegeLogo size={36} customUrl={settings.logoUrl} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm sm:text-base tracking-tight text-stone-900 leading-tight">
                {settings.cafeName}
              </h1>
              {settings.cafeBranch && settings.cafeBranch !== settings.cafeName && (
                <span className="hidden sm:inline-block rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200/90">
                  {settings.cafeBranch}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <span className="font-medium text-stone-600">ระบบบันทึกและสรุปรายรับรายจ่าย</span>
              {pendingSyncCount > 0 && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className="flex items-center gap-1 text-[10px] text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                    <WifiOff className="h-2.5 w-2.5" />
                    <span>รอซิงค์ {pendingSyncCount}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Center: Month Selector */}
        <div className="hidden md:flex items-center gap-0.5 rounded-xl bg-stone-100 p-0.5 border border-stone-200">
          <button
            onClick={handlePrevMonth}
            className="rounded-lg p-1 text-stone-600 hover:bg-white hover:text-stone-900 transition-colors"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-bold text-stone-800">
            <Calendar className="h-3 w-3 text-amber-700" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-stone-900 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-white text-stone-900 font-bold">
                📅 แสดงข้อมูลทุกเดือน (ทั้งหมด)
              </option>
              {availableMonths.map((m) => (
                <option key={m} value={m} className="bg-white text-stone-900">
                  {formatMonthYearThai(m)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleNextMonth}
            className="rounded-lg p-1 text-stone-600 hover:bg-white hover:text-stone-900 transition-colors"
            title="เดือนถัดไป"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: Actions (Print, Import, Add buttons, Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Import / Paste File Instant Summarizer */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1 rounded-lg border border-emerald-300/80 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 transition-colors shadow-2xs"
            title="นำเข้าไฟล์ Excel / CSV หรือวางข้อความเพื่อสรุปผลทันที"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden md:inline">นำเข้า & สรุปผล</span>
            <span className="md:hidden">นำเข้า</span>
          </button>

          {/* Print Button */}
          <button
            onClick={onOpenPrint}
            className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors shadow-2xs"
            title="สั่งพิมพ์รายงาน & ใบสลิป QR Code"
          >
            <Printer className="h-3.5 w-3.5 text-stone-600" />
            <span className="hidden sm:inline">พิมพ์รายงาน</span>
          </button>

          {/* Quick Add Income */}
          <button
            onClick={onOpenAddIncome}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">เพิ่มรายรับ</span>
            <span className="sm:hidden">+รับ</span>
          </button>

          {/* Quick Add Expense */}
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">เพิ่มรายจ่าย</span>
            <span className="sm:hidden">-จ่าย</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-1.5 text-stone-600 bg-stone-100 hover:bg-stone-200 hover:text-stone-900 transition-colors border border-stone-200"
            title="ตั้งค่าร้านคาเฟ่ & สำรองข้อมูล"
          >
            <Settings className="h-4 w-4" />
          </button>

          {/* User Profile / Auth */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-100/90 pl-1 pr-2 py-1 hover:bg-stone-200/90 transition-all shadow-2xs"
            title="บัญชีผู้ใช้งาน / เข้าสู่ระบบ"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="h-6 w-6 rounded-md object-cover border border-stone-300"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-900 text-white font-bold text-[11px] shadow-2xs">
                {user ? user.displayName.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
              </div>
            )}
            {user ? (
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-stone-800 truncate max-w-[85px] leading-tight">
                  {user.displayName.split(' ')[0]}
                </span>
                <span className="text-[9px] text-amber-800 font-semibold leading-none">
                  {user.role === 'owner' ? 'เจ้าของ' : user.role === 'manager' ? 'ผู้จัดการ' : 'บาริสต้า'}
                </span>
              </div>
            ) : (
              <span className="hidden sm:inline text-xs font-bold text-stone-700">
                เข้าสู่ระบบ
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Month Switcher bar */}
      <div className="flex md:hidden items-center justify-between border-t border-stone-200 px-3 py-1.5 bg-stone-50 text-xs">
        <button
          onClick={handlePrevMonth}
          className="p-1 text-stone-600 hover:text-stone-900"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-1.5 text-stone-800 font-bold">
          <Calendar className="h-3 w-3 text-amber-700" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-stone-900 font-bold focus:outline-none text-xs"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m} className="bg-white text-stone-900">
                {formatMonthYearThai(m)}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1 text-stone-600 hover:text-stone-900"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};
