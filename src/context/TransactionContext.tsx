import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  Transaction, 
  CafeSettings, 
  MonthlyStats, 
  TransactionType, 
  PaymentMethod,
  FilterOptions
} from '../types';
import { 
  subscribeToTransactions, 
  addTransaction, 
  addMultipleTransactions,
  updateTransaction, 
  deleteTransaction, 
  fetchCafeSettings, 
  saveCafeSettings, 
  DEFAULT_CAFE_SETTINGS 
} from '../services/db';
import { ALL_DEFAULT_CATEGORIES } from '../data/categories';
import { useAuth } from './AuthContext';

interface TransactionContextType {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  selectedMonth: string; // YYYY-MM
  setSelectedMonth: (month: string) => void;
  filter: FilterOptions;
  setFilter: React.Dispatch<React.SetStateAction<FilterOptions>>;
  stats: MonthlyStats;
  settings: CafeSettings;
  updateSettings: (newSettings: Partial<CafeSettings>) => Promise<void>;
  isOnline: boolean;
  pendingSyncCount: number;
  loading: boolean;
  createTransaction: (txData: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  createMultipleTransactions: (txList: Omit<Transaction, 'id' | 'createdAt'>[]) => Promise<Transaction[]>;
  modifyTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  availableMonths: string[];
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<CafeSettings>(DEFAULT_CAFE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Default month: Current Year-Month (e.g., "2026-08")
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  const [filter, setFilter] = useState<FilterOptions>({
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

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Online / Offline monitor
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('เชื่อมต่ออินเทอร์เน็ตแล้ว - ระบบซิงค์ข้อมูลอัตโนมัติ', 'info');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('คุณอยู่ในโหมดออฟไลน์ - บันทึกข้อมูลได้ปกติและจะซิงค์เมื่อออนไลน์', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch initial settings
  useEffect(() => {
    fetchCafeSettings().then((s) => {
      if (s) setSettings(s);
    });
  }, []);

  // Subscribe to real-time transactions & cache
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTransactions(
      (data) => {
        setTransactions(data);
        setLoading(false);
      },
      (error) => {
        console.warn('Subscription error handled:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const pendingSyncCount = useMemo(() => {
    return transactions.filter(t => t.isOfflinePending).length;
  }, [transactions]);

  // Extract available months for switcher (past 12 months + next 6 months + all transaction months + selectedMonth)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    
    // Add current month and selected month
    monthSet.add(currentMonthStr);
    if (selectedMonth) {
      monthSet.add(selectedMonth);
    }
    
    // Add all months from transactions
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        monthSet.add(tx.date.substring(0, 7));
      }
    });

    // Populate past 12 months and future 6 months so user can navigate freely
    const baseDate = new Date();
    for (let i = -12; i <= 6; i++) {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthSet.add(mStr);
    }

    return Array.from(monthSet).sort().reverse();
  }, [transactions, currentMonthStr, selectedMonth]);

  // Calculate monthly stats for the selectedMonth
  const stats: MonthlyStats = useMemo(() => {
    const monthTxs = selectedMonth === 'all'
      ? transactions
      : transactions.filter((t) => t.date && t.date.startsWith(selectedMonth));
    
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const incomeCatMap: { [cat: string]: { amount: number; count: number } } = {};
    const expenseCatMap: { [cat: string]: { amount: number; count: number } } = {};
    const paymentMap: { [m in PaymentMethod]?: { amount: number; count: number } } = {};

    // Get number of days in selected month
    let daysInMonth = 30;
    if (selectedMonth !== 'all') {
      const [yr, mo] = selectedMonth.split('-').map(Number);
      daysInMonth = (yr && mo) ? new Date(yr, mo, 0).getDate() : 30;
    }
    
    // Map daily data
    const dailyMap: { [day: number]: { income: number; expense: number } } = {};
    for (let i = 1; i <= Math.min(daysInMonth, 31); i++) {
      dailyMap[i] = { income: 0, expense: 0 };
    }

    monthTxs.forEach((t) => {
      const amt = Number(t.amount) || 0;
      const dayNum = parseInt(t.date?.split('-')[2] || '1', 10);

      if (t.type === 'income') {
        totalIncome += amt;
        incomeCount++;
        incomeCatMap[t.category] = incomeCatMap[t.category] || { amount: 0, count: 0 };
        incomeCatMap[t.category].amount += amt;
        incomeCatMap[t.category].count += 1;

        if (dailyMap[dayNum]) {
          dailyMap[dayNum].income += amt;
        }
      } else {
        totalExpense += amt;
        expenseCount++;
        expenseCatMap[t.category] = expenseCatMap[t.category] || { amount: 0, count: 0 };
        expenseCatMap[t.category].amount += amt;
        expenseCatMap[t.category].count += 1;

        if (dailyMap[dayNum]) {
          dailyMap[dayNum].expense += amt;
        }
      }

      // Payment method
      const method = t.paymentMethod || 'cash';
      paymentMap[method] = paymentMap[method] || { amount: 0, count: 0 };
      paymentMap[method]!.amount += amt;
      paymentMap[method]!.count += 1;
    });

    const netProfit = totalIncome - totalExpense;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
    const avgDailyIncome = daysInMonth > 0 ? totalIncome / daysInMonth : 0;
    const avgDailyExpense = daysInMonth > 0 ? totalExpense / daysInMonth : 0;

    const dailyData = Object.entries(dailyMap).map(([dayStr, data]) => ({
      day: `${dayStr}`,
      dayNum: Number(dayStr),
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    }));

    // Income categories
    const incomeByCategory = Object.entries(incomeCatMap).map(([cat, val]) => {
      const foundDef = ALL_DEFAULT_CATEGORIES.find(c => c.name === cat);
      return {
        category: cat,
        amount: val.amount,
        count: val.count,
        percentage: totalIncome > 0 ? (val.amount / totalIncome) * 100 : 0,
        color: foundDef?.color || '#6B705C',
      };
    }).sort((a, b) => b.amount - a.amount);

    // Expense categories
    const expenseByCategory = Object.entries(expenseCatMap).map(([cat, val]) => {
      const foundDef = ALL_DEFAULT_CATEGORIES.find(c => c.name === cat);
      return {
        category: cat,
        amount: val.amount,
        count: val.count,
        percentage: totalExpense > 0 ? (val.amount / totalExpense) * 100 : 0,
        color: foundDef?.color || '#BC6C25',
      };
    }).sort((a, b) => b.amount - a.amount);

    const paymentMethodNames: Record<PaymentMethod, string> = {
      cash: 'เงินสด',
      qr_promptpay: 'QR / พร้อมเพย์',
      transfer: 'โอนเงินธนาคาร',
      credit_card: 'บัตรเครดิต',
      other: 'อื่นๆ',
    };

    const paymentMethodStats = (['cash', 'qr_promptpay', 'transfer', 'credit_card', 'other'] as PaymentMethod[]).map(m => ({
      method: m,
      name: paymentMethodNames[m] || m,
      amount: paymentMap[m]?.amount || 0,
      count: paymentMap[m]?.count || 0,
    })).filter(p => p.count > 0);

    return {
      month: selectedMonth,
      totalIncome,
      totalExpense,
      netProfit,
      profitMargin,
      incomeCount,
      expenseCount,
      totalTransactions: monthTxs.length,
      avgDailyIncome,
      avgDailyExpense,
      dailyData,
      incomeByCategory,
      expenseByCategory,
      paymentMethodStats,
    };
  }, [transactions, selectedMonth]);

  // Filtered transactions for list view and search
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Specific Date Range check
      if (filter.startDate && filter.endDate) {
        if (tx.date < filter.startDate || tx.date > filter.endDate) return false;
      } else if (filter.startDate) {
        if (tx.date < filter.startDate) return false;
      } else if (filter.endDate) {
        if (tx.date > filter.endDate) return false;
      } else if (selectedMonth !== 'all') {
        if (!tx.date.startsWith(selectedMonth)) return false;
      }

      // 2. Specific Time Range check
      if (filter.startTime || filter.endTime) {
        const txTime = tx.time || '00:00';
        if (filter.startDate && filter.endDate && filter.startDate === filter.endDate) {
          // Same single day time check
          if (filter.startTime && txTime < filter.startTime) return false;
          if (filter.endTime && txTime > filter.endTime) return false;
        } else if (filter.startDate && tx.date === filter.startDate && filter.startTime) {
          if (txTime < filter.startTime) return false;
        } else if (filter.endDate && tx.date === filter.endDate && filter.endTime) {
          if (txTime > filter.endTime) return false;
        } else if (!filter.startDate && !filter.endDate) {
          // General time slot check across all days
          if (filter.startTime && txTime < filter.startTime) return false;
          if (filter.endTime && txTime > filter.endTime) return false;
        }
      }

      // 3. Type check
      if (filter.type !== 'all' && tx.type !== filter.type) {
        return false;
      }

      // 4. Category check
      if (filter.category !== 'all' && tx.category !== filter.category) {
        return false;
      }

      // 5. Payment method check
      if (filter.paymentMethod !== 'all' && tx.paymentMethod !== filter.paymentMethod) {
        return false;
      }

      // 6. Slip only check
      if (filter.hasSlipOnly && !tx.slipUrl) {
        return false;
      }

      // 7. Search query check
      if (filter.search && filter.search.trim()) {
        const query = filter.search.toLowerCase().trim();
        const matchNote = tx.note?.toLowerCase().includes(query) || false;
        const matchCategory = tx.category.toLowerCase().includes(query);
        const matchVendor = tx.vendorOrCustomer?.toLowerCase().includes(query) || false;
        const matchRef = tx.referenceNumber?.toLowerCase().includes(query) || false;
        const matchAmount = tx.amount.toString().includes(query);
        if (!matchNote && !matchCategory && !matchVendor && !matchRef && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedMonth, filter]);

  const createTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const dataWithUser = {
      ...txData,
      userId: user?.uid || 'anonymous',
      userDisplayName: user?.displayName || 'พนักงานร้าน',
    };
    const created = await addTransaction(dataWithUser);
    
    // Update state immediately
    setTransactions(prev => {
      const merged = [created, ...prev.filter(t => t.id !== created.id)];
      return merged.sort((a, b) => {
        return new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime();
      });
    });

    showToast(`บันทึก${txData.type === 'income' ? 'รายรับ' : 'รายจ่าย'} ฿${txData.amount.toLocaleString()} เรียบร้อยแล้ว`, 'success');
    return created;
  };

