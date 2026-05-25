import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import { evaluatePasswordStrength } from '../../utils/validation';
import { useToast } from '../../components/useToast';
import { authApi } from '../../api/authApi';
import PublicNavBar from '../../components/PublicNavBar';
import Reveal from '../../motion/Reveal';
import Stagger from '../../motion/Stagger';
import { EASE, SPRING_PRESS } from '../../motion/variants';
import icon from '../../assets/icon.png';

const passwordInputClass = (hasError) => [
  'w-full rounded-2xl border py-3 ps-12 pe-4 font-body-md text-body-md text-on-surface shadow-sm outline-none transition-all duration-300 ease-out placeholder:text-on-surface-variant hover:border-secondary/40 focus:border-secondary focus:ring-2 focus:ring-secondary/25',
  hasError ? 'border-error bg-error-container/20' : 'border-outline-variant/80 bg-surface-container-lowest/85',
].join(' ');

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const reduce = useReducedMotion();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = evaluatePasswordStrength(form.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (!token || !email) e.form = t('auth.resetPassword.errors.invalidLink');
    if (!form.password) e.password = t('auth.resetPassword.errors.passwordRequired');
    else if (form.password.length < 8) e.password = t('auth.resetPassword.errors.passwordMin');
    else if (!/[A-Z]/.test(form.password)) e.password = t('auth.resetPassword.errors.passwordUpper');
    else if (!/[0-9]/.test(form.password)) e.password = t('auth.resetPassword.errors.passwordNumber');
    if (!form.confirmPassword) e.confirmPassword = t('auth.resetPassword.errors.confirmRequired');
    else if (form.password !== form.confirmPassword) e.confirmPassword = t('auth.resetPassword.errors.confirmMatch');
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setLoading(true);
    try {
      await authApi.resetPassword({
        token: searchParams.get('token'),
        email: searchParams.get('email'),
        password: form.password,
        password_confirmation: form.confirmPassword,
      });
      setSuccess(true);
      addToast({ title: t('auth.resetPassword.toastSuccessTitle'), message: t('auth.resetPassword.toastSuccessMessage'), type: 'success' });
    } catch {
      addToast({ title: t('auth.resetPassword.toastErrorTitle'), message: t('auth.resetPassword.toastErrorMessage'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stitch-page flex min-h-screen flex-col bg-background font-body-md text-on-background">
      <PublicNavBar showAuthActions={false} />

      <main className="relative isolate flex flex-grow items-center justify-center overflow-hidden px-4 py-10 sm:px-gutter lg:px-margin-desktop">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-180px] top-[-160px] h-[460px] w-[460px] rounded-full bg-secondary/10 blur-3xl"
          animate={reduce ? undefined : { y: [0, -16, 0], opacity: [0.65, 0.9, 0.65] }}
          transition={reduce ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-180px] left-[-180px] h-[460px] w-[460px] rounded-full bg-tertiary/10 blur-3xl"
          animate={reduce ? undefined : { y: [0, 18, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={reduce ? undefined : { duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />

        <Reveal as="section" className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-outline-variant/70 bg-surface-container-lowest/85 p-6 shadow-hover backdrop-blur-xl sm:p-8">
          <div aria-hidden="true" className="absolute inset-px rounded-[1.95rem] bg-gradient-to-br from-white/70 via-transparent to-secondary/10 dark:from-white/5 dark:to-secondary/15" />
          <div aria-hidden="true" className="absolute end-8 top-8 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" />

          <Stagger className="relative" delayChildren={0.08} staggerChildren={0.06}>
            <Stagger.Item className="mb-stack-lg text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-secondary/15 bg-secondary/10 p-2 shadow-sm">
                <img src={icon} alt={t('app.productName')} className="h-full w-full object-contain" />
              </div>
              <h1 className="font-h2 text-h2 text-primary">{t('app.productName')}</h1>
              <p className="mt-stack-sm font-body-lg text-body-lg leading-relaxed text-on-surface-variant">{t('auth.resetPassword.headerSubtitle')}</p>
            </Stagger.Item>

            {!success && (
              <Stagger.Item>
                <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
                  {errors.form && <p className="break-words rounded-xl border border-error/20 bg-error-container p-stack-sm font-body-md text-body-md text-sm text-error">{errors.form}</p>}

                  <div>
                    <label className="mb-unit block font-label-sm text-label-sm text-on-surface-variant" htmlFor="new-password">{t('auth.resetPassword.newPasswordLabel')}</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant transition-colors group-focus-within:text-secondary">lock</span>
                      <input
                        className={passwordInputClass(errors.password)}
                        id="new-password" name="password" placeholder={t('auth.resetPassword.newPasswordPlaceholder')} type="password"
                        value={form.password} onChange={handleChange}
                      />
                    </div>
                    {errors.password && <p className="mt-unit break-words font-body-md text-body-md text-sm text-error">{errors.password}</p>}
                  </div>

                  {form.password.length > 0 && (
                    <div className="flex flex-col gap-unit rounded-xl border border-outline-variant/70 bg-surface-container-lowest/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{t('auth.resetPassword.strengthLabel')}</span>
                        <span className={`font-label-sm text-label-sm ${strength.level <= 1 ? 'text-error' : strength.level <= 2 ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>{strength.label}</span>
                      </div>
                      <div className="flex h-2 gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 rounded-full ${i <= strength.level ? strength.color : 'bg-surface-variant'}`} />
                        ))}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {[
                          { key: 'length', labelKey: 'auth.resetPassword.strength.characters' },
                          { key: 'uppercase', labelKey: 'auth.resetPassword.strength.uppercase' },
                          { key: 'number', labelKey: 'auth.resetPassword.strength.number' },
                          { key: 'special', labelKey: 'auth.resetPassword.strength.symbol' },
                        ].map((c) => (
                          <span key={c.key} className={`font-label-sm text-[11px] ${strength.criteria[c.key] ? 'text-[#22C55E]' : 'text-outline'}`}>
                            {strength.criteria[c.key] ? '✓' : '○'} {t(c.labelKey)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-unit block font-label-sm text-label-sm text-on-surface-variant" htmlFor="confirm-password">{t('auth.resetPassword.confirmLabel')}</label>
                    <div className="relative group">
                      <span className="material-symbols-outlined pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant transition-colors group-focus-within:text-secondary">lock_reset</span>
                      <input
                        className={passwordInputClass(errors.confirmPassword)}
                        id="confirm-password" name="confirmPassword" placeholder={t('auth.resetPassword.confirmPlaceholder')} type="password"
                        value={form.confirmPassword} onChange={handleChange}
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-unit break-words font-body-md text-body-md text-sm text-error">{errors.confirmPassword}</p>}
                    {form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword && (
                      <p className="mt-unit flex items-center gap-1 font-body-md text-body-md text-sm text-[#22C55E]">
                        <span className="material-symbols-outlined text-[14px]">check</span> {t('auth.resetPassword.passwordsMatch')}
                      </p>
                    )}
                  </div>

                  <motion.button
                    className={`mt-stack-sm flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-3 font-h3 text-h3 text-on-secondary shadow-sm transition-all duration-300 ease-out hover:bg-secondary-container hover:shadow-hover ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
                    type="submit" disabled={loading}
                    whileHover={reduce || loading ? undefined : { y: -2, transition: { duration: 0.2, ease: EASE } }}
                    whileTap={reduce || loading ? undefined : { scale: 0.97, transition: SPRING_PRESS }}
                  >
                    {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                    {loading ? t('auth.resetPassword.resetting') : t('auth.resetPassword.submit')}
                    {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                  </motion.button>
                </form>

                <div className="mt-stack-lg border-t border-outline-variant/70 pt-stack-md text-center">
                  <Link className="inline-flex items-center gap-1 font-body-md text-body-md text-secondary transition-colors hover:text-secondary-container hover:underline" to={ROUTES.LOGIN}>
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </div>
              </Stagger.Item>
            )}

            {success && (
              <Stagger.Item className="text-center">
                <div className="mx-auto mb-stack-md flex h-16 w-16 items-center justify-center rounded-2xl bg-[#22C55E]/10 shadow-sm">
                  <span className="material-symbols-outlined text-[32px] text-[#22C55E]">check_circle</span>
                </div>
                <h2 className="mb-stack-sm font-h2 text-h2 text-primary">{t('auth.resetPassword.successTitle')}</h2>
                <p className="mb-stack-lg break-words font-body-md text-body-md leading-relaxed text-on-surface-variant">{t('auth.resetPassword.successMessage')}</p>
                <motion.div whileTap={reduce ? undefined : { scale: 0.97, transition: SPRING_PRESS }}>
                  <Link className="inline-flex w-full items-center justify-center rounded-2xl bg-secondary py-3 font-h3 text-h3 text-on-secondary shadow-sm transition-all duration-300 hover:bg-secondary-container hover:shadow-hover" to={ROUTES.LOGIN}>
                    {t('auth.resetPassword.goToLogin')}
                  </Link>
                </motion.div>
              </Stagger.Item>
            )}
          </Stagger>
        </Reveal>
      </main>

      <footer className="mx-auto flex w-full max-w-container-max-width flex-col items-center justify-between gap-4 border-t border-outline-variant bg-surface-container-lowest px-4 py-stack-lg sm:px-gutter lg:flex-row lg:px-margin-desktop dark:bg-surface-dim">
        <div className="font-h3 text-h3 font-bold text-primary dark:text-primary-fixed">{t('app.productName')}</div>
        <div className="text-center font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant dark:text-outline-variant">{t('footer.copyrightLong')}</div>
        <div className="flex flex-wrap justify-center gap-stack-md">
          <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant transition-all hover:text-secondary hover:underline decoration-secondary" to={ROUTES.PRIVACY}>{t('footer.privacy')}</Link>
          <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant transition-all hover:text-secondary hover:underline decoration-secondary" to={ROUTES.TERMS}>{t('footer.terms')}</Link>
          <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant transition-all hover:text-secondary hover:underline decoration-secondary" to={ROUTES.HOME}>{t('footer.api')}</Link>
          <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant transition-all hover:text-secondary hover:underline decoration-secondary" to={ROUTES.CONTACT}>{t('footer.support')}</Link>
        </div>
      </footer>
    </div>
  );
}
