import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TransactionProvider, useTransactions } from './context/TransactionContext';
import { Navbar } from './components/Navbar';
import { MonthlySummary } from './components/MonthlySummary';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TransactionList } from './components/TransactionList';
import { TransactionFormModal } from './components/TransactionFormModal';
import { PrintModal } from './components/PrintModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { CafeSettingsModal } from './components/CafeSettingsModal';
import { AuthModal } from './components/AuthModal';
import { FileImportModal } from './components/FileImportModal';
import { LoginPage } from './components/LoginPage';
import { Transaction, TransactionType } from './types';
import { Plus, Coffee, Sparkles, CheckCircle2, AlertCircle, Info, RefreshCw, QrCode, Loader2, FileSpreadsheet, Upload, ArrowRight } from 'lucide-react';
import { CollegeLogo } from './components/CollegeLogo';

function CafeDashboard() {
  const { 
    transactions, 
    filteredTransactions, 
    selectedMonth, 
    filter, 
    setFilter, 
    stats, 
    settings, 
    updateSettings, 
    createTransaction, 
    createMultipleTransactions,
    modifyTransaction, 
    removeTransaction,
    toast 
  } = useTransactions();

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDefaultType, setFormDefaultType] = useState<TransactionType>('income');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewingReceipt, setViewingReceipt] = useState<Transaction | null>(null);

  // Check URL hash for direct QR Code receipt scanning (#receipt=tx_123)
  useEffect(() => {
    const handleHashCheck = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#receipt=')) {
        const txId = decodeURIComponent(hash.replace('#receipt=', ''));
        const found = transactions.find(t => t.id === txId);
        if (found) {
          setViewingReceipt(found);
        }
      }
    };

    handleHashCheck();
    window.addEventListener('hashchange', handleHashCheck);
    return () => window.removeEventListener('hashchange', handleHashCheck);
  }, [transactions]);

  const handleOpenAdd = (type: TransactionType) => {
    setEditingTransaction(null);
    setFormDefaultType(type);
    setIsFormOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setFormDefaultType(tx.type);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (editingTransaction) {
      await modifyTransaction(editingTransaction.id, txData);
    } else {
      await createTransaction(txData);
    }
  };

  const handleImportBackup = (importedTxs: Transaction[]) => {
    importedTxs.forEach(t => {
      createTransaction(t);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenAddIncome={() => handleOpenAdd('income')}
        onOpenAddExpense={() => handleOpenAdd('expense')}
        onOpenPrint={() => setIsPrintOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Monthly Summary KPI Cards */}
        <MonthlySummary
          stats={stats}
          settings={settings}
          selectedMonth={selectedMonth}
        />

        {/* Analytics Charts & Visualizations */}
        <AnalyticsCharts
          stats={stats}
          settings={settings}
        />

        {/* Quick Drop & Import Feature Banner */}
        <div 
          onClick={() => setIsImportOpen(true)}
          className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-emerald-300 bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 p-5 sm:p-6 cursor-pointer hover:border-emerald-500 hover:shadow-md transition-all"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900">
                    นำเข้าไฟล์สรุปผลรายรับ-รายจ่ายทันที (Instant Excel & CSV Summarizer)
                  </h4>
                  <span className="hidden sm:inline-flex rounded-full bg-emerald-200/80 text-emerald-900 font-extrabold text-[10px] px-2.5 py-0.5 border border-emerald-300">
                    พร้อมใช้ทันที
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  คลิกที่นี่หรือลากไฟล์ Excel, CSV หรือกดวางข้อความ (Ctrl + V) เพื่อคำนวณยอดกำไร รายรับ-รายจ่าย และกราฟสถิติได้ใน 1 วินาที
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs group-hover:bg-emerald-700 transition-colors whitespace-nowrap"
              >
                <Upload className="h-4 w-4" />
                <span>เปิดระบบนำเข้าไฟล์</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List with Filters & Slip QR Preview */}
        <TransactionList
          transactions={filteredTransactions}
          settings={settings}
          onEdit={handleEdit}
          onDelete={removeTransaction}
          onViewReceipt={(tx) => setViewingReceipt(tx)}
          onAddNew={handleOpenAdd}
          onOpenPrint={() => setIsPrintOpen(true)}
          onOpenImport={() => setIsImportOpen(true)}
          filter={filter}
          setFilter={setFilter}
        />
      </main>

      {/* Clean Modern Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CollegeLogo size={28} customUrl={settings.logoUrl} />
            <span className="font-bold text-slate-800">{settings.cafeName}</span>
            <span>• {settings.cafeBranch || 'วิทยาลัยเทคนิควังน้ำเย็น'}</span>
          </div>
          <div className="text-slate-400">
            <span>ระบบบริหารจัดการรายรับ-รายจ่าย คาเฟ่</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingTransaction}
        defaultType={formDefaultType}
      />

      <PrintModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        transactions={transactions}
        stats={stats}
        settings={settings}
        selectedMonth={selectedMonth}
        initialFilter={filter}
      />

      <ReceiptViewerModal
        transaction={viewingReceipt}
        settings={settings}
        onClose={() => {
          setViewingReceipt(null);
          if (window.location.hash.startsWith('#receipt=')) {
            history.replaceState(null, '', window.location.pathname);
          }
        }}
      />

      <CafeSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={updateSettings}
        transactions={transactions}
        onImportTransactions={handleImportBackup}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      <FileImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={async (items) => {
          await createMultipleTransactions(items);
        }}
        settings={settings}
      />

      {/* Toast Notification Pill */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 text-white border border-slate-700 px-5 py-3 text-xs font-semibold shadow-2xl transition-all">
          {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400" />}
          {toast.type === 'info' && <Info className="h-4 w-4 text-sky-400" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

function MainApp() {
  const { user, loading } = useAuth();
  const { settings } = useTransactions();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl animate-pulse">
          <CollegeLogo size={64} />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          <span>กำลังโหลดข้อมูลระบบคาเฟ่...</span>
        </div>
      </div>
    );
  }

  // If no user is logged in, show the gorgeous Cover Landing Login Page
  if (!user) {
    return (
      <LoginPage 
        cafeName={settings.cafeName}
        cafeBranch={settings.cafeBranch}
        logoUrl={settings.logoUrl}
      />
    );
  }

  // If user is authenticated / in session, show the main cafe dashboard
  return <CafeDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <TransactionProvider>
        <MainApp />
      </TransactionProvider>
    </AuthProvider>
  );
}