  const createMultipleTransactions = async (txList: Omit<Transaction, 'id' | 'createdAt'>[]) => {
    const listWithUser = txList.map(tx => ({
      ...tx,
      userId: user?.uid || 'anonymous',
      userDisplayName: user?.displayName || 'พนักงานร้าน',
    }));
    const created = await addMultipleTransactions(listWithUser);
    
    // Update state immediately so items show up instantly with 0ms lag
    setTransactions(prev => {
      const merged = [...created, ...prev.filter(p => !created.some(c => c.id === p.id))];
      return merged.sort((a, b) => {
        return new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime();
      });
    });

    // Auto-align active view so the imported items are 100% visible on the table right now
    if (created.length > 0) {
      const latestItem = created[0];
      if (latestItem.date && latestItem.date.length >= 7) {
        const itemMonth = latestItem.date.substring(0, 7);
        // If current selectedMonth does not contain any of the newly imported items, switch to this month
        if (selectedMonth !== 'all' && !created.some(t => t.date.startsWith(selectedMonth))) {
          setSelectedMonth(itemMonth);
        }
      }

      // Reset any active search or date restrictions that would filter out the newly imported rows
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
    }

    showToast(`นำเข้าและบันทึกข้อมูลเรียบร้อยแล้วทั้งหมด ${created.length} รายการ`, 'success');
    return created;
  };

  const modifyTransaction = async (id: string, updates: Partial<Transaction>) => {
    await updateTransaction(id, updates);
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t));
    showToast('แก้ไขข้อมูลรายการเรียบร้อยแล้ว', 'success');
  };

  const removeTransaction = async (id: string) => {
    await deleteTransaction(id);
    setTransactions(prev => prev.filter(t => t.id !== id));
    showToast('ลบรายการเรียบร้อยแล้ว', 'info');
  };

  const updateSettings = async (newSettings: Partial<CafeSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveCafeSettings(updated);
    showToast('บันทึกการตั้งค่าร้านเรียบร้อยแล้ว', 'success');
  };

  return (
    <TransactionContext.Provider value={{
      transactions,
      filteredTransactions,
      selectedMonth,
      setSelectedMonth,
      filter,
      setFilter,
      stats,
      settings,
      updateSettings,
      isOnline,
      pendingSyncCount,
      loading,
      createTransaction,
      createMultipleTransactions,
      modifyTransaction,
      removeTransaction,
      availableMonths,
      toast,
      showToast,
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) throw new Error('useTransactions must be used within a TransactionProvider');
  return context;
};
