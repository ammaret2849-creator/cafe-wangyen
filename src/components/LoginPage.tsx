import React, { useState } from 'react';
import { 
  Phone, 
  Lock, 
  User, 
  ShieldCheck, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Briefcase, 
  Loader2, 
  TrendingUp, 
  QrCode, 
  Layers, 
  LogIn,
  UserPlus,
  Coffee
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CollegeLogo } from './CollegeLogo';

interface LoginPageProps {
  cafeName?: string;
  cafeBranch?: string;
  logoUrl?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  cafeName = 'วังน้ำเย็น เทคนิคคอล คาเฟ่',
  cafeBranch = 'สาขาวิทยาลัยเทคนิควังน้ำเย็น',
  logoUrl
}) => {
  const { 
    signInWithGoogle, 
    signInWithPhone, 
    registerWithPhone 
  } = useAuth();

  // Mode: 'login' (เข้าสู่ระบบ) or 'register' (สมัครสมาชิก)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Form fields
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'owner' | 'manager' | 'barista'>('barista');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setErrorMsg(err?.message || 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (authMode === 'register') {
      if (!name.trim()) {
        setErrorMsg('กรุณากรอกชื่อ-นามสกุล หรือชื่อเรียกในร้าน');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    }

    try {
      setLoading(true);
      if (authMode === 'register') {
        await registerWithPhone(phoneNumber.trim(), name.trim(), password, role);
      } else {
        await signInWithPhone(phoneNumber.trim(), password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(
        err?.message || 
        (authMode === 'login' 
          ? 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง' 
          : 'ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] via-[#F4EFEA] to-[#EBE4DC] text-slate-800 flex flex-col justify-between selection:bg-amber-800 selection:text-white relative overflow-hidden font-sans">
      {/* Background Soft Warm Ambient Lighting */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-amber-200/35 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[450px] h-[450px] rounded-full bg-rose-200/25 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-[350px] h-[350px] rounded-full bg-stone-300/20 blur-[100px] pointer-events-none" />

      {/* Top Bar on Cover (Clean & Minimalist) */}
      <header className="relative z-10 w-full border-b border-stone-200/80 bg-white/80 backdrop-blur-md px-4 py-2.5 shadow-2xs">
        <div className="max-w-md mx-auto flex items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
            <span>{cafeName}</span>
            {cafeBranch && (
              <span className="rounded-md bg-amber-50 border border-amber-200/90 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                {cafeBranch}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Cover Content: Mobile-sized Centered Container */}
      <main className="relative z-10 flex-1 w-full max-w-md mx-auto px-4 py-4 sm:py-6 flex flex-col justify-center">
        {/* Mobile App Styled Card */}
        <div className="relative rounded-2xl bg-white/95 border border-stone-200/90 shadow-xl shadow-stone-300/40 p-4 sm:p-5 backdrop-blur-xl space-y-3.5">
          
          {/* Central College Logo & Card Brand Header */}
          <div className="text-center flex flex-col items-center space-y-2 pb-2.5 border-b border-stone-100">
            {/* Centered College Logo with soft subtle ring */}
            <div className="relative flex items-center justify-center p-1 rounded-full bg-stone-50 border border-stone-200/90 shadow-2xs">
              <CollegeLogo size={72} customUrl={logoUrl} />
            </div>

            <div className="space-y-0.5">
              <h1 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                ระบบบันทึกและสรุปรายรับรายจ่าย
              </h1>
              <p className="text-xs text-stone-500 font-medium">
                วิทยาลัยเทคนิควังน้ำเย็น
              </p>
            </div>
          </div>

          {/* Segmented Tab Navigation: เข้าสู่ระบบ / สมัครสมาชิก */}
          <div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all text-xs ${
                  authMode === 'login'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>เข้าสู่ระบบ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all text-xs ${
                  authMode === 'register'
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>สมัครสมาชิก</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="rounded-xl bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200 font-semibold flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-[10px]">!</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Full Name (Register mode only) */}
            {authMode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <User className="h-3 w-3 text-stone-500" />
                  ชื่อ - นามสกุล หรือชื่อเรียกในร้าน
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี (บาริสต้า)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50/70 px-3 py-1.5 text-xs text-slate-900 placeholder-stone-400 focus:bg-white focus:border-slate-800 focus:outline-none transition-all"
                />
              </div>
            )}

            {/* In Register mode: Phone & Role */}
            {authMode === 'register' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-stone-500" />
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="081-234-5678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/70 px-3 py-1.5 text-xs text-slate-900 placeholder-stone-400 focus:bg-white focus:border-slate-800 focus:outline-none transition-all font-mono"
                  />
                </div>

                {/* Role selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Briefcase className="h-3 w-3 text-stone-500" />
                    ตำแหน่งในร้าน
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/70 px-2 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-slate-800 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="barista">☕ บาริสต้า (Staff)</option>
                    <option value="manager">💼 ผู้จัดการ (Manager)</option>
                    <option value="owner">👑 เจ้าของร้าน (Owner)</option>
                  </select>
                </div>
              </div>
            ) : (
              /* In Login mode: Phone field */
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-stone-500" />
                  เบอร์โทรศัพท์ (ใช้เป็นชื่อผู้ใช้)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="เช่น 081-234-5678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50/70 px-3 py-2 text-xs text-slate-900 placeholder-stone-400 focus:bg-white focus:border-slate-800 focus:outline-none transition-all font-mono"
                />
              </div>
            )}

            {/* Password & Confirm Password */}
            {authMode === 'register' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-stone-500" />
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="อย่างน้อย 4 ตัว"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-stone-50/70 pl-2.5 pr-7 py-1.5 text-xs text-slate-900 placeholder-stone-400 focus:bg-white focus:border-slate-800 focus:outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Lock className="h-3 w-3 text-stone-500" />
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="ยืนยันอีกครั้ง"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 bg-stone-50/70 pl-2.5 pr-7 py-1.5 text-xs text-slate-900 placeholder-stone-400 focus:bg-white focus:border-slate-800 focus:outline-none transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* In Login mode: Single Password field */
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-stone-500" />
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="รหัสผ่านอย่างน้อย 4 ตัวอักษร"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/70 pl-3 pr-8 py-2 text-xs text-slate-900 placeholder-stone-400 focus:bg-white focus:border-slate-800 focus:outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 py-2 text-xs sm:text-sm font-bold text-white transition-all shadow-md shadow-stone-400/30 hover:shadow-lg disabled:opacity-50 mt-1 cursor-pointer"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>
                {loading 
                  ? 'กำลังดำเนินการ...' 
                  : (authMode === 'login' ? 'เข้าสู่ระบบ' : 'ลงทะเบียนและเข้าสู่ระบบ')}
              </span>
            </button>
          </form>

          {/* Divider & Google Login Option */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2.5 text-stone-400 font-medium text-[11px]">หรือ</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2 px-3 text-xs font-bold text-slate-700 hover:bg-stone-50 transition-all border border-stone-200/90 shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-700" />
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>เข้าสู่ระบบด้วย Google</span>
          </button>

          {/* Compact Feature Chips (Mobile friendly) */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-stone-100 text-[11px] text-stone-600">
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-50 border border-stone-100">
              <TrendingUp className="h-3 w-3 text-emerald-600 shrink-0" />
              <span className="truncate font-medium">สรุปยอดขาย & กำไร</span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-50 border border-stone-100">
              <QrCode className="h-3 w-3 text-amber-700 shrink-0" />
              <span className="truncate font-medium">สลิป & QR Code</span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-50 border border-stone-100">
              <ShieldCheck className="h-3 w-3 text-amber-600 shrink-0" />
              <span className="truncate font-medium">แยกสิทธิ์ผู้ใช้งาน</span>
            </div>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-stone-50 border border-stone-100">
              <Layers className="h-3 w-3 text-rose-700 shrink-0" />
              <span className="truncate font-medium">แยกหมวดหมู่สินค้า</span>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-stone-200/80 bg-white/70 backdrop-blur-md px-4 py-2.5 text-center text-[11px] text-stone-500">
        <div className="max-w-md mx-auto flex items-center justify-center gap-1.5">
          <Coffee className="h-3.5 w-3.5 text-amber-700" />
          <span className="text-stone-700 font-medium">ระบบบริหารจัดการบัญชีรายรับ-รายจ่าย คาเฟ่</span>
        </div>
      </footer>
    </div>
  );
};

