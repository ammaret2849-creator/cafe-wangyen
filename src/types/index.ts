export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'transfer' | 'credit_card' | 'qr_promptpay' | 'other';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  categoryId?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  paymentMethod: PaymentMethod;
  note?: string;
  vendorOrCustomer?: string;
  slipUrl?: string; // Base64 data URL or storage URL
  slipThumbnail?: string;
  slipFileName?: string;
  userId?: string;
  userDisplayName?: string;
  createdAt: number; // timestamp
  updatedAt?: number;
  isOfflinePending?: boolean;
  tags?: string[];
  referenceNumber?: string; // e.g. EXP-20260817-001
}

export interface CafeUserProfile {
  uid: string;
  displayName: string;
  email?: string;
  phoneNumber?: string;
  role: 'owner' | 'manager' | 'barista' | 'staff';
  photoURL?: string;
  createdAt: number;
}

export interface CafeSettings {
  cafeName: string;
  cafeBranch?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  currencySymbol: string;
  logoUrl?: string;
  monthlyExpenseBudget?: number;
  monthlyRevenueTarget?: number;
  customCategories?: Category[];
  printSlipQrBaseUrl?: string;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  incomeCount: number;
  expenseCount: number;
  totalTransactions: number;
  avgDailyIncome: number;
  avgDailyExpense: number;
  dailyData: {
    day: string; // DD or YYYY-MM-DD
    dayNum: number;
    income: number;
    expense: number;
    net: number;
  }[];
  incomeByCategory: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
    color: string;
  }[];
  expenseByCategory: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
    color: string;
  }[];
  paymentMethodStats: {
    method: PaymentMethod;
    name: string;
    amount: number;
    count: number;
  }[];
}

export interface FilterOptions {
  search: string;
  type: 'all' | TransactionType;
  category: string;
  paymentMethod: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  hasSlipOnly?: boolean;
  datePreset?: 'all' | 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'this_month' | 'last_month' | 'custom';
}

export interface StaffAccount {
  id: string;
  name: string;
  phoneNumber: string;
  password?: string;
  role: 'owner' | 'manager' | 'barista';
  description?: string;
  avatarUrl?: string;
  createdAt: number;
  updatedAt?: number;
}

