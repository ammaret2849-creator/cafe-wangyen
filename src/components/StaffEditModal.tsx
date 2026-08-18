import React, { useState, useEffect } from 'react';
import { StaffAccount } from '../types';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  User, 
  Phone, 
  Lock, 
  ShieldCheck, 
  Briefcase, 
  Coffee, 
  Trash2, 
  Save, 
  Plus, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface StaffEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffToEdit: StaffAccount | null; // null means adding a new staff
  onSaved?: () => void;
}

export const StaffEditModal: React.FC<StaffEditModalProps> = ({
  isOpen,
  onClose,
  staffToEdit,
  onSaved
}) => {
  const { saveStaff, removeStaff } = useAuth();
  
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'manager' | 'barista'>('barista');
  const [description, setDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (staffToEdit) {
      setName(staffToEdit.name || '');
      setPhoneNumber(staffToEdit.phoneNumber || '');
      setPassword(staffToEdit.password || '1234');
      setRole(staffToEdit.role || 'barista');
      setDescription(staffToEdit.description || '');
    } else {
      setName('');
      setPhoneNumber('');
      setPassword('1234');
      setRole('barista');
      setDescription('');
    }
    setIsDeleting(false);
    setError('');
  }, [staffToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('กรุณาระบุชื่อพนักงาน/ผู้ใช้งาน');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('กรุณาระบุเบอร์โทรศัพท์');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const defaultDesc = 
        role === 'owner' 
          ? 'เจ้าของร้าน • สิทธิ์เต็มระบบ' 
          : role === 'manager' 
            ? 'ผู้จัดการร้าน • จัดการข้อมูล & รายงาน' 
            : 'บาริสต้า / แคชเชียร์ • บันทึกรับ-จ่ายหน้าร้าน';

      const account: StaffAccount = {
        id: staffToEdit ? staffToEdit.id : ('staff_' + phoneNumber.replace(/\D/g, '') + '_' + Date.now()),
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password.trim() || '1234',
        role,
        description: description.trim() || defaultDesc,
        createdAt: staffToEdit ? staffToEdit.createdAt : Date.now(),
        updatedAt: Date.now(),
      };

      await saveStaff(account);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!staffToEdit) return;
    setSaving(true);
    try {
      await removeStaff(staffToEdit.id);
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setSaving(false);
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              {role === 'owner' ? <ShieldCheck className="h-5 w-5 text-amber-400" /> : role === 'manager' ? <Briefcase className="h-5 w-5 text-indigo-300" /> : <Coffee className="h-5 w-5 text-emerald-400" />}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {staffToEdit ? 'แก้ไขข้อมูลตำแหน่ง/พนักงาน' : 'เพิ่มตำแหน่ง/พนักงานใหม่'}
              </h3>
              <p className="text-xs text-slate-300">จัดการข้อมูลผู้ใช้งานและสิทธิ์การเข้าถึง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role / Position Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ตำแหน่งงานและสิทธิ์ (Role)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  role === 'owner'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-semibold ring-2 ring-amber-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className={`h-4 w-4 ${role === 'owner' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>เจ้าของร้าน</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  role === 'manager'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold ring-2 ring-indigo-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Briefcase className={`h-4 w-4 ${role === 'manager' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>ผู้จัดการร้าน</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('barista')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  role === 'barista'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Coffee className={`h-4 w-4 ${role === 'barista' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>บาริสต้า/พนักงาน</span>
              </button>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อผู้ใช้งาน / ชื่อพนักงาน <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น คุณสมชาย, คุณวิภาดา, บาริสต้าโบว์"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all text-slate-900"
              />
            </div>
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เบอร์โทรศัพท์สำหรับเข้าสู่ระบบ <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="เช่น 081-234-5678"
                required
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all text-slate-900 font-mono"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              รหัสผ่าน (PIN / Password)
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="เช่น 1234"
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all text-slate-900 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">ใช้สำหรับการเข้าสู่ระบบแบบระบุรหัสผ่าน (ค่าเริ่มต้น: 1234)</p>
          </div>

          {/* Note / Responsibility */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หน้าที่รับผิดชอบ / คำอธิบาย
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น ประจำกะเช้า, ดูแลสต็อกวัตถุดิบ"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 transition-all text-slate-800"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
            {staffToEdit ? (
              isDeleting ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 font-semibold">ยืนยันลบ?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
                  >
                    ลบทันที
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeleting(false)}
                    className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs hover:bg-slate-200"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDeleting(true)}
                  className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>ลบตำแหน่งนี้</span>
                </button>
              )
            ) : <div />}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                ปิด
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
