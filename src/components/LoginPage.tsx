import React, { useState } from 'react';
import { 
  Phone, 
  Lock, 
  User, 
  Mail, 
  Coffee, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Crown, 
  Briefcase, 
  Loader2, 
  TrendingUp, 
  QrCode, 
  Layers, 
  Calendar,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CollegeLogo } from './CollegeLogo';
import { getTodayDateThai } from '../utils/formatters';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50/80 to-indigo-50/40 text-slate-800 flex flex-col justify-between selection:bg-indigo-600 selection:text-white relative overflow-hidden font-sans">
      {/* Background Soft Pastel Ambient Spheres */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-200/25 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[550px] h-[550px] rounded-full bg-rose-200/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] rounded-full bg-amber-200/20 blur-[130px] pointer-events-none" />

      {/* Top Bar on Cover */}
      <header className="relative z-10 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CollegeLogo size={44} customUrl={logoUrl} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                  {cafeName}
                </span>
                <span className="rounded-md bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                  {cafeBranch}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                วิทยาลัยเทคนิควังน้ำเย็น • ระบบสรุปรายรับ-รายจ่าย
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200/80 font-medium">
              <Calendar className="h-3.5 w-3.5 text-indigo-600" />
              <span>{getTodayDateThai()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Cover Content */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-10 sm:px-6 flex items-start">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Brand Hero & Presentation */}
          <div className="lg:col-span-7 space-y-6 text-left lg:pt-1">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-100 px-3.5 py-1.5 text-xs text-indigo-700 shadow-xs backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
              <span className="font-bold">ระบบบริหารจัดการคาเฟ่วิทยาลัย</span>
              <span className="text-indigo-300">•</span>
              <span className="text-indigo-600 font-semibold">ปีการศึกษา 2569</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                ระบบบันทึกรายรับ - รายจ่าย <br />
                <span className="text-indigo-600">
                  คาเฟ่ วิทยาลัยเทคนิควังน้ำเย็น
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
                แพลตฟอร์มบริหารจัดการยอดขาย เครื่องดื่ม เบเกอรี่ และควบคุมต้นทุนวัตถุดิบรายวัน-รายเดือน พร้อมออกใบเสร็จรับเงิน QR Code และระบบวิเคราะห์ผลกำไรสุทธิ
              </p>
            </div>

            {/* Feature Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md hover:border-emerald-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">สรุปยอดขาย & กำไร</h3>
                    <p className="text-xs text-slate-500">วิเคราะห์รายรับ-รายจ่าย Real-time</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md hover:border-indigo-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">ใบสลิป & คิวอาร์โค้ด</h3>
                    <p className="text-xs text-slate-500">พิมพ์ใบเสร็จและตรวจสลิปย้อนหลัง</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md hover:border-amber-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">ความปลอดภัยและสิทธิ์</h3>
                    <p className="text-xs text-slate-500">แยกสิทธิ์เจ้าของร้าน, ผู้จัดการ และบาริสต้า</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-md hover:border-rose-300 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">แยกหมวดหมู่เครื่องดื่ม</h3>
                    <p className="text-xs text-slate-500">กาแฟสด, ชา, เบเกอรี่, วัตถุดิบ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Authentication Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl bg-white border border-slate-200/80 shadow-xl shadow-slate-200/60 p-6 sm:p-7 backdrop-blur-xl">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>{authMode === 'login' ? 'เข้าสู่ระบบใช้งาน' : 'สมัครสมาชิกใหม่'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {authMode === 'login' 
                      ? 'กรุณากรอกเบอร์โทรศัพท์และรหัสผ่าน' 
                      : 'กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานใหม่'}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
                  {authMode === 'login' ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                </div>
              </div>

              {/* Segmented Tab Navigation: เข้าสู่ระบบ / สมัครสมาชิก */}
              <div className="pt-3.5">
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg('');
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
                      authMode === 'login'
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
                    className={`flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
                      authMode === 'register'
                        ? 'bg-indigo-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>สมัครสมาชิก</span>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mt-3.5 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-[11px]">!</span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="mt-3.5 space-y-3">
                {/* Full Name (Register mode only) */}
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      ชื่อ - นามสกุล หรือชื่อเรียกในร้าน
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น สมชาย ใจดี (บาริสต้า)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                    />
                  </div>
                )}

                {/* In Register mode: Phone & Role side-by-side or stacked */}
                {authMode === 'register' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-500" />
                        เบอร์โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="เช่น 081-234-5678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all font-mono"
                      />
                    </div>

                    {/* Role selection */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-slate-500" />
                        ตำแหน่งในร้าน
                      </label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-800 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all cursor-pointer"
                      >
                        <option value="barista">☕ บาริสต้า (Staff)</option>
                        <option value="manager">💼 ผู้จัดการ (Manager)</option>
                        <option value="owner">👑 เจ้าของร้าน (Owner)</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  /* In Login mode: Single Phone field */
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      เบอร์โทรศัพท์ (ใช้เป็นชื่อผู้ใช้)
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="เช่น 081-234-5678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all font-mono"
                    />
                  </div>
                )}

                {/* Password & Confirm Password */}
                {authMode === 'register' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Password */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-slate-500" />
                        รหัสผ่าน
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="อย่างน้อย 4 ตัว"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-slate-500" />
                        ยืนยันรหัสผ่าน
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="ยืนยันอีกครั้ง"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* In Login mode: Single Password field */
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-slate-500" />
                      รหัสผ่าน (Password)
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="รหัสผ่านอย่างน้อย 4 ตัวอักษร"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-sm font-bold text-white transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 disabled:opacity-50 mt-1"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {loading 
                      ? 'กำลังดำเนินการ...' 
                      : (authMode === 'login' ? 'เข้าสู่ระบบ' : 'ลงทะเบียนและเข้าสู่ระบบ')}
                  </span>
                </button>
              </form>

              {/* Divider & Google Login Option */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400 font-medium">หรือ</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white py-2.5 px-4 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all border border-slate-200/90 shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-700" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-200/80 bg-white/70 backdrop-blur-md px-6 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CollegeLogo size={24} customUrl={logoUrl} />
            <span className="text-slate-700 font-semibold">วิทยาลัยเทคนิควังน้ำเย็น</span>
            <span>• ระบบบริหารจัดการรายรับ-รายจ่าย คาเฟ่</span>
          </div>
          <p className="text-slate-500">
            ระบบความปลอดภัยและฐานข้อมูลคลาวด์ พร้อมรองรับการพิมพ์สลิปและใบสรุปยอด
          </p>
        </div>
      </footer>
    </div>
  );
};
