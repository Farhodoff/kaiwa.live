import { Loader2, Lock, Mail, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';
import { AppLogo } from '../components/AppLogo';
import { motion, AnimatePresence } from 'framer-motion';
import { getSafeRedirectUrl } from '../utils/redirect';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const targetPath = getSafeRedirectUrl(redirectParam, '/');

  const isRegisterPath =
    location.pathname === '/register' ||
    location.pathname === '/signup' ||
    searchParams.get('mode') === 'register' ||
    searchParams.get('mode') === 'signup';

  const [isLogin, setIsLogin] = useState(() => !isRegisterPath);
  const [isResetPassword, setIsResetPassword] = useState(() => {
    if (typeof window !== 'undefined') {
      return (
        window.location.pathname.includes('reset-password') ||
        window.location.hash.includes('type=recovery') ||
        window.location.search.includes('type=recovery')
      );
    }
    return false;
  });

  useEffect(() => {
    if (isRegisterPath) {
      setIsLogin(false);
    } else if (location.pathname === '/login' || searchParams.get('mode') === 'login') {
      setIsLogin(true);
    }

    if (
      location.pathname.includes('reset-password') ||
      window.location.hash.includes('type=recovery') ||
      window.location.search.includes('type=recovery')
    ) {
      setIsResetPassword(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !isResetPassword) {
        navigate(targetPath, { replace: true });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPassword(true);
      } else if (event === 'SIGNED_IN' && session && !isResetPassword) {
        navigate(targetPath, { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [location.pathname, searchParams, isRegisterPath, targetPath, navigate, isResetPassword]);

  const [resetSuccess, setResetSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isResetPassword) {
      if (!password || password.length < 6) {
        setError("Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak");
        return;
      }
      if (password !== confirmPassword) {
        setError('Kiritilgan parollar bir-biriga mos kelmadi');
        return;
      }

      setLoading(true);
      try {
        const { error: resetErr } = await supabase.auth.updateUser({
          password,
        });
        if (resetErr) throw resetErr;
        setResetSuccess(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Parolni yangilashda xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError('Kiritilgan parollar bir-biriga mos kelmadi');
        return;
      }
      if (!agreedToTerms) {
        setError('Foydalanish shartlari va Maxfiylik siyosatiga rozilik bildiring');
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data: loginData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (loginData?.session) {
          navigate(targetPath, { replace: true });
          return;
        }
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName || email)}`,
            },
          },
        });
        if (signUpError) throw signUpError;

        if (signUpData?.session) {
          navigate(targetPath, { replace: true });
          return;
        }

        // Try automatic sign in
        try {
          const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!loginErr && loginData?.session) {
            navigate(targetPath, { replace: true });
            return;
          }
        } catch {
          // Supabase email confirm flow
        }

        setIsRegistered(true);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen select-none items-center justify-center overflow-hidden bg-background p-4 font-sans text-foreground sm:p-6 md:p-8">
      {/* Ambient Sumi-e & Hanko Background Glows */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#C9A961]/10 blur-[130px]" />

      {/* Auth Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-[490px] rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8 md:p-10"
      >
        {resetSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 py-6 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Lock size={32} />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Parol yangilandi!
            </h2>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              Yangi parolingiz muvaffaqiyatli saqlandi. Endi yangi parol bilan tizimga kirishingiz
              mumkin.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setResetSuccess(false);
                  setIsResetPassword(false);
                  setIsLogin(true);
                  if (typeof window !== 'undefined' && window.history.replaceState) {
                    window.history.replaceState(null, '', '/login');
                  }
                  navigate('/login', { replace: true });
                }}
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:bg-primary/90"
              >
                Kirish sahifasiga o'tish
              </button>
            </div>
          </motion.div>
        ) : isRegistered ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4 py-6 text-center"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C9A961]/30 bg-[#C9A961]/15 text-[#C9A961] shadow-lg shadow-[#C9A961]/10">
              <Mail size={32} />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Emailingizni tekshiring!
            </h2>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
              Biz <span className="font-semibold text-foreground">{email}</span> manziliga
              tasdiqlash xatini yubordik. Akkauntingizni faollashtirish uchun xatdagi link ustiga
              bosing va tizimga kiring.
            </p>
            <div className="pt-4">
              <button
                onClick={() => {
                  setIsRegistered(false);
                  setIsLogin(true);
                  navigate('/login', { replace: true });
                }}
                className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:bg-primary/90"
              >
                Kirish sahifasiga qaytish
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Top Back Link */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="group mb-6 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
              <span>Bosh sahifaga qaytish</span>
            </button>

            {/* Brand Logo & Tagline */}
            <div className="mb-6 flex flex-col items-center text-center">
              {/* Torii Gate Brand Logo */}
              <div className="mb-4 cursor-pointer" onClick={() => navigate('/')}>
                <AppLogo size="lg" />
              </div>

              {/* Main Mode Heading */}
              <div className="mt-2 space-y-1">
                <h1 className="font-display text-2xl font-black tracking-tight text-foreground sm:text-[28px]">
                  {isResetPassword
                    ? "Yangi parol o'rnatish"
                    : isLogin
                      ? 'Hisobingizga kiring'
                      : "Ro'yxatdan o'tish"}
                </h1>
                <p className="mx-auto max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
                  {isResetPassword
                    ? 'Akkauntingiz uchun yangi xavfsiz parol kiriting.'
                    : isLogin
                      ? "O'quv jarayoningizni davom ettirish uchun hisobingizga kiring"
                      : "Yangi hisob yarating va bepul o'rganishni boshlang"}
                </p>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -6 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -6 }}
                  className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
                >
                  <span className="shrink-0 text-sm">⚠️</span>
                  <span className="leading-snug">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              {/* Full Name field (Register only) */}
              {!isLogin && !isResetPassword && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5"
                >
                  <label className="block text-xs font-semibold text-foreground">To'liq ism</label>
                  <div className="relative">
                    <User
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ism Familiyangizni kiriting"
                      required
                      className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm text-foreground shadow-xs outline-none transition-all placeholder:text-muted-foreground/60 hover:border-border/80 focus:border-primary"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email field */}
              {!isResetPassword && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground">
                    Email manzil
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email manzilingizni kiriting"
                      autoComplete="email"
                      required
                      className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm text-foreground shadow-xs outline-none transition-all placeholder:text-muted-foreground/60 hover:border-border/80 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  {isResetPassword ? 'Yangi parol' : 'Parol'}
                </label>
                <div className="relative">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={
                      isLogin || isResetPassword
                        ? 'Parolingizni kiriting'
                        : "Kamida 6 ta belgidan iborat bo'lsin"
                    }
                    autoComplete={isLogin && !isResetPassword ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-11 text-sm text-foreground shadow-xs outline-none transition-all placeholder:text-muted-foreground/60 hover:border-border/80 focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password field (Register or Reset Password) */}
              {(!isLogin || isResetPassword) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-1.5"
                >
                  <label className="block text-xs font-semibold text-foreground">
                    {isResetPassword ? 'Yangi parolni tasdiqlang' : 'Parolni tasdiqlang'}
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={
                        isResetPassword
                          ? 'Yangi parolingizni qayta kiriting'
                          : 'Parolingizni qayta kiriting'
                      }
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-11 text-sm text-foreground shadow-xs outline-none transition-all placeholder:text-muted-foreground/60 hover:border-border/80 focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Terms & Privacy checkbox (Register only) */}
              {!isLogin && !isResetPassword && (
                <div className="flex items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border bg-background text-primary accent-primary focus:ring-primary focus:ring-offset-0"
                  />
                  <label
                    htmlFor="terms"
                    className="cursor-pointer select-none text-xs leading-relaxed text-muted-foreground"
                  >
                    Men <span className="text-primary hover:underline">Foydalanish shartlari</span>{' '}
                    va <span className="text-primary hover:underline">Maxfiylik siyosati</span>{' '}
                    bilan tanishib chiqdim va roziman
                  </label>
                </div>
              )}

              {/* Forgot Password Link (Login only) */}
              {isLogin && !isResetPassword && (
                <div className="pt-0.5 text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-primary sm:text-sm"
                  >
                    Parolni unutdingizmi?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isResetPassword ? (
                    'Parolni yangilash'
                  ) : isLogin ? (
                    'Kirish'
                  ) : (
                    "Ro'yxatdan o'tish"
                  )}
                </button>
              </div>
            </form>

            {/* Bottom Switch Link or Cancel Reset Link */}
            {isResetPassword ? (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(false);
                    setIsLogin(true);
                    setError('');
                    const redirectQuery = redirectParam
                      ? `?redirect=${encodeURIComponent(redirectParam)}`
                      : '';
                    navigate(`/login${redirectQuery}`, { replace: true });
                  }}
                  className="cursor-pointer text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  Bekor qilish va kirish sahifasiga qaytish
                </button>
              </div>
            ) : (
              <div className="mt-8 flex items-center justify-center gap-2 text-xs sm:text-sm">
                <span className="h-[1px] w-6 bg-border sm:w-10" />
                <span className="text-muted-foreground">
                  {isLogin ? "Akkauntingiz yo'qmi?" : 'Akkauntingiz bormi?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isLogin;
                    setIsLogin(nextState);
                    setError('');
                    const redirectQuery = redirectParam
                      ? `?redirect=${encodeURIComponent(redirectParam)}`
                      : '';
                    navigate(nextState ? `/login${redirectQuery}` : `/register${redirectQuery}`, {
                      replace: true,
                    });
                  }}
                  className="cursor-pointer font-bold text-primary transition-colors hover:underline"
                >
                  {isLogin ? "Ro'yxatdan o'tish" : 'Kirish'}
                </button>
                <span className="h-[1px] w-6 bg-border sm:w-10" />
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  );
};

export default AuthPage;
