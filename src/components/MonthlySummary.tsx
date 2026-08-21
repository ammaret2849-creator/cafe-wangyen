import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Percent, 
  Calendar, 
  Receipt, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight,
  Coffee,
  Coins
} from 'lucide-react';
import { MonthlyStats, CafeSettings } from '../types';
import { formatCurrency, formatMonthYearThai } from '../utils/formatters';

interface MonthlySummaryProps {
  stats: MonthlyStats;
  settings: CafeSettings;
  selectedMonth: string;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  stats,
  settings,
  selectedMonth,
}) => {
  const isProfitable = stats.netProfit >= 0;
  const revenueTarget = settings.monthlyRevenueTarget || 150000;
  const targetProgress = revenueTarget > 0 ? Math.min((stats.totalIncome / revenueTarget) * 100, 100) : 0;
  const expenseBudget = settings.monthlyExpenseBudget || 85000;
  const budgetUsage = expenseBudget > 0 ? (stats.totalExpense / expenseBudget) * 100 : 0;

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Month Title & Fast Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/95 border border-stone-200/90 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 flex items-center gap-1.5 leading-tight">
            <span>สรุปผลการดำเนินงาน</span>
            <span className="text-amber-800 font-bold">({formatMonthYearThai(selectedMonth)})</span>
          </h2>
          <p className="text-[11px] text-stone-500 mt-0.5">
            วิเคราะห์รายรับ-รายจ่าย ยอดขายกาแฟ ขนม ต้นทุนวัตถุดิบ และกำไรสุทธิประจำเดือน
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="flex items-center gap-1 rounded-lg bg-stone-100 border border-stone-200 px-2.5 py-1 text-[11px] text-stone-700 font-semibold shadow-2xs">
            <Receipt className="h-3 w-3 text-stone-500" />
            <span>รวม {stats.totalTransactions} รายการ</span>
          </div>
          <div className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
            isProfitable 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {isProfitable ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>อัตรากำไร {stats.profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {stats.totalTransactions === 0 && (
        <div className="flex items-center gap-2.5 rounded-xl border border-stone-200/90 bg-white px-3.5 py-2.5 text-xs text-stone-600 shadow-2xs">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200/70">
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] sm:text-xs">
            ยังไม่มีข้อมูลรายการรับ-จ่ายในเดือน <strong className="text-stone-900 font-bold">{formatMonthYearThai(selectedMonth)}</strong> สามารถกดปุ่ม <strong className="text-emerald-700 font-bold">+ เพิ่มรายรับ</strong> หรือ <strong className="text-rose-700 font-bold">+ เพิ่มรายจ่าย</strong> เพื่อบันทึกข้อมูลได้ทันที
          </p>
        </div>
      )}

      {/* 4 Main KPI Cards: 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {/* Income Card */}
        <div className="relative overflow-hidden rounded-xl bg-white p-3 sm:p-3.5 border border-emerald-100 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              รายรับทั้งหมด
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-extrabold text-emerald-700 tracking-tight leading-tight">
              {formatCurrency(stats.totalIncome, settings.currencySymbol)}
            </div>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-stone-500 gap-0.5">
              <span>{stats.incomeCount} รายการรับ</span>
              <span className="font-semibold text-emerald-800">เฉลี่ย {formatCurrency(stats.avgDailyIncome, settings.currencySymbol)}/วัน</span>
            </div>
          </div>
          {/* Bottom highlight bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
        </div>

        {/* Expense Card */}
        <div className="relative overflow-hidden rounded-xl bg-white p-3 sm:p-3.5 border border-rose-100 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              รายจ่ายทั้งหมด
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
              <TrendingDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="text-lg sm:text-xl font-extrabold text-rose-700 tracking-tight leading-tight">
              {formatCurrency(stats.totalExpense, settings.currencySymbol)}
            </div>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-stone-500 gap-0.5">
              <span>{stats.expenseCount} รายการจ่าย</span>
              <span className="font-semibold text-rose-800">เฉลี่ย {formatCurrency(stats.avgDailyExpense, settings.currencySymbol)}/วัน</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600" />
        </div>

        {/* Net Profit Card */}
        <div className={`relative overflow-hidden rounded-xl text-white p-3 sm:p-3.5 shadow-2xs transition-all hover:shadow-xs ${
          isProfitable ? 'bg-stone-900 border border-stone-800' : 'bg-stone-900 border border-stone-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-300">
              กำไรสุทธิ
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white border border-white/20">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className={`text-lg sm:text-xl font-extrabold tracking-tight leading-tight ${
              isProfitable ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isProfitable ? '+' : ''}{formatCurrency(stats.netProfit, settings.currencySymbol)}
            </div>
            <div className="mt-1 flex flex-col sm:flex-row sm:items-center justify-between text-[10px] sm:text-[11px] text-stone-300 gap-0.5">
              <span>มาร์จิ้น: {stats.profitMargin.toFixed(1)}%</span>
              <span className={isProfitable ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                {isProfitable ? 'กำไร' : 'ขาดทุน'}
              </span>
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${isProfitable ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        </div>

        {/* Target & Budget Performance Card */}
        <div className="relative overflow-hidden rounded-xl bg-white p-3 sm:p-3.5 border border-stone-200/90 shadow-2xs transition-all hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              เป้าหมายยอดขาย
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              <Target className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1.5">
            <div className="flex items-baseline justify-between">
              <div className="text-lg sm:text-xl font-extrabold text-stone-900 leading-tight">
                {targetProgress.toFixed(0)}%
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-stone-500">
                เป้า {formatCurrency(revenueTarget, settings.currencySymbol)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div 
                className="h-full bg-amber-700 rounded-full transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            <div className="mt-1 text-[10px] sm:text-[11px] text-stone-500 flex justify-between">
              <span>งบใช้: {budgetUsage.toFixed(0)}%</span>
              <span className="text-amber-800 font-bold truncate">{targetProgress >= 100 ? '🎉 ถึงเป้า' : `ขาด ${formatCurrency(Math.max(0, revenueTarget - stats.totalIncome), settings.currencySymbol)}`}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-700" />
        </div>
      </div>
    </div>
  );
};
