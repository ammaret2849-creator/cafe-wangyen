import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, CheckCircle2, QrCode, Calendar, Tag, CreditCard, Building } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Transaction, CafeSettings } from '../types';
import { formatCurrency, formatDateThai } from '../utils/formatters';
import { getReceiptQrUrl } from '../utils/imageHelper';

interface ReceiptViewerModalProps {
  transaction: Transaction | null;
  settings: CafeSettings;
  onClose: () => void;
}

export const ReceiptViewerModal: React.FC<ReceiptViewerModalProps> = ({
  transaction,
  settings,
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showQrDetails, setShowQrDetails] = useState(false);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [transaction]);

  if (!transaction) return null;

  const qrUrl = getReceiptQrUrl(transaction.id);

  const handleDownload = () => {
    if (!transaction.slipUrl) return;
    const a = document.createElement('a');
    a.href = transaction.slipUrl;
    a.download = `receipt_${transaction.referenceNumber || transaction.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs transition-opacity">
      <div 
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">
                  สลิปหลักฐาน / ใบเสร็จรับเงิน
                </h3>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                  ตรวจสอบแล้ว
                </span>
              </div>
              <p className="text-xs text-slate-500">
                เลขที่อ้างอิง: {transaction.referenceNumber || transaction.id} • {settings.cafeName}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQrDetails(!showQrDetails)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                showQrDetails 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="ดู QR Code สำหรับสแกน"
            >
              <QrCode className="h-4 w-4" />
              <span>QR Code</span>
            </button>

            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="ซูมเข้า"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="ซูมออก"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="หมุนภาพ"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            {transaction.slipUrl && (
              <button
                onClick={handleDownload}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="ดาวน์โหลดรูปภาพ"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="ปิดหน้าต่าง"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="grid grid-cols-1 md:grid-cols-3 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Left/Center: Image Viewport */}
          <div className="relative col-span-1 md:col-span-2 flex min-h-[350px] md:min-h-[480px] items-center justify-center overflow-hidden bg-slate-100 p-6 border-b md:border-b-0 md:border-r border-slate-200">
            {transaction.slipUrl ? (
              <div 
                className="transition-transform duration-200 ease-out flex items-center justify-center"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
              >
                <img
                  src={transaction.slipUrl}
                  alt="Receipt slip"
                  className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                <Tag className="h-12 w-12 mb-3 text-slate-300" />
                <p className="text-sm font-semibold">ไม่มีไฟล์ภาพสลิปที่แนบไว้สำหรับรายการนี้</p>
              </div>
            )}

            {/* Quick zoom badge */}
            {zoom !== 1 && (
              <div className="absolute bottom-4 left-4 rounded-md bg-white px-2 py-1 text-xs text-slate-700 font-bold border border-slate-200 shadow-xs">
                {Math.round(zoom * 100)}%
              </div>
            )}
          </div>

          {/* Right: Transaction Details & QR Code info */}
          <div className="col-span-1 p-6 flex flex-col justify-between bg-white">
            <div className="space-y-5">
              {/* Amount & Type */}
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">
                  {transaction.type === 'income' ? 'ยอดรายรับ' : 'ยอดรายจ่าย'}
                </span>
                <div className={`text-2xl font-extrabold mt-1 ${
                  transaction.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, settings.currencySymbol)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  หมวดหมู่: <span className="text-slate-900 font-bold">{transaction.category}</span>
                </div>
              </div>

              {/* Meta details */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">วันที่ทำรายการ</div>
                    <div className="text-slate-900 font-bold">
                      {formatDateThai(transaction.date, transaction.time)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs text-slate-500 font-semibold">วิธีการชำระเงิน</div>
                    <div className="text-slate-900 font-bold">
                      {transaction.paymentMethod === 'cash' && 'เงินสด'}
                      {transaction.paymentMethod === 'qr_promptpay' && 'QR พร้อมเพย์'}
                      {transaction.paymentMethod === 'transfer' && 'โอนเงินธนาคาร'}
                      {transaction.paymentMethod === 'credit_card' && 'บัตรเครดิต'}
                      {transaction.paymentMethod === 'other' && 'อื่นๆ'}
                    </div>
                  </div>
                </div>

                {transaction.vendorOrCustomer && (
                  <div className="flex items-start gap-3">
                    <Building className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs text-slate-500 font-semibold">คู่ค้า / ร้านค้า / ลูกค้า</div>
                      <div className="text-slate-900 font-bold">
                        {transaction.vendorOrCustomer}
                      </div>
                    </div>
                  </div>
                )}

                {transaction.note && (
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 text-xs text-slate-800">
                    <span className="text-slate-500 font-bold block mb-1">บันทึกเพิ่มเติม:</span>
                    {transaction.note}
                  </div>
                )}
              </div>

              {/* QR Code Scannable Section */}
              <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <QrCode className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900">
                    QR Code ตรวจสอบสลิปต้นฉบับ
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs shrink-0">
                    <QRCodeSVG
                      value={qrUrl}
                      size={70}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed font-medium">
                    เมื่อสั่งพิมพ์รายงาน ระบบจะพิมพ์ QR Code นี้แทน เพื่อให้ผู้ตรวจสอบสามารถใช้มือถือสแกนเปิดดูภาพสลิปจริงได้ทันที
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom note */}
            <div className="pt-4 mt-4 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>บันทึกโดย: {transaction.userDisplayName || 'ผู้ใช้งาน'}</span>
              <span className="font-semibold text-emerald-600">สถานะ: คลาวด์ Firebase</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
