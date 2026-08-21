import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Coffee, 
  Building, 
  Phone, 
  FileText, 
  Target, 
  Download, 
  Upload, 
  RefreshCw, 
  Check, 
  Database,
  Shield,
  Image as ImageIcon
} from 'lucide-react';
import { CafeSettings, Transaction } from '../types';
import { seedInitialCafeData } from '../services/db';
import { CollegeLogo } from './CollegeLogo';
import { compressImage } from '../utils/imageHelper';

interface CafeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CafeSettings;
  onSaveSettings: (settings: Partial<CafeSettings>) => Promise<void>;
  transactions: Transaction[];
  onImportTransactions: (txs: Transaction[]) => void;
  onOpenAuth?: () => void;
}

export const CafeSettingsModal: React.FC<CafeSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  transactions,
  onImportTransactions,
  onOpenAuth,
}) => {
  const [cafeName, setCafeName] = useState(settings.cafeName);
  const [cafeBranch, setCafeBranch] = useState(settings.cafeBranch || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [address, setAddress] = useState(settings.address || '');
  const [taxId, setTaxId] = useState(settings.taxId || '');
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [monthlyRevenueTarget, setMonthlyRevenueTarget] = useState(settings.monthlyRevenueTarget?.toString() || '150000');
  const [monthlyExpenseBudget, setMonthlyExpenseBudget] = useState(settings.monthlyExpenseBudget?.toString() || '85000');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, 400, 0.85);
      setLogoUrl(compressed);
    } catch (err) {
      console.error('Failed to process custom logo image:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveSettings({
        cafeName: cafeName.trim(),
        cafeBranch: cafeBranch.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        taxId: taxId.trim() || undefined,
        logoUrl: logoUrl.trim() || undefined,
        monthlyRevenueTarget: parseFloat(monthlyRevenueTarget) || 150000,
        monthlyExpenseBudget: parseFloat(monthlyExpenseBudget) || 85000,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save cafe settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      firebaseProjectId: 'cafe-cd',
      settings,
      transactions,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cafe_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          onImportTransactions(parsed.transactions);
          alert(`กู้คืนข้อมูลสำเร็จ ${parsed.transactions.length} รายการ`);
          onClose();
        } else {
          alert('รูปแบบไฟล์ข้อมูลสำรองไม่ถูกต้อง');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
      <div 
        className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white border border-stone-200 text-stone-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900">
                ตั้งค่าร้านคาเฟ่ & ฐานข้อมูล
              </h3>
              <p className="text-xs text-stone-500">
                จัดการข้อมูลร้านและสำรองข้อมูล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {/* Cafe General Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Building className="h-4 w-4 text-amber-800" /> ข้อมูลร้านกาแฟ & ตราสัญลักษณ์ (สำหรับหัวรายงานพิมพ์)
            </h4>

            {/* College Logo Preview and Custom Logo Selector */}
            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
              <div className="shrink-0 p-1 bg-white rounded-full shadow-xs border border-stone-200">
                <CollegeLogo size={56} customUrl={logoUrl} />
              </div>
              <div className="flex-1 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">ตราสัญลักษณ์วิทยาลัย</span>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                    >
                      ใช้ตราสัญลักษณ์เริ่มต้น (Vector)
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-500">
                  ตราประจำวิทยาลัยเทคนิควังน้ำเย็น แสดงบนหัวเว็บและเอกสารสั่งพิมพ์รายงาน
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-stone-700 border border-stone-300 hover:bg-stone-50 transition-colors shadow-2xs">
                    <ImageIcon className="h-3.5 w-3.5 text-amber-800" />
                    <span>อัปโหลดภาพตราใหม่</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-700">
                  ชื่อร้านคาเฟ่ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cafeName}
                  onChange={(e) => setCafeName(e.target.value)}
                  placeholder="เช่น Slow & Pour Cafe"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  สาขา
                </label>
                <input
                  type="text"
                  value={cafeBranch}
                  onChange={(e) => setCafeBranch(e.target.value)}
                  placeholder="เช่น สาขาหลัก / สาขา 1"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  เบอร์โทรศัพท์ติดต่อ
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-700">
                  ที่อยู่ร้าน
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="ที่อยู่ร้านสำหรับระบุในเอกสารพิมพ์"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-stone-700">
                  เลขประจำตัวผู้เสียภาษี (Tax ID)
                </label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="เช่น 0105559012345 (ถ้ามี)"
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Financial Targets */}
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-800" /> เป้าหมายทางการเงินประจำเดือน
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  เป้าหมายยอดขายต่อเดือน (฿)
                </label>
                <input
                  type="number"
                  value={monthlyRevenueTarget}
                  onChange={(e) => setMonthlyRevenueTarget(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">
                  งบประมาณรายจ่ายต่อเดือน (฿)
                </label>
                <input
                  type="number"
                  value={monthlyExpenseBudget}
                  onChange={(e) => setMonthlyExpenseBudget(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Backup & Restore Section */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <Database className="h-4 w-4 text-amber-800" /> สำรองข้อมูลและกู้คืน (Backup & Restore)
            </h4>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="h-4 w-4 text-amber-800" />
                สำรองข้อมูลทั้งหมด (JSON)
              </button>

              <label className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer shadow-2xs">
                <Upload className="h-4 w-4 text-stone-500" />
                นำเข้าข้อมูลสำรอง (JSON)
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Staff Accounts Management Link for Admin */}
          {onOpenAuth && (
            <div className="space-y-2 pt-4 border-t border-stone-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-800" /> จัดการตำแหน่งและสิทธิ์ผู้ใช้งาน (Staff Accounts)
              </h4>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200">
                <div className="text-xs text-stone-600">
                  <p className="font-bold text-stone-800">จัดการรายชื่อตำแหน่ง, เบอร์โทร และสิทธิ์การเข้าถึง</p>
                  <p className="text-[11px] text-stone-500">สลับบัญชีด่วน, แก้ไขรหัสผ่าน หรือเพิ่ม/ลบตำแหน่งพนักงาน</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="shrink-0 ml-3 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>จัดการสิทธิ์พนักงาน</span>
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-stone-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-stone-800 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
