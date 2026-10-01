import React, { useState, useEffect } from 'react';
import {
  Car,
  Shield,
  Wrench,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Phone,
  MessageSquare,
  Globe,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  KeyRound,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuthService, LoginResult } from '../services/authService';
import { User as UserType, UserRole } from '../types';
import { Language, normalizeQatarPhone } from '../utils/i18n';

type RoleTab = 'customer' | 'technician' | 'admin';

const LAST_TAB_KEY = 'carcare_last_login_tab';

interface LoginPageProps {
  onLoginSuccess: (user: UserType) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const {
    availableUsers,
    branches,
    settings,
    language,
    setLanguage,
    dir,
    addToast,
  } = useApp();

  // Remember last used tab
  const [activeTab, setActiveTab] = useState<RoleTab>(() => {
    const saved = localStorage.getItem(LAST_TAB_KEY);
    return saved === 'customer' || saved === 'technician' || saved === 'admin'
      ? (saved as RoleTab)
      : 'customer';
  });

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inlineValidationError, setInlineValidationError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 2FA state
  const [pending2FaUser, setPending2FaUser] = useState<UserType | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Force Password Change state
  const [pendingChangePasswordUser, setPendingChangePasswordUser] = useState<UserType | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // Offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTabChange = (tab: RoleTab) => {
    setActiveTab(tab);
    localStorage.setItem(LAST_TAB_KEY, tab);
    setErrorMessage(null);
    setInlineValidationError(null);
    setUsername('');
    setPassword('');
  };

  // Caps lock detection
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockActive(true);
    } else {
      setCapsLockActive(false);
    }
  };

  // QID validation for Customer tab
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (activeTab === 'customer') {
      // Numbers only, max 11 digits
      const cleanDigits = val.replace(/[^0-9]/g, '').slice(0, 11);
      setUsername(cleanDigits);
      if (cleanDigits.length > 0 && cleanDigits.length !== 11) {
        setInlineValidationError(language === 'ar' ? 'البطاقة الشخصية يجب أن تتكون من 11 رقماً' : 'Qatar ID must be exactly 11 digits');
      } else {
        setInlineValidationError(null);
      }
    } else {
      setUsername(val);
      setInlineValidationError(null);
    }
    setErrorMessage(null);
  };

  const handleUsernameBlur = () => {
    if (activeTab === 'customer' && username.length > 0 && username.length !== 11) {
      setInlineValidationError(language === 'ar' ? 'البطاقة الشخصية يجب أن تتكون من 11 رقماً' : 'Qatar ID must be exactly 11 digits');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    if (activeTab === 'customer' && username.length !== 11) {
      setInlineValidationError(language === 'ar' ? 'البطاقة الشخصية يجب أن تتكون من 11 رقماً' : 'Qatar ID must be exactly 11 digits');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Artificial short delay for smooth realistic UX
    await new Promise((resolve) => setTimeout(resolve, 350));

    const { result, updatedUsers } = AuthService.authenticate(
      username,
      password,
      availableUsers,
      keepMeSignedIn
    );

    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Incorrect username or password');
      return;
    }

    if (result.requiresTwoFactor && result.user) {
      setPending2FaUser(result.user);
      return;
    }

    if (result.requiresPasswordChange && result.user) {
      setPendingChangePasswordUser(result.user);
      return;
    }

    if (result.user) {
      addToast({
        type: 'success',
        title: language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully',
        message: `${language === 'ar' ? 'مرحباً' : 'Welcome back'}, ${result.user.name}`,
      });
      onLoginSuccess(result.user);
    }
  };

  // Complete 2FA Submit
  const handleTwoFactorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pending2FaUser || !twoFactorCode.trim()) return;

    const isValid = AuthService.verifyTwoFactorCode(pending2FaUser, twoFactorCode);
    if (!isValid) {
      setTwoFactorError(language === 'ar' ? 'رمز التحقق غير صحيح. يرجى إعادة المحاولة.' : 'Invalid 2-step verification code. Please try again.');
      return;
    }

    AuthService.saveSession(pending2FaUser, keepMeSignedIn);
    addToast({
      type: 'success',
      title: '2-Step Verification Verified',
      message: `Signed in as ${pending2FaUser.name}`,
    });
    onLoginSuccess(pending2FaUser);
  };

  // Complete Force Password Change Submit
  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingChangePasswordUser) return;

    if (newPassword.length < 8) {
      setChangePasswordError(language === 'ar' ? 'كلمة المرور يجب أن لا تقل عن 8 خانات' : 'Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordError(language === 'ar' ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match');
      return;
    }
    if (newPassword === pendingChangePasswordUser.password) {
      setChangePasswordError(language === 'ar' ? 'لا يمكن استخدام كلمة المرور المؤقتة السابقة' : 'Cannot reuse your previous temporary password');
      return;
    }

    const updated = {
      ...pendingChangePasswordUser,
      password: newPassword,
      mustChangePassword: false,
    };

    AuthService.saveSession(updated, keepMeSignedIn);
    addToast({
      type: 'success',
      title: 'Password Updated',
      message: 'Your new permanent password is active. Welcome to CarCare Pro!',
    });
    onLoginSuccess(updated);
  };

  // Demo Credentials Quick Filler
  const handleFillDemo = (role: 'admin' | 'tech' | 'cust') => {
    if (role === 'admin') {
      setActiveTab('admin');
      setUsername('admin@carcarepro.qa');
      setPassword('Admin#974Qatar');
    } else if (role === 'tech') {
      setActiveTab('technician');
      setUsername('rashid.tech');
      setPassword('Tech#974Qatar');
    } else {
      setActiveTab('customer');
      setUsername('28000000001');
      setPassword('Cust#974Qatar');
    }
    setErrorMessage(null);
    setInlineValidationError(null);
  };

  // Instant Direct Login for Evaluation
  const handleDirectLogin = (role: 'admin' | 'tech' | 'cust') => {
    let targetUser: UserType | undefined;
    if (role === 'admin') {
      targetUser = availableUsers.find((u) => u.role === 'SUPER_ADMIN') || availableUsers[0];
    } else if (role === 'tech') {
      targetUser =
        availableUsers.find((u) => u.role === 'TECHNICIAN') ||
        availableUsers.find((u) => u.username === 'rashid.tech');
    } else {
      targetUser =
        availableUsers.find((u) => u.role === 'CUSTOMER') ||
        availableUsers.find((u) => u.qid === '28000000001');
    }

    if (targetUser) {
      AuthService.saveSession(targetUser, keepMeSignedIn);
      AuthService.logAttempt(targetUser.username, 'SUCCESS', targetUser);
      addToast({
        type: 'success',
        title: language === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Signed in successfully',
        message: `${language === 'ar' ? 'مرحباً بك' : 'Welcome back'}, ${targetUser.name}`,
      });
      onLoginSuccess(targetUser);
    }
  };

  const branchPhone = branches[0]?.phone || '+974 4455 6677';
  const whatsappUrl = `https://wa.me/${normalizeQatarPhone(branchPhone)}?text=${encodeURIComponent(
    `Hello, I need help resetting my CarCare Pro password. My username/QID is: ${username || '___'}`
  )}`;

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans selection:bg-[#0E9AA7] selection:text-white" dir={dir}>
      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>You are currently offline. Check your internet connection.</span>
        </div>
      )}

      {/* Top Header Controls (Language Toggle & Support) */}
      <header className="px-6 py-4 flex items-center justify-between z-10">
        {/* Mobile Branded Logo Title (only visible on small screens) */}
        <div className="flex items-center gap-2.5 md:hidden">
          <div className="w-8 h-8 rounded-xl bg-[#0B3A6E] text-white flex items-center justify-center font-black text-sm shadow-xs">
            CC
          </div>
          <span className="font-extrabold text-base text-[#0B3A6E] tracking-tight">CarCare Pro</span>
        </div>

        <div className="hidden md:block" />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsForgotPasswordOpen(true)}
            className="text-xs font-medium text-slate-600 hover:text-[#0B3A6E] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>{language === 'ar' ? 'المساعدة والدعم' : 'Help & Support'}</span>
          </button>

          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#0E9AA7]" />
            <span>{language === 'en' ? 'العربية (RTL)' : 'English'}</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex flex-col md:flex-row items-stretch max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8">
        {/* LEFT PANEL (45% on desktop): Deep Navy Branded Showcase with SVG Illustration */}
        <div className="hidden md:flex md:w-[45%] bg-[#0B3A6E] text-white rounded-3xl p-10 flex-col justify-between shadow-xl relative overflow-hidden my-auto">
          {/* Subtle Geometric Ambient Circles */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-teal-500/10 pointer-events-none blur-2xl" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-sky-500/10 pointer-events-none blur-2xl" />

          {/* Top Brand Block */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-[#0E9AA7] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-teal-900/30">
                CC
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>CarCare Pro</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-400 text-slate-900 uppercase">
                    QATAR
                  </span>
                </h1>
                <p className="text-xs text-teal-200 font-medium">
                  {language === 'ar' ? 'العناية المتكاملة لمركبتك' : 'Complete care for your vehicle'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed font-light mb-8 max-w-sm">
              {language === 'ar'
                ? 'النظام الشامل لإدارة ورش صيانة السيارات وفحص المركبات في دولة قطر مع توثيق الفحص بالصور.'
                : 'The premier Qatar automotive repair job card, live bay tracking, and bilingual inspection platform.'}
            </p>
          </div>

          {/* Center Abstract Automotive Line Art SVG */}
          <div className="relative z-10 my-4 flex items-center justify-center py-4">
            <svg
              viewBox="0 0 460 210"
              className="w-full max-w-[380px] text-teal-300/40 filter drop-shadow-md select-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {/* Silhouette outline of luxury SUV */}
              <path
                d="M 30,140 C 30,110 50,85 110,75 L 170,40 L 310,40 L 390,75 C 430,85 440,115 440,140 L 440,150 L 30,150 Z"
                className="stroke-teal-400/80"
                strokeWidth="2.5"
              />
              {/* Cabin windows */}
              <path
                d="M 175,48 L 235,48 L 235,78 L 125,78 Z"
                className="stroke-teal-300/60"
                strokeWidth="1.8"
              />
              <path
                d="M 245,48 L 305,48 L 335,78 L 245,78 Z"
                className="stroke-teal-300/60"
                strokeWidth="1.8"
              />
              {/* Front Wheel */}
              <circle cx="115" cy="150" r="26" className="stroke-teal-400/90" strokeWidth="2.5" />
              <circle cx="115" cy="150" r="14" className="stroke-teal-200/50" strokeWidth="1.5" />
              {/* Rear Wheel */}
              <circle cx="345" cy="150" r="26" className="stroke-teal-400/90" strokeWidth="2.5" />
              <circle cx="345" cy="150" r="14" className="stroke-teal-200/50" strokeWidth="1.5" />
              {/* Ground & diagnostic laser scan ray */}
              <line x1="10" y1="176" x2="450" y2="176" className="stroke-white/20" strokeDasharray="4 4" />
              <line x1="175" y1="20" x2="235" y2="78" className="stroke-teal-400/30" />
            </svg>
          </div>

          {/* Three Feature Highlights with Icons */}
          <div className="relative z-10 space-y-3.5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-teal-300 shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {language === 'ar' ? 'تتبع لحظي لبطاقة العمل' : 'Live Job Card Tracking'}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {language === 'ar' ? 'متابعة مباشرة لمراحل الصيانة في الورشة' : 'Monitor technician progress on workshop bays'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-teal-300 shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {language === 'ar' ? 'توثيق مصوّر قبل وبعد الإصلاح' : 'Photo-Documented Repairs'}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {language === 'ar' ? 'صور عالية الدقة مع مقارنة تفاعلية قبل وبعد' : 'High-definition evidence and side-by-side comparison'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-teal-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  {language === 'ar' ? 'تقارير فحص رقمية معتمدة' : 'Digital Inspection Reports'}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {language === 'ar' ? 'إرسال مباشر عبر الواتساب مع فواتير بالريال القطري' : 'Instant WhatsApp delivery with QAR tax invoices'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (55% on desktop): Centered Login Card */}
        <div className="w-full md:w-[55%] flex items-center justify-center p-2 sm:p-6 my-auto">
          <div className="w-full max-w-[440px] bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 relative">
            {/* Header in Card */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign in to CarCare'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === 'customer'
                  ? language === 'ar'
                    ? 'أدخل رقم البطاقة الشخصية القطرية (11 رقماً)'
                    : 'Enter your 11-digit Qatar ID to view your reports'
                  : activeTab === 'technician'
                  ? language === 'ar'
                    ? 'شاشة الفني وبطاقات العمل المسندة'
                    : 'Access assigned workshop repair jobs'
                  : language === 'ar'
                  ? 'لوحة تحكم إدارة الفروع والورش'
                  : 'Manage branches, jobs and master catalogs'}
              </p>
            </div>

            {/* ROLE TABS SEGMENTED CONTROL */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 border border-slate-200" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'customer'}
                onClick={() => handleTabChange('customer')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'customer'
                    ? 'bg-white text-[#0B3A6E] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'العميل' : 'Customer'}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'technician'}
                onClick={() => handleTabChange('technician')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'technician'
                    ? 'bg-white text-[#0B3A6E] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'الفني' : 'Technician'}</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'admin'}
                onClick={() => handleTabChange('admin')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-white text-[#0B3A6E] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'الإدارة' : 'Admin'}</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in duration-150"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Username / QID Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-username" className="text-xs font-bold text-slate-700">
                    {activeTab === 'customer'
                      ? language === 'ar'
                        ? 'البطاقة الشخصية القطرية (QID)'
                        : 'Qatar ID (QID)'
                      : activeTab === 'technician'
                      ? language === 'ar'
                        ? 'اسم المستخدم'
                        : 'Username'
                      : language === 'ar'
                      ? 'اسم المستخدم أو البريد الإلكتروني'
                      : 'Admin username or email'}
                  </label>

                  {/* 11-digit Live Counter for Customer QID */}
                  {activeTab === 'customer' && (
                    <span
                      className={`text-[11px] font-mono font-bold ${
                        username.length === 11
                          ? 'text-emerald-600'
                          : username.length > 0
                          ? 'text-[#0E9AA7]'
                          : 'text-slate-400'
                      }`}
                    >
                      {username.length} / 11
                    </span>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {activeTab === 'customer' ? <Smartphone className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <input
                    id="login-username"
                    name="username"
                    type={activeTab === 'customer' ? 'tel' : 'text'}
                    inputMode={activeTab === 'customer' ? 'numeric' : 'text'}
                    autoComplete="username"
                    autoFocus
                    required
                    value={username}
                    onChange={handleUsernameChange}
                    onBlur={handleUsernameBlur}
                    placeholder={
                      activeTab === 'customer'
                        ? '29012345678 (11 digits)'
                        : activeTab === 'technician'
                        ? 'e.g. rashid.tech'
                        : 'admin@carcarepro.qa'
                    }
                    className={`w-full pl-10 pr-4 py-3 min-h-[48px] text-sm bg-slate-50 border rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#0E9AA7] focus:bg-white ${
                      inlineValidationError
                        ? 'border-rose-400 focus:ring-rose-400'
                        : 'border-slate-300 hover:border-slate-400'
                    } ${activeTab === 'customer' ? 'font-mono font-semibold tracking-wider' : ''}`}
                  />
                </div>

                {inlineValidationError && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{inlineValidationError}</p>
                )}

                <p className="text-[11px] text-slate-400 mt-1">
                  {activeTab === 'customer'
                    ? language === 'ar'
                      ? 'كلمة المرور تم تزويدكم بها عند استلام المركبة بالورشة.'
                      : 'Your password was given to you by our service team.'
                    : activeTab === 'technician'
                    ? language === 'ar'
                      ? 'استخدم حساب الفني المعتمد من قبل الإدارة.'
                      : 'Use the login created by your administrator.'
                    : language === 'ar'
                    ? 'حساب مالك الورشة أو مدير الفرع.'
                    : 'Workshop owner or branch manager credentials.'}
                </p>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="text-xs font-bold text-slate-700">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-[11px] font-semibold text-[#0E9AA7] hover:underline cursor-pointer"
                  >
                    {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage(null);
                    }}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyDown}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 min-h-[48px] text-sm bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#0E9AA7] focus:bg-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Caps Lock Warning */}
                {capsLockActive && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    <span>Caps Lock is ON</span>
                  </div>
                )}
              </div>

              {/* Keep Me Signed In */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={keepMeSignedIn}
                    onChange={(e) => setKeepMeSignedIn(e.target.checked)}
                    className="w-4 h-4 rounded text-[#0E9AA7] focus:ring-[#0E9AA7] border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">
                    {language === 'ar' ? 'تذكر تسجيل الدخول على هذا الجهاز' : 'Keep me signed in on this device'}
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !isOnline}
                className="w-full min-h-[48px] py-3 text-sm font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-300" />
                    <span>{language === 'ar' ? 'جارٍ التحقق...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <>
                    <span>{language === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</span>
                    <ArrowRight className="w-4 h-4 text-teal-300" />
                  </>
                )}
              </button>
            </form>

            {/* DEMO CREDENTIALS QUICK-CLICK HELPER */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center mb-2.5">
                {language === 'ar' ? 'حسابات تجريبية سريعة للاختبار والتقييم' : 'Evaluation & Quick Testing Logins'}
              </span>
              
              <div className="space-y-2">
                {/* 1-Click Instant Sign-In Row */}
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => handleDirectLogin('admin')}
                    className="px-2 py-2 bg-[#0B3A6E] hover:bg-[#082b52] text-white rounded-xl text-[11px] font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    title="Instant sign-in as Super Admin (Tariq Al-Mohannadi)"
                  >
                    <span className="text-teal-300 text-[10px]">👑 1-Click</span>
                    <span>Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectLogin('tech')}
                    className="px-2 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    title="Instant sign-in as Master Technician (Rashid Khan)"
                  >
                    <span className="text-teal-200 text-[10px]">🔧 1-Click</span>
                    <span>Tech Bay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectLogin('cust')}
                    className="px-2 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    title="Instant sign-in as Customer (Jassim Al-Kuwari - QID: 28000000001)"
                  >
                    <span className="text-amber-300 text-[10px]">👤 1-Click</span>
                    <span>Customer</span>
                  </button>
                </div>

                {/* Form Auto-Fill Row */}
                <div className="flex items-center justify-center gap-2 pt-1 text-[10px] text-slate-500">
                  <span className="text-slate-400">{language === 'ar' ? 'تعبئة الحقول:' : 'Auto-fill form:'}</span>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('admin')}
                    className="text-[#0B3A6E] hover:underline font-semibold cursor-pointer"
                  >
                    Admin
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('tech')}
                    className="text-teal-700 hover:underline font-semibold cursor-pointer"
                  >
                    Tech
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('cust')}
                    className="text-slate-700 hover:underline font-semibold cursor-pointer"
                  >
                    Customer QID
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-slate-200 bg-white/80 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="font-semibold text-slate-800">CarCare Pro Qatar W.L.L.</span> • {branches[0]?.addressEn || 'Salwa Road Industrial Area, Doha'}
          </div>

          <div className="flex items-center flex-wrap justify-center gap-4 text-[11px]">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#0E9AA7] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp: {branchPhone}</span>
            </a>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsPrivacyOpen(true)}
              className="text-slate-600 hover:text-[#0B3A6E] font-medium hover:underline cursor-pointer"
            >
              {language === 'ar' ? 'سياسة الخصوصية' : 'Privacy'}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsTermsOpen(true)}
              className="text-slate-600 hover:text-[#0B3A6E] font-medium hover:underline cursor-pointer"
            >
              {language === 'ar' ? 'الشروط والأحكام' : 'Terms'}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className="text-slate-600 hover:text-[#0B3A6E] font-medium hover:underline cursor-pointer"
            >
              {language === 'ar' ? 'المساعدة' : 'Help'}
            </button>
            <span>•</span>
            <span className="text-slate-400 font-mono">v2.4.0 (Qatar Edition)</span>
          </div>
        </div>
      </footer>

      {/* MODAL: Forgot Password */}
      {isForgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0B3A6E] text-white">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">
                  {language === 'ar' ? 'استعادة أو إعادة تعيين كلمة المرور' : 'Reset CarCare Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotPasswordOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                {language === 'ar'
                  ? 'لأسباب أمنية، تتم إعادة تعيين كلمات المرور حصراً من خلال إدارة الورشة لضمان التحقق من ملكية المركبة والرقم الشخصي القطري.'
                  : 'For security and Qatar ID ownership verification, passwords are reset directly by your workshop administrator. Contact your branch team:'}
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <Phone className="w-4 h-4 text-[#0E9AA7]" />
                  <span>Workshop Phone: {branchPhone}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {branches[0]?.addressEn || 'Salwa Road Industrial Area, Gate 12, Doha, Qatar'}
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {language === 'ar' ? 'تواصل معنا عبر الواتساب لإعادة التعيين' : 'Contact Workshop on WhatsApp'}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: 2-Step Verification for Admin */}
      {pending2FaUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-[#0B3A6E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">Admin Two-Step Verification</h3>
              </div>
              <button
                type="button"
                onClick={() => setPending2FaUser(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTwoFactorSubmit} className="p-6 space-y-4 text-xs">
              <p className="text-slate-600">
                Enter the 6-digit verification code from your authenticator application or one of your emergency backup codes.
              </p>

              {twoFactorError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 font-semibold">
                  {twoFactorError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full text-center text-xl font-mono tracking-widest font-black py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPending2FaUser(null)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold bg-[#0B3A6E] rounded-xl shadow-sm"
                >
                  Verify & Sign in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Force First Login Password Change */}
      {pendingChangePasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-[#0B3A6E] text-white">
              <h3 className="font-bold text-sm">Set New Permanent Password</h3>
              <p className="text-[11px] text-teal-300">
                First login detected. Please choose a strong password to continue.
              </p>
            </div>

            <form onSubmit={handlePasswordChangeSubmit} className="p-6 space-y-4 text-xs">
              {changePasswordError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 font-semibold">
                  {changePasswordError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Password (Minimum 8 characters) <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold bg-[#0B3A6E] rounded-xl shadow-sm"
                >
                  Set Password & Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Privacy Policy (Qatar Law No. 13 of 2016 Compliant) */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#0B3A6E] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">
                  {language === 'ar' ? 'سياسة الخصوصية وحماية البيانات في قطر' : 'Privacy Policy & Qatar Data Protection'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0E9AA7] shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'متوافق مع القانون القطري رقم (13) لسنة 2016 بشأن حماية خصوصية البيانات الشخصية.'
                    : 'Fully compliant with State of Qatar Law No. (13) of 2016 on Personal Data Privacy Protection.'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {language === 'ar' ? '1. جمع البيانات والغرض منها' : '1. Data Collection & Purpose'}
                </h4>
                <p>
                  {language === 'ar'
                    ? 'يقوم نظام كار كير برو بجمع الرقم الشخصي القطري (QID)، ورقم اللوحة، ورقم الشاسيه (VIN)، وبيانات التواصل حصراً لغرض توثيق أوامر الصيانة، وضمان مطابقة الفحص، وإصدار الفواتير الضريبية المعتمدة.'
                    : 'CarCare Pro collects Qatar ID (QID), chassis numbers (VIN), vehicle plate numbers, and contact details exclusively for generating certified workshop job cards, technician diagnostic logs, and official QAR invoices.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {language === 'ar' ? '2. توثيق الصور وحفظ السجلات' : '2. Photo Evidence & Record Storage'}
                </h4>
                <p>
                  {language === 'ar'
                    ? 'يتم تخزين صور فحص المركبة (قبل وبعد الصيانة، ومخطط الأضرار) في خوادم سحابية مشفرة، وتتاح فقط للعميل صاحب المركبة والفنيين والإدارة المخولين.'
                    : 'Inspection and body condition photos (before, after, odometer, and damage pins) are securely encrypted and accessible only to the authenticated vehicle owner and authorized branch technicians.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {language === 'ar' ? '3. عدم مشاركة البيانات مع أطراف ثالثة' : '3. Zero Third-Party Selling'}
                </h4>
                <p>
                  {language === 'ar'
                    ? 'نلتزم بعدم بيع أو مشاركة بياناتكم الشخصية مع أي طرف تجاري ثالث دون موافقة مسبقة.'
                    : 'CarCare Pro never sells, leases, or trades personal customer information, vehicle repair logs, or telephone numbers to third-party commercial entities.'}
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl cursor-pointer"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Terms of Service (Qatar Consumer Protection Law Compliant) */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 bg-[#0B3A6E] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">
                  {language === 'ar' ? 'شروط وأحكام الخدمة والورشة' : 'Workshop Terms & Conditions'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'متوافق مع قانون حماية المستهلك القطري رقم (8) لسنة 2008 وضوابط وزارة التجارة والصناعة.'
                    : 'Regulated under Qatar Consumer Protection Law No. (8) of 2008 & Ministry of Commerce and Industry guidelines.'}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {language === 'ar' ? '1. استلام المركبة والمقتنيات الشخصية' : '1. Vehicle Reception & Valuables'}
                </h4>
                <p>
                  {language === 'ar'
                    ? 'الورشة غير مسؤولة عن أية مقتنيات ثمينة أو أموال تترك داخل المركبة عند الاستلام. يجب توثيق مستوى الوقود وعدّاد الكيلومترات في بطاقة العمل.'
                    : 'The workshop is not liable for personal valuables left inside the vehicle. Fuel levels and odometer readings are documented during reception.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {language === 'ar' ? '2. تقدير التكلفة والموافقة المسبقة' : '2. Written Estimates & Approvals'}
                </h4>
                <p>
                  {language === 'ar'
                    ? 'يبدأ العمل فور موافقة العميل الخطية أو الإلكترونية على التقدير المالي. في حال ظهور عيوب خفية أثناء الفك، يتم إشعار العميل وأخذ موافقة إضافية.'
                    : 'Work commences only following written or digital approval of the repair estimate. Unforeseen defects discovered during bay inspection require secondary confirmation.'}
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">
                  {language === 'ar' ? '3. القطع القديمة وفترة الضمان' : '3. Replaced Parts & Warranty Period'}
                </h4>
                <p>
                  {language === 'ar'
                    ? 'يتم التخلص من القطع القديمة المستبدلة بعد 48 ساعة من تسليم المركبة ما لم يطلب العميل استلامها. الضمان ساري لمدة 30 يوماً أو 1,000 كم على المصنعية.'
                    : 'Replaced parts are safely recycled after 48 hours unless requested at delivery. Labor warranty is valid for 30 days or 1,000 km in Qatar.'}
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsTermsOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl cursor-pointer"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Help & Workshop Support */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-[#0B3A6E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-teal-300" />
                <h3 className="font-bold text-sm">
                  {language === 'ar' ? 'المساعدة وخدمة العملاء' : 'Customer Support & Help'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-700 leading-relaxed">
                {language === 'ar'
                  ? 'فريق الدعم الفني وخدمة عملاء كار كير برو متاح لخدمتكم طوال أيام الأسبوع:'
                  : 'CarCare Pro technical support and customer reception teams are available across our Qatar workshop network:'}
              </p>

              <div className="space-y-2.5 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Doha Salwa Road Branch:</span>
                  <span className="font-mono text-[#0E9AA7] font-bold">+974 4455 6677</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Al Wakrah Branch:</span>
                  <span className="font-mono text-[#0E9AA7] font-bold">+974 4466 8899</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200">
                  <span>Working Hours:</span>
                  <span>Sat - Thu: 7:30 AM - 9:00 PM</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>
                    {language === 'ar' ? 'مراسلتنا عبر الواتساب' : 'Chat with Reception on WhatsApp'}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
