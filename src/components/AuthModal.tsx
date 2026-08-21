import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  Lock, 
  User, 
  Mail, 
  Coffee, 
  ShieldCheck, 
  CheckCircle2, 
  LogOut, 
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
  Crown,
  Briefcase,
  Users,
  ChevronRight,
  Loader2,
  Pencil,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CafeUserProfile, StaffAccount } from '../types';
import { CollegeLogo } from './CollegeLogo';
import { StaffEditModal } from './StaffEditModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    staffAccounts,
    signInWithGoogle, 
    signInWithPhone, 
    registerWithPhone, 
    loginAsStaff,
    removeStaff,
    signOut 
  } = useAuth();

  const [tab, setTab] = useState<'quick' | 'phone' | 'google'>('quick');
  const [phoneMode, setPhoneMode] = useState<'login' | 'register'>('login');
  
  // Staff Edit Modal state
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);

  // Form fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'manager' | 'barista'>('owner');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMsg(err?.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffClick = async (staff: StaffAccount) => {
    try {
      setLoading(true);
      setErrorMsg('');
      await loginAsStaff(staff);
      onClose();
    } catch (err: any) {
      console.error('Quick login error:', err);
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการสลับบัญชี');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditStaff = (e: React.MouseEvent, staff: StaffAccount) => {
    e.stopPropagation();
    setEditingStaff(staff);
    setIsStaffModalOpen(true);
  };

  const handleOpenAddStaff = () => {
    setEditingStaff(null);
    setIsStaffModalOpen(true);
  };

  const handleDeleteStaff = async (e: React.MouseEvent, staff: StaffAccount) => {
    e.stopPropagation();
    if (window.confirm(`คุณต้องการลบตำแหน่ง/บัญชี "${staff.name}" หรือไม่?`)) {
      try {
        await removeStaff(staff.id);
      } catch (err: any) {
        setErrorMsg(err?.message || 'ไม่สามารถลบบัญชีได้');
      }
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phoneNumber.trim()) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    try {
      setLoading(true);
      if (phoneMode === 'register') {
        if (!name.trim()) {
          setErrorMsg('กรุณากรอกชื่อผู้ใช้งาน');
          setLoading(false);
          return;
        }
        await registerWithPhone(phoneNumber.trim(), name.trim(), password, role);
      } else {
        await signInWithPhone(phoneNumber.trim(), password);
      }
      onClose();
    } catch (err: any) {
      console.error('Phone auth error:', err);
      setErrorMsg(err?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (r?: string) => {
    switch (r) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
            <Crown className="h-3 w-3 text-amber-600" />
            เจ้าของร้าน (Owner)
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-800 border border-stone-300">
            <Briefcase className="h-3 w-3 text-stone-700" />
            ผู้จัดการร้าน (Manager)
          </span>
        );
      case 'barista':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <Coffee className="h-3 w-3 text-emerald-600" />
            บาริสต้า / พนักงาน (Staff)
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs">
        <div 
          className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white border border-stone-200 text-stone-900 shadow-2xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Visual Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 px-6 py-6 text-white border-b border-stone-800">
            {/* Subtle Ambient Glows */}
            <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-amber-500/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-amber-700/15 blur-2xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 shadow-xs">
                  <CollegeLogo size={42} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg tracking-tight text-white">
                      ระบบเข้าสู่ระบบและจัดการสิทธิ์
                    </h3>
                  </div>
                  <p className="text-xs text-stone-300 font-medium">
                    วิทยาลัยเทคนิควังน้ำเย็น
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-xl p-2 text-stone-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                title="ปิดหน้าต่าง"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Current Logged-in Profile Banner */}
          {user && (
            <div className="mx-6 mt-5 p-4 rounded-2xl bg-stone-50 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="h-11 w-11 rounded-2xl object-cover border border-stone-300 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-stone-900 font-extrabold text-white text-base shadow-xs">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-stone-900 truncate">
                        {user.displayName}
                      </span>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="text-xs text-stone-500 truncate mt-0.5">
                      {user.email || user.phoneNumber || 'บัญชีพนักงานร้าน'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => signOut()}
                  className="flex shrink-0 items-center gap-1.5 text-xs text-rose-600 hover:bg-rose-100 bg-rose-50 px-3 py-2 rounded-xl border border-rose-200 font-bold transition-all hover:shadow-2xs cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}

          {/* Segmented Tab Navigation */}
          <div className="px-6 pt-5">
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-2xl border border-stone-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setTab('quick')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  tab === 'quick'
                    ? 'bg-white text-stone-900 font-bold shadow-xs border border-stone-200'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-amber-800" />
                <span>สลับบัญชีด่วน</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('phone')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  tab === 'phone'
                    ? 'bg-white text-stone-900 font-bold shadow-xs border border-stone-200'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Phone className="h-3.5 w-3.5 text-amber-800" />
                <span>เบอร์โทรศัพท์</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('google')}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                  tab === 'google'
                    ? 'bg-white text-stone-900 font-bold shadow-xs border border-stone-200'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                <Mail className="h-3.5 w-3.5 text-rose-600" />
                <span>Google Login</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {errorMsg && (
              <div className="rounded-2xl bg-rose-50 p-3.5 text-xs text-rose-700 border border-rose-200 font-semibold flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-800 font-bold">!</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: QUICK SWITCH & REAL STAFF ACCOUNTS */}
            {tab === 'quick' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-600 font-semibold pb-1">
                  <span>เลือกตำแหน่งเพื่อเข้าใช้งาน หรือกดแก้ไข/ลบ:</span>
                  <button
                    type="button"
                    onClick={handleOpenAddStaff}
                    className="flex items-center gap-1 text-amber-800 hover:text-amber-900 font-bold bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-amber-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>เพิ่มตำแหน่งใหม่</span>
                  </button>
                </div>

                {/* Dynamic Staff Accounts List */}
                <div className="space-y-2.5">
                  {staffAccounts.map((staff) => {
                    const isStaffOwner = staff.role === 'owner';
                    const isStaffManager = staff.role === 'manager';
                    
                    const cardBg = isStaffOwner 
                      ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/80 hover:border-amber-300' 
                      : isStaffManager 
                        ? 'border-stone-300 bg-stone-50/70 hover:bg-stone-100 hover:border-stone-400' 
                        : 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/80 hover:border-emerald-300';

                    const iconBg = isStaffOwner 
                      ? 'bg-amber-100 text-amber-800 border-amber-200' 
                      : isStaffManager 
                        ? 'bg-stone-200 text-stone-800 border-stone-300' 
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                    const badgeBg = isStaffOwner 
                      ? 'bg-amber-100 text-amber-900 border-amber-200' 
                      : isStaffManager 
                        ? 'bg-stone-200 text-stone-900 border-stone-300' 
                        : 'bg-emerald-100 text-emerald-900 border-emerald-200';

                    return (
                      <div
                        key={staff.id}
                        onClick={() => handleStaffClick(staff)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer group ${cardBg}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 ${iconBg}`}>
                            {isStaffOwner ? <Crown className="h-5 w-5 text-amber-700" /> : isStaffManager ? <Briefcase className="h-5 w-5 text-stone-700" /> : <Coffee className="h-5 w-5 text-emerald-600" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-stone-900 flex items-center gap-2 flex-wrap">
                              <span className="truncate">{staff.name}</span>
                              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold border ${badgeBg}`}>
                                {staff.role === 'owner' ? 'เจ้าของร้าน' : staff.role === 'manager' ? 'ผู้จัดการร้าน' : 'บาริสต้า / แคชเชียร์'}
                              </span>
                            </div>
                            <div className="text-xs text-stone-500 truncate mt-0.5">
                              เบอร์โทร: <strong className="text-stone-700 font-mono">{staff.phoneNumber}</strong> • {staff.description || 'พนักงานร้าน'}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Edit, Delete & Arrow */}
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditStaff(e, staff)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-800 hover:bg-white/80 transition-colors cursor-pointer"
                            title="แก้ไขข้อมูลตำแหน่ง"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteStaff(e, staff)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-white/80 transition-colors cursor-pointer"
                            title="ลบตำแหน่งนี้"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="pl-1">
                            <ChevronRight className="h-5 w-5 text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add New Staff CTA */}
                <button
                  type="button"
                  onClick={handleOpenAddStaff}
                  className="w-full mt-2 py-3 px-4 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-700 hover:bg-amber-50/50 text-stone-600 hover:text-amber-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ เพิ่มตำแหน่ง / พนักงานใหม่เข้าสู่ระบบ</span>
                </button>
              </div>
            )}

            {/* TAB 2: PHONE & PASSWORD */}
            {tab === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="font-bold text-stone-800">
                    {phoneMode === 'login' ? 'เข้าสู่ระบบด้วยเบอร์โทรศัพท์' : 'ลงทะเบียนผู้ใช้งานใหม่'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneMode(phoneMode === 'login' ? 'register' : 'login');
                      setErrorMsg('');
                    }}
                    className="text-amber-800 hover:underline font-bold cursor-pointer"
                  >
                    {phoneMode === 'login' ? '+ สมัครสมาชิกใหม่' : '← มีบัญชีแล้ว เข้าสู่ระบบ'}
                  </button>
                </div>

                {phoneMode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-stone-400" />
                      ชื่อ - นามสกุล หรือชื่อเรียกในร้าน
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น คุณสมชาย (เจ้าของร้าน)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-stone-400" />
                    เบอร์โทรศัพท์ (ใช้เป็นชื่อผู้ใช้)
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 081-234-5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-stone-400" />
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="รหัสผ่านอย่างน้อย 4 ตัวอักษร"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 bg-white pl-3.5 pr-10 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-amber-700 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {phoneMode === 'register' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-700">
                      ตำแหน่ง / สิทธิ์การใช้งาน
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:ring-2 focus:ring-amber-100 focus:outline-none transition-all"
                    >
                      <option value="owner">👑 เจ้าของร้าน (Owner - ดูแลทุกส่วน)</option>
                      <option value="manager">💼 ผู้จัดการร้าน (Manager - จัดการร้านและรายงาน)</option>
                      <option value="barista">☕ บาริสต้า / แคชเชียร์ (Staff - บันทึกรายการ)</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-bold text-white hover:bg-stone-800 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {loading ? 'กำลังดำเนินการ...' : (phoneMode === 'login' ? 'เข้าสู่ระบบ' : 'ลงทะเบียนและเข้าสู่ระบบ')}
                  </span>
                </button>
              </form>
            )}

            {/* TAB 3: GOOGLE GMAIL */}
            {tab === 'google' && (
              <div className="space-y-4 py-2">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center space-y-2">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-white text-stone-800 shadow-xs border border-stone-200">
                    <Mail className="h-6 w-6 text-rose-600" />
                  </div>
                  <h4 className="font-bold text-sm text-stone-900">
                    เข้าสู่ระบบด้วยบัญชี Google
                  </h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    ซิงค์ข้อมูลรายรับรายจ่ายกับระบบคลาวด์อัตโนมัติ เข้าถึงได้จากทุกอุปกรณ์
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-3.5 px-4 text-sm font-bold text-stone-800 border border-stone-300 hover:bg-stone-50 hover:border-stone-400 transition-all shadow-xs hover:shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-stone-600" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  )}
                  <span>ดำเนินการต่อด้วย Google</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="border-t border-stone-100 bg-stone-50/70 px-6 py-3 text-center text-[11px] text-stone-500">
            วิทยาลัยเทคนิควังน้ำเย็น • ระบบบริหารจัดการรายรับ-รายจ่าย คาเฟ่
          </div>
        </div>
      </div>

      {/* Staff Edit / Add Modal */}
      <StaffEditModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        staffToEdit={editingStaff}
      />
    </>
  );
};
