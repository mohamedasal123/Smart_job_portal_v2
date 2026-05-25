import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ROUTES, getRoleRedirect, normalizeRole } from '../../utils/constants';
import PublicNavBar from '../../components/PublicNavBar';
import { useToast } from '../../components/useToast';
import { useAuth } from '../../context/useAuth';
import { normalizeApiError } from '../../utils/apiError';
import Stagger from '../../motion/Stagger';
import Reveal from '../../motion/Reveal';
import { SPRING_PRESS, EASE } from '../../motion/variants';
import icon from '../../assets/icon.png';

const isRedirectAllowedForRole = (target, role) => {
  if (!target || target === ROUTES.UNAUTHORIZED || target === '/403') return false;

  const normalizedRole = normalizeRole(role);
  if (target.startsWith('/admin')) return normalizedRole === 'admin';
  if (target.startsWith('/company')) return normalizedRole === 'company';
  if (target.startsWith('/seeker')) return normalizedRole === 'job_seeker';
  return true;
};

const safePostLoginRedirect = (role, candidates) => {
  const target = candidates.find((candidate) => isRedirectAllowedForRole(candidate, role));
  return target || getRoleRedirect(role) || ROUTES.HOME;
};

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const reduce = useReducedMotion();
  const { t } = useTranslation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // 1. التوجيه هيحصل هنا بس! لما الـ user state تتحدث فعلياً
  useEffect(() => {
    if (user) {
      // Priority: explicit router state (ProtectedRoute) > sessionStorage
      // (axios 401 interceptor stash) > role default. The sessionStorage
      // entry is consumed once and then cleared.
      const fromLocation = location.state?.from;
      const fromState = fromLocation?.pathname
        ? `${fromLocation.pathname}${fromLocation.search || ''}`
        : null;
      let stashed = null;
      try {
        stashed = sessionStorage.getItem('postLoginRedirect');
        if (stashed) sessionStorage.removeItem('postLoginRedirect');
      } catch {
        // sessionStorage unavailable — fall through to defaults.
      }
      const target = safePostLoginRedirect(user.role, [fromState, stashed]);
      navigate(target, { replace: true });
    }
  }, [user, navigate, location]);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = t('auth.login.errors.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('auth.login.errors.emailInvalid');
    if (!form.password) e.password = t('auth.login.errors.passwordRequired');
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }

    setLoading(true);
    setServerError('');

    try {
      // 2. بننده دالة اللوجين من الكونتكست، والمفروض الدالة دي بتعمل setUser
      await login(form);
      addToast({ title: t('auth.login.toastTitle'), message: t('auth.login.toastMessage'), type: 'success' });

      // شيلنا الـ navigate من هنا عشان ميعملش تضارب مع الـ useEffect
      // شيلنا الـ flushSync لأن ملهاش لازمة هنا وكانت ممكن تعمل مشاكل

    } catch (err) {
      setServerError(normalizeApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stitch-page bg-background text-on-background font-body-md text-body-md antialiased min-h-screen flex flex-col">
      <PublicNavBar showAuthActions={false} />

      <main className="flex-1 grid lg:grid-cols-2 bg-background">
        <Reveal as="section" className="hidden lg:flex flex-col justify-center items-center p-margin-desktop bg-surface-container-low relative overflow-hidden">
          <motion.div
            aria-hidden="true"
            className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--secondary) 0%, transparent 65%)' }}
            animate={reduce ? undefined : { y: [0, -14, 0] }}
            transition={reduce ? undefined : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full opacity-10 pointer-events-none"
            style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 65%)' }}
            animate={reduce ? undefined : { y: [0, 14, 0] }}
            transition={reduce ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Stagger className="relative z-10 text-center max-w-lg" delayChildren={0.1} staggerChildren={0.1}>
            <Stagger.Item className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-stack-lg">
              <img src={icon} alt={t('app.productName')} className="w-full h-full object-contain" />
            </Stagger.Item>
            <Stagger.Item as="h1" className="font-h1 text-h1 text-primary mb-stack-md">
              <span>{t('auth.login.heroTitle')}</span>
            </Stagger.Item>
            <Stagger.Item as="p" className="font-body-lg text-body-lg text-on-surface-variant">
              <span>{t('auth.login.heroDescription')}</span>
            </Stagger.Item>
          </Stagger>
        </Reveal>

        <section className="flex items-center justify-center px-gutter py-margin-desktop relative z-10">
          <motion.div
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-stack-lg"
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="mb-stack-lg text-center">
              <motion.div 
                className="w-16 h-16 mx-auto bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-4 lg:hidden"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <img src={icon} alt={t('app.productName')} className="w-10 h-10 object-contain" />
              </motion.div>
              <h2 className="font-h1 text-h1 text-primary">{t('auth.login.welcomeBack')}</h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-2">
                {t('auth.login.subtitle')}
              </p>
            </div>

            {serverError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-stack-sm p-stack-sm bg-error-container rounded-lg border border-error/20 mb-stack-md"
              >
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
                <p className="font-body-md text-body-md text-on-error-container">{serverError}</p>
              </motion.div>
            )}

            <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
              <Stagger delayChildren={0.2} staggerChildren={0.05}>
                <Stagger.Item>
                  <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">{t('auth.login.emailLabel')}</label>
                  <input
                    className={`mt-unit w-full rounded-lg border ${errors.email ? 'border-error bg-error-container/20' : 'border-outline-variant bg-surface-container-lowest'} px-stack-md py-stack-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all`}
                    id="email"
                    name="email"
                    placeholder={t('auth.login.emailPlaceholder')}
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <p className="mt-unit font-body-md text-body-md text-error text-sm">{errors.email}</p>}
                </Stagger.Item>

                <Stagger.Item className="mt-4">
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-label-sm text-on-surface" htmlFor="password">{t('auth.login.passwordLabel')}</label>
                    <Link className="font-label-sm text-label-sm text-secondary hover:underline" to="/forgot-password">{t('auth.login.forgotPassword')}</Link>
                  </div>
                  <input
                    className={`mt-unit w-full rounded-lg border ${errors.password ? 'border-error bg-error-container/20' : 'border-outline-variant bg-surface-container-lowest'} px-stack-md py-stack-sm text-on-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all`}
                    id="password"
                    name="password"
                    placeholder={t('auth.login.passwordPlaceholder')}
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                  />
                  {errors.password && <p className="mt-unit font-body-md text-body-md text-error text-sm">{errors.password}</p>}
                </Stagger.Item>

                <Stagger.Item className="mt-8">
                  <motion.button
                    className={`w-full bg-secondary text-on-secondary font-h3 text-h3 py-3 rounded-lg hover:bg-secondary-container transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : 'shadow-md hover:shadow-lg hover:-translate-y-0.5'}`}
                    type="submit"
                    disabled={loading}
                    whileTap={reduce || loading ? undefined : { scale: 0.97, transition: SPRING_PRESS }}
                  >
                    {loading && <span className="material-symbols-outlined animate-spin text-[18px]" aria-hidden="true">progress_activity</span>}
                    {loading ? t('auth.login.signingIn') : t('auth.login.submit')}
                  </motion.button>
                </Stagger.Item>
              </Stagger>
            </form>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.5 }}
              className="mt-stack-lg text-center pt-6 border-t border-outline-variant"
            >
              <p className="font-body-md text-body-md text-on-surface-variant">
                {t('auth.login.newHere')}{' '}
                <Link className="text-secondary font-semibold hover:underline" to={ROUTES.REGISTER}>{t('auth.login.createAccount')}</Link>
              </p>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
