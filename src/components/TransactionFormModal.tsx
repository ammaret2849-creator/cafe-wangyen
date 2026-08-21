import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Trash2, 
  FileText, 
  DollarSign, 
  Calendar, 
  Clock, 
  CreditCard, 
  Building, 
  Check, 
  Sparkles,
  QrCode,
  Eye,
  Coffee,
  Plus,
  Hash,
  ArrowRightLeft,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod } from '../types';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES, QUICK_CAFE_PRESETS } from '../data/categories';
import { compressAndProcessImage } from '../utils/imageHelper';
import { getTodayDateString, getYesterdayDateString, getCurrentTimeString } from '../utils/formatters';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (txData: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  initialData?: Transaction | null;
  defaultType?: TransactionType;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  defaultType = 'income',
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr_promptpay');
  const [vendorOrCustomer, setVendorOrCustomer] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [slipUrl, setSlipUrl] = useState<string>('');
  const [slipThumbnail, setSlipThumbnail] = useState<string>('');
  const [slipFileName, setSlipFileName] = useState<string>('');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [showSlipPreviewModal, setShowSlipPreviewModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategory(initialData.category);
      setDate(initialData.date);
      setTime(initialData.time || getCurrentTimeString());
      setPaymentMethod(initialData.paymentMethod);
      setVendorOrCustomer(initialData.vendorOrCustomer || '');
      setNote(initialData.note || '');
      setReferenceNumber(initialData.referenceNumber || '');
      setSlipUrl(initialData.slipUrl || '');
      setSlipThumbnail(initialData.slipThumbnail || '');
      setSlipFileName(initialData.slipFileName || '');
    } else {
      setType(defaultType);
      setAmount('');
      setCategory(defaultType === 'income' ? DEFAULT_INCOME_CATEGORIES[0].name : DEFAULT_EXPENSE_CATEGORIES[0].name);
      setDate(getTodayDateString());
      setTime(getCurrentTimeString());
      setPaymentMethod(defaultType === 'income' ? 'qr_promptpay' : 'transfer');
      setVendorOrCustomer('');
      setNote('');
      setReferenceNumber('');
      setSlipUrl('');
      setSlipThumbnail('');
      setSlipFileName('');
    }
  }, [initialData, defaultType, isOpen]);

  // When type changes, adjust default category if needed
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newCategories = newType === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;
    // If current category does not belong to new type, select first category of new type
    const existsInNewType = newCategories.some(c => c.name === category);
    if (!existsInNewType) {
      setCategory(newCategories[0].name);
    }
    if (!initialData) {
      setPaymentMethod(newType === 'income' ? 'qr_promptpay' : 'transfer');
    }
  };

  const handleApplyPreset = (preset: typeof QUICK_CAFE_PRESETS[0]) => {
    setType(preset.type);
    setCategory(preset.category);
    setPaymentMethod(preset.paymentMethod);
    if (!note) {
      setNote(preset.label);
    }
  };

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์ภาพเท่านั้น (JPG, PNG, WebP)');
      return;
    }

    try {
      setIsCompressing(true);
      const processed = await compressAndProcessImage(file, 1200, 0.75);
      setSlipUrl(processed.dataUrl);
      setSlipThumbnail(processed.thumbnailUrl);
      setSlipFileName(processed.fileName);
    } catch (err) {
      console.error('Failed to compress image:', err);
      alert('ไม่สามารถประมวลผลไฟล์ภาพได้');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemoveSlip = () => {
    setSlipUrl('');
    setSlipThumbnail('');
    setSlipFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินที่ถูกต้อง (มากกว่า 0 บาท)');
      return;
    }
    if (!category.trim()) {
      alert('กรุณาเลือกหมวดหมู่');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        type,
        amount: numAmount,
        category,
        date,
        time,
        paymentMethod,
        vendorOrCustomer: vendorOrCustomer.trim() || undefined,
        note: note.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        slipUrl: slipUrl || undefined,
        slipThumbnail: slipThumbnail || undefined,
        slipFileName: slipFileName || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Error submitting transaction:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const currentCategories = type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative my-3 sm:my-6 flex max-h-[96vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white border border-stone-200 text-stone-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold ${
              type === 'income' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-sm sm:text-base text-stone-900">
                  {initialData ? 'แก้ไขข้อมูลบันทึกรายการ' : (type === 'income' ? 'บันทึกรายรับคาเฟ่' : 'บันทึกรายจ่ายคาเฟ่')}
                </h2>
                {initialData && (
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-700 border border-stone-300">
                    แก้ไข
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                {type === 'income' 
                  ? 'ยอดขายเครื่องดื่ม เบเกอรี่ สินค้า และบริการ' 
                  : 'ต้นทุนวัตถุดิบ เมล็ดกาแฟ บรรจุภัณฑ์ ค่าเช่า และค่าใช้จ่าย'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 space-y-3.5 flex-1">
          {/* Income / Expense Switcher */}
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
                รายรับ (Income +)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                รายจ่าย (Expense -)
              </button>
            </div>
          </div>

          {/* Quick Cafe Presets */}
          {!initialData && (
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-2 sm:p-2.5">
              <div className="flex items-center gap-1 mb-1.5">
                <Sparkles className="h-3 w-3 text-amber-800" />
                <span className="text-[11px] font-bold text-stone-700">รายการด่วน (Presets)</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {QUICK_CAFE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-lg border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-stone-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount input & Quick buttons */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
              <span>จำนวนเงิน (บาท) <span className="text-rose-600">*</span></span>
              {amount && (
                <span className="text-xs font-bold text-amber-800">
                  = ฿{parseFloat(amount || '0').toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              )}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 text-lg font-bold">
                ฿
              </div>
              <input
                type="number"
                step="any"
                required
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-xl font-extrabold text-stone-900 placeholder-stone-400 focus:border-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-100"
                autoFocus
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {[50, 100, 300, 500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="rounded-lg border border-stone-200 bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700 hover:border-stone-300 hover:bg-white transition-colors cursor-pointer"
                >
                  +{val.toLocaleString()}
                </button>
              ))}
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount('')}
                  className="flex items-center gap-0.5 rounded-lg border border-stone-200 bg-white px-2 py-0.5 text-[11px] text-stone-500 hover:text-rose-600 hover:border-rose-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  ล้าง
                </button>
              )}
            </div>
          </div>

          {/* Category Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-stone-700">
              หมวดหมู่รายการ <span className="text-rose-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {currentCategories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex items-center gap-1.5 rounded-xl p-2 text-left text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'border-amber-800 bg-amber-50 text-amber-950 ring-1 ring-amber-800'
                        : 'border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-300 hover:bg-white'
                    }`}
                  >
                    <span 
                      className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date, Time & Quick Setters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Date Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-stone-400" />
                  วันที่ทำรายการ <span className="text-rose-600">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDate(getTodayDateString())}
                    className="text-[10px] text-amber-800 font-bold hover:underline cursor-pointer"
                  >
                    วันนี้
                  </button>
                  <span className="text-stone-300 text-[10px]">•</span>
                  <button
                    type="button"
                    onClick={() => setDate(getYesterdayDateString())}
                    className="text-[10px] text-stone-500 hover:text-stone-800 cursor-pointer"
                  >
                    เมื่อวาน
                  </button>
                </div>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
              />
            </div>

            {/* Time Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-stone-400" />
                  เวลา (น.)
                </label>
                <button
                  type="button"
                  onClick={() => setTime(getCurrentTimeString())}
                  className="text-[10px] text-amber-800 font-bold hover:underline cursor-pointer"
                >
                  เวลาตอนนี้
                </button>
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Reference Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-stone-400" />
                ช่องทางชำระเงิน <span className="text-rose-600">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-amber-700 focus:outline-none"
              >
                <option value="qr_promptpay">QR Code / พร้อมเพย์</option>
                <option value="transfer">โอนเงินธนาคาร</option>
                <option value="cash">เงินสด (Cash)</option>
                <option value="credit_card">บัตรเครดิต / เดบิต</option>
                <option value="other">ช่องทางอื่นๆ</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <Hash className="h-3 w-3 text-stone-400" />
                เลขที่อ้างอิง / เลขที่บิล
              </label>
              <input
                type="text"
                placeholder="เช่น INC-20260817-001"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:border-amber-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Vendor / Customer & Note Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <Building className="h-3 w-3 text-stone-400" />
                {type === 'expense' ? 'ร้านค้า / ผู้รับเงิน' : 'ลูกค้า / ผู้จ่ายเงิน'}
              </label>
              <input
                type="text"
                placeholder={type === 'expense' ? 'เช่น Makro, กฟน., ร้านกาแฟ' : 'เช่น ลูกค้าหน้าร้าน, บริษัท...'}
                value={vendorOrCustomer}
                onChange={(e) => setVendorOrCustomer(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:border-amber-700 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <FileText className="h-3 w-3 text-stone-400" />
                บันทึกรายละเอียด / หมายเหตุ
              </label>
              <input
                type="text"
                placeholder="เช่น เมล็ดกาแฟ 5 กก., ค่าขนส่ง"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:border-amber-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Attachment: Slip / Receipt Upload Area */}
          <div className="space-y-1.5 pt-1.5 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                <Upload className="h-3 w-3 text-amber-800" />
                แนบสลิป / ใบเสร็จ
              </label>
              <span className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                <QrCode className="h-3 w-3" />
                มี QR Code บนรายงานพิมพ์
              </span>
            </div>

            {slipUrl ? (
              <div className="relative rounded-xl border border-stone-200 bg-stone-50 p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative group cursor-pointer shrink-0" onClick={() => setShowSlipPreviewModal(true)}>
                    <img
                      src={slipThumbnail || slipUrl}
                      alt="Receipt thumbnail"
                      className="h-12 w-12 rounded-xl object-cover border border-stone-200 shadow-2xs group-hover:opacity-90 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity">
                      <Maximize2 className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate max-w-[180px] sm:max-w-xs">
                      {slipFileName || 'สลิปหลักฐาน'}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-0.5">
                      <Check className="h-3 w-3 text-emerald-600" /> แนบไฟล์เรียบร้อยแล้ว
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => setShowSlipPreviewModal(true)}
                    className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3 w-3" />
                    ดูรูป
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Upload className="h-3 w-3 text-amber-800" />
                    เปลี่ยน
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveSlip}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="ลบสลิปออก"
                  >
                    <Trash2 className="h-3 w-3" />
                    ลบ
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed p-3 sm:p-4 text-center transition-all ${
                  dragActive 
                    ? 'border-amber-600 bg-amber-50/50' 
                    : 'border-stone-300 bg-stone-50 hover:border-amber-400 hover:bg-amber-50/30'
                }`}
              >
                {isCompressing ? (
                  <div className="py-2 text-amber-800 text-xs font-bold animate-pulse">
                    กำลังบีบอัดและประมวลผลไฟล์สลิป...
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-200">
                      <Upload className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-stone-800">
                        ลากไฟล์สลิปมาวางที่นี่ หรือคลิกเพื่ออัปโหลด
                      </p>
                      <p className="text-[10px] text-stone-500">
                        รองรับ JPG, PNG, WebP (บีบอัดอัตโนมัติ)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl bg-stone-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer"
                      >
                        เลือกภาพจากเครื่อง
                      </button>
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex items-center gap-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-[11px] font-bold text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Camera className="h-3 w-3 text-amber-800" />
                        ถ่ายภาพ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressing}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all shadow-2xs cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              } disabled:opacity-50`}
            >
              {isSubmitting ? 'กำลังบันทึก...' : (initialData ? 'บันทึกการแก้ไข' : 'บันทึกรายการ')}
            </button>
          </div>
        </form>
      </div>

      {/* Slip Preview Zoom Modal */}
      {showSlipPreviewModal && slipUrl && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs"
          onClick={() => setShowSlipPreviewModal(false)}
        >
          <div 
            className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-4 shadow-2xl border border-stone-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <span className="font-bold text-stone-900 text-sm">
                สลิป / ใบเสร็จหลักฐาน: {slipFileName || 'ภาพที่แนบ'}
              </span>
              <button
                onClick={() => setShowSlipPreviewModal(false)}
                className="rounded-lg p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={slipUrl}
                alt="Receipt Full Preview"
                className="max-h-[70vh] w-auto rounded-lg object-contain shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
