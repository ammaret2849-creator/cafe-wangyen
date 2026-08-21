import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart
} from 'recharts';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  CreditCard, 
  Layers
} from 'lucide-react';
import { MonthlyStats, CafeSettings } from '../types';
import { formatCurrency } from '../utils/formatters';

interface AnalyticsChartsProps {
  stats: MonthlyStats;
  settings: CafeSettings;
}

const MODERN_PALETTE = [
  '#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', 
  '#06B6D4', '#F97316', '#6366F1', '#14B8A6', '#84CC16'
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ stats, settings }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'categories' | 'cost_structure' | 'payments'>('daily');

  // Custom tooltip for daily chart
  const CustomDailyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const net = income - expense;
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl text-xs">
          <div className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">
            วันที่ {label} {stats.month}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-emerald-700">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> รายรับ:
              </span>
              <span className="font-bold">{formatCurrency(income, settings.currencySymbol)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-700">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" /> รายจ่าย:
              </span>
              <span className="font-bold">{formatCurrency(expense, settings.currencySymbol)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-900 border-t border-slate-100 pt-1.5 font-bold">
              <span>กำไรสุทธิ:</span>
              <span className={net >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {net >= 0 ? '+' : ''}{formatCurrency(net, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom pie tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl text-xs">
          <div className="font-bold text-slate-900">{data.name}</div>
          <div className="mt-1 text-indigo-600 font-bold">
            {formatCurrency(data.value, settings.currencySymbol)} ({data.payload.percentage?.toFixed(1)}%)
          </div>
          {data.payload.count && (
            <div className="text-slate-500 text-[11px] mt-0.5">
              จำนวน {data.payload.count} รายการ
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Cost structure breakdown calculations
  const rawMaterialExpense = stats.expenseByCategory
    .filter(c => c.category.includes('เมล็ดกาแฟ') || c.category.includes('วัตถุดิบ'))
    .reduce((sum, c) => sum + c.amount, 0);

  const packagingExpense = stats.expenseByCategory
    .filter(c => c.category.includes('บรรจุภัณฑ์') || c.category.includes('แก้ว'))
    .reduce((sum, c) => sum + c.amount, 0);

  const utilitiesExpense = stats.expenseByCategory
    .filter(c => c.category.includes('น้ำ') || c.category.includes('ไฟ') || c.category.includes('อินเทอร์เน็ต'))
    .reduce((sum, c) => sum + c.amount, 0);

  const rentExpense = stats.expenseByCategory
    .filter(c => c.category.includes('เช่า'))
    .reduce((sum, c) => sum + c.amount, 0);

  const salaryExpense = stats.expenseByCategory
    .filter(c => c.category.includes('เงินเดือน') || c.category.includes('จ้าง') || c.category.includes('พนักงาน'))
    .reduce((sum, c) => sum + c.amount, 0);

  const cogsPercent = stats.totalIncome > 0 ? ((rawMaterialExpense + packagingExpense) / stats.totalIncome) * 100 : 0;
  const overheadPercent = stats.totalIncome > 0 ? ((utilitiesExpense + rentExpense + salaryExpense) / stats.totalIncome) * 100 : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3.5">
      {/* Chart Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm sm:text-base leading-tight">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            กราฟวิเคราะห์รายรับ-รายจ่าย & ประสิทธิภาพคาเฟ่
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            แสดงแนวโน้มยอดขายรายวัน สัดส่วนต้นทุน และช่องทางการชำระเงิน
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="h-3 w-3 text-emerald-600" />
            รายวัน
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              activeTab === 'categories'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="h-3 w-3 text-indigo-600" />
            หมวดหมู่
          </button>
          <button
            onClick={() => setActiveTab('cost_structure')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              activeTab === 'cost_structure'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3 w-3 text-amber-600" />
            โครงสร้างต้นทุน
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold transition-all ${
              activeTab === 'payments'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="h-3 w-3 text-sky-600" />
            วิธีชำระเงิน
          </button>
        </div>
      </div>

      {/* TAB 1: DAILY TREND CHART */}
      {activeTab === 'daily' && (
        <div className="space-y-3">
          <div className="h-[240px] sm:h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={stats.dailyData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#94A3B8" 
                  tick={{ fontSize: 10, fill: '#475569' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  tick={{ fontSize: 10, fill: '#475569' }}
                  tickFormatter={(val) => `฿${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  tickLine={false}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={28} 
                  formatter={(val) => {
                    if (val === 'income') return 'รายรับ (฿)';
                    if (val === 'expense') return 'รายจ่าย (฿)';
                    if (val === 'net') return 'กำไรสุทธิ (฿)';
                    return val;
                  }}
                  wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
                />
                <Bar dataKey="income" name="income" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={16} />
                <Bar dataKey="expense" name="expense" fill="#F43F5E" radius={[3, 3, 0, 0]} maxBarSize={16} />
                <Line type="monotone" dataKey="net" name="net" stroke="#3B82F6" strokeWidth={2} dot={{ r: 2.5, fill: '#3B82F6' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] sm:text-xs bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-200">
            <div className="text-slate-700">
              วันรับสูงสุด: <span className="text-emerald-700 font-bold">
                {(() => {
                  const maxInc = [...stats.dailyData].sort((a, b) => b.income - a.income)[0];
                  return maxInc && maxInc.income > 0 ? `วันที่ ${maxInc.day} (${formatCurrency(maxInc.income, settings.currencySymbol)})` : '-';
                })()}
              </span>
            </div>
            <div className="text-slate-700">
              วันจ่ายสูงสุด: <span className="text-rose-700 font-bold">
                {(() => {
                  const maxExp = [...stats.dailyData].sort((a, b) => b.expense - a.expense)[0];
                  return maxExp && maxExp.expense > 0 ? `วันที่ ${maxExp.day} (${formatCurrency(maxExp.expense, settings.currencySymbol)})` : '-';
                })()}
              </span>
            </div>
            <div className="text-slate-700">
              วันกำไรสูงสุด: <span className="text-indigo-700 font-bold">
                {(() => {
                  const maxNet = [...stats.dailyData].sort((a, b) => b.net - a.net)[0];
                  return maxNet && maxNet.net > 0 ? `วันที่ ${maxNet.day} (${formatCurrency(maxNet.net, settings.currencySymbol)})` : '-';
                })()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORY BREAKDOWN CHARTS */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Income Categories */}
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                สัดส่วนรายรับตามหมวดหมู่
              </h4>
              <span className="text-[11px] font-semibold text-slate-600">
                รวม {formatCurrency(stats.totalIncome, settings.currencySymbol)}
              </span>
            </div>

            {stats.incomeByCategory.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="h-[160px] w-[160px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.incomeByCategory}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {stats.incomeByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={MODERN_PALETTE[index % MODERN_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 w-full text-[11px]">
                  {stats.incomeByCategory.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span 
                          className="h-2 w-2 rounded-full shrink-0" 
                          style={{ backgroundColor: MODERN_PALETTE[idx % MODERN_PALETTE.length] }} 
                        />
                        <span className="text-slate-800 font-medium truncate">{cat.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 mr-1.5">{formatCurrency(cat.amount, settings.currencySymbol)}</span>
                        <span className="text-slate-500 font-medium">({cat.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                ยังไม่มีข้อมูลรายรับในเดือนนี้
              </div>
            )}
          </div>

          {/* Expense Categories */}
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-rose-800 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                สัดส่วนรายจ่ายตามหมวดหมู่
              </h4>
              <span className="text-[11px] font-semibold text-slate-600">
                รวม {formatCurrency(stats.totalExpense, settings.currencySymbol)}
              </span>
            </div>

            {stats.expenseByCategory.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="h-[160px] w-[160px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.expenseByCategory}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                      >
                        {stats.expenseByCategory.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={MODERN_PALETTE[(index + 3) % MODERN_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 w-full text-[11px]">
                  {stats.expenseByCategory.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span 
                          className="h-2 w-2 rounded-full shrink-0" 
                          style={{ backgroundColor: MODERN_PALETTE[(idx + 3) % MODERN_PALETTE.length] }} 
                        />
                        <span className="text-slate-800 font-medium truncate">{cat.category}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 mr-1.5">{formatCurrency(cat.amount, settings.currencySymbol)}</span>
                        <span className="text-slate-500 font-medium">({cat.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                ยังไม่มีข้อมูลรายจ่ายในเดือนนี้
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CAFE COST STRUCTURE & MARGINS */}
      {activeTab === 'cost_structure' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="rounded-lg bg-amber-50/70 p-3 border border-amber-200">
              <div className="text-[11px] font-bold text-amber-800">ต้นทุนวัตถุดิบ (COGS)</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {cogsPercent.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                ยอด: {formatCurrency(rawMaterialExpense + packagingExpense, settings.currencySymbol)}
              </div>
              <div className="mt-1 text-[10px] text-amber-700 font-medium">
                (มาตรฐานคาเฟ่: 30% - 35%)
              </div>
            </div>

            <div className="rounded-lg bg-sky-50/70 p-3 border border-sky-200">
              <div className="text-[11px] font-bold text-sky-800">ค่าดำเนินการ (Overhead)</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                {overheadPercent.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                ยอด: {formatCurrency(utilitiesExpense + rentExpense + salaryExpense, settings.currencySymbol)}
              </div>
              <div className="mt-1 text-[10px] text-sky-700 font-medium">
                (เช่า + น้ำไฟ + แรงงาน)
              </div>
            </div>

            <div className="rounded-lg bg-emerald-50/70 p-3 border border-emerald-200">
              <div className="text-[11px] font-bold text-emerald-800">กำไรสุทธิ (Net Margin)</div>
              <div className={`text-xl font-extrabold mt-0.5 ${stats.profitMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stats.profitMargin.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-600 mt-0.5">
                กำไร: {formatCurrency(stats.netProfit, settings.currencySymbol)}
              </div>
              <div className="mt-1 text-[10px] text-emerald-700 font-medium">
                (หลังหักค่าใช้จ่ายทั้งหมด)
              </div>
            </div>
          </div>

          {/* Breakdown progress meter */}
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              สัดส่วนการกระจายตัวของรายรับ (Revenue Distribution)
            </h4>
            <div className="h-5 w-full overflow-hidden rounded-lg bg-slate-200 flex">
              {cogsPercent > 0 && (
                <div 
                  style={{ width: `${Math.min(cogsPercent, 100)}%` }} 
                  className="bg-amber-500 h-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden px-1"
                  title={`วัตถุดิบ & แก้ว ${cogsPercent.toFixed(1)}%`}
                >
                  COGS {cogsPercent.toFixed(0)}%
                </div>
              )}
              {overheadPercent > 0 && (
                <div 
                  style={{ width: `${Math.min(overheadPercent, 100 - cogsPercent)}%` }} 
                  className="bg-sky-500 h-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden px-1"
                  title={`ค่าดำเนินงาน ${overheadPercent.toFixed(1)}%`}
                >
                  Overhead {overheadPercent.toFixed(0)}%
                </div>
              )}
              {stats.profitMargin > 0 && (
                <div 
                  style={{ width: `${Math.min(stats.profitMargin, 100 - cogsPercent - overheadPercent)}%` }} 
                  className="bg-emerald-600 h-full flex items-center justify-center text-[9px] font-bold text-white overflow-hidden px-1"
                  title={`กำไรสุทธิ ${stats.profitMargin.toFixed(1)}%`}
                >
                  Profit {stats.profitMargin.toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT METHODS */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.paymentMethodStats}
                margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 10, fill: '#475569' }} tickLine={false} />
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => `฿${v >= 1000 ? (v/1000).toFixed(0) + 'k' : v}`} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value), settings.currencySymbol), 'ยอดเงินรวม']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#E2E8F0', borderRadius: '8px', fontSize: '11px', color: '#0F172A' }}
                />
                <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              รายละเอียดแต่ละช่องทางชำระเงิน
            </h4>
            {stats.paymentMethodStats.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="font-bold text-slate-800 text-xs">{p.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-slate-900 text-xs">{formatCurrency(p.amount, settings.currencySymbol)}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{p.count} รายการ</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
