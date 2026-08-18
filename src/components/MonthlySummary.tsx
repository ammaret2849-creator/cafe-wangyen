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
    <div className="space-y-4">
      {/* Month Title & Fast Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 px-5 py-4 rounded-2xl shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>สรุปผลการดำเนินงาน</span>
            <span className="text-indigo-600 font-bold text-lg">({formatMonthYearThai(selectedMonth)})</span>
          </h2>
          <p className="text-xs text-slate-500">
            วิเคราะห์รายรับ-รายจ่าย ยอดขายกาแฟ ขนม ต้นทุนวัตถุดิบ และกำไรสุทธิประจำเดือน
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 font-semibold shadow-2xs">
            <Receipt className="h-3.5 w-3.5 text-slate-500" />
            <span>รวม {stats.totalTransactions} รายการ</span>
          </div>
          <div className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold ${
            isProfitable 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {isProfitable ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            <span>อัตรากำไร {stats.profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {stats.totalTransactions === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
            <Calendar className="h-4 w-4" />
          </div>
          <p>
            ยังไม่มีข้อมูลรายการรับ-จ่ายในเดือน <strong className="text-slate-900 font-bold">{formatMonthYearThai(selectedMonth)}</strong> ท่านสามารถกดปุ่ม <strong className="text-emerald-600 font-bold">+ เพิ่มรายรับ</strong> หรือ <strong className="text-rose-600 font-bold">+ เพิ่มรายจ่าย</strong> ด้านบนเพื่อเริ่มบันทึกข้อมูลของเดือนนี้ได้ทันที
          </p>
        </div>
      )}

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-emerald-100 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              รายรับทั้งหมด
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-emerald-600 tracking-tight">
              {formatCurrency(stats.totalIncome, settings.currencySymbol)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{stats.incomeCount} รายการรับ</span>
              <span className="font-semibold text-emerald-700">เฉลี่ย {formatCurrency(stats.avgDailyIncome, settings.currencySymbol)}/วัน</span>
            </div>
          </div>
          {/* Bottom highlight bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Expense Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-rose-100 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              รายจ่ายทั้งหมด
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700 border border-rose-200">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-extrabold text-rose-600 tracking-tight">
              {formatCurrency(stats.totalExpense, settings.currencySymbol)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{stats.expenseCount} รายการจ่าย</span>
              <span className="font-semibold text-rose-700">เฉลี่ย {formatCurrency(stats.avgDailyExpense, settings.currencySymbol)}/วัน</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Net Profit Card */}
        <div className={`relative overflow-hidden rounded-2xl text-white p-5 shadow-xs transition-all hover:shadow-md ${
          isProfitable ? 'bg-slate-900 border border-slate-800' : 'bg-rose-900 border border-rose-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              กำไรสุทธิ (Net Profit)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white border border-white/20">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${
              isProfitable ? 'text-emerald-400' : 'text-rose-300'
            }`}>
              {isProfitable ? '+' : ''}{formatCurrency(stats.netProfit, settings.currencySymbol)}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-300">
              <span>มาร์จิ้น: {stats.profitMargin.toFixed(1)}%</span>
              <span className={isProfitable ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                {isProfitable ? 'ผลประกอบการเป็นบวก' : 'ขาดทุน'}
              </span>
            </div>
          </div>
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${isProfitable ? 'bg-emerald-400' : 'bg-rose-400'}`} />
        </div>

        {/* Target & Budget Performance Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
              เป้าหมายยอดขาย
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl lg:text-3xl font-extrabold text-slate-900">
                {targetProgress.toFixed(0)}%
              </div>
              <span className="text-xs font-medium text-slate-500">
                เป้า {formatCurrency(revenueTarget, settings.currencySymbol)}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${targetProgress}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
              <span>งบจ่ายใช้ไป: {budgetUsage.toFixed(0)}%</span>
              <span className="text-indigo-600 font-bold">{targetProgress >= 100 ? '🎉 ทะลุเป้าหมาย' : `ขาดอีก ${formatCurrency(Math.max(0, revenueTarget - stats.totalIncome), settings.currencySymbol)}`}</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600" />
        </div>
      </div>
    </div>
  );
};
