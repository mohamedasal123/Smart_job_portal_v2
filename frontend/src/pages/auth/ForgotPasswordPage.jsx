import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import PublicNavBar from '../../components/PublicNavBar';
import Reveal from '../../motion/Reveal';
import Stagger from '../../motion/Stagger';
import { EASE, SPRING_PRESS } from '../../motion/variants';
import { isValidEmail } from '../../utils/validation';
import { authApi } from '../../api/authApi';
import icon from '../../assets/icon.png';

const emailInputClass = (hasError) => [
  'w-full rounded-2xl border bg-surface-container-lowest/85 py-3 ps-12 pe-4 text-on-surface shadow-sm outline-none transition-all duration-300 ease-out placeholder:text-on-surface-variant hover:border-secondary/40 focus:border-secondary focus:ring-2 focus:ring-secondary/25',
  hasError ? 'border-error bg-error-container/20' : 'border-outline-variant/80',
].join(' ');

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) { setError(t('auth.forgotPassword.errors.emailRequired')); return; }
    if (!isValidEmail(email)) { setError(t('auth.forgotPassword.errors.emailInvalid')); return; }

    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSuccess(true);
    } catch {
      setError(t('auth.forgotPassword.errors.emailNotFound'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stitch-page flex min-h-screen flex-col bg-background font-body-md text-body-md text-on-surface">
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

          <Stagger className="relative space-y-stack-lg" delayChildren={0.08} staggerChildren={0.06}>
            <Stagger.Item className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-secondary/15 bg-secondary/10 p-2 shadow-sm">
                <img src={icon} alt={t('app.productName')} className="h-full w-full object-contain" />
              </div>
              <h1 className="mb-2 font-h2 text-h2 text-primary">{t('auth.forgotPassword.title')}</h1>
              <p className="font-body-md text-body-md leading-relaxed text-on-surface-variant">
                {t('auth.forgotPassword.description')}
              </p>
            </Stagger.Item>

            <Stagger.Item className="space-y-stack-md">
              <div className="space-y-stack-sm">
                <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">{t('auth.forgotPassword.emailLabel')}</label>
                <div className="relative group">
                  <span className="material-symbols-outlined pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant transition-colors group-focus-within:text-secondary">mail</span>
                  <input
                    className={emailInputClass(error)}
                    id="email" placeholder={t('auth.forgotPassword.emailPlaceholder')} type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(false); }}
                  />
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-stack-sm rounded-xl border border-error/20 bg-error-container p-stack-sm shadow-sm">
                  <span className="material-symbols-outlined shrink-0 text-error" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
                  <p className="min-w-0 break-words font-body-md text-body-md text-on-error-container">{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-stack-sm rounded-xl border border-[#22C55E]/20 bg-[#DCFCE7] p-stack-sm shadow-sm">
                  <span className="material-symbols-outlined shrink-0 text-[#166534]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                  <p className="min-w-0 break-words font-body-md text-body-md text-[#166534]">{t('auth.forgotPassword.successMessage')}</p>
                </motion.div>
              )}

              <motion.button
                className={`flex w-full items-center justify-center gap-stack-sm rounded-2xl bg-secondary py-3 font-label-sm text-label-sm text-on-secondary shadow-sm transition-all duration-300 ease-out hover:bg-secondary-container hover:shadow-hover ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                whileHover={reduce || loading ? undefined : { y: -2, transition: { duration: 0.2, ease: EASE } }}
                whileTap={reduce || loading ? undefined : { scale: 0.97, transition: SPRING_PRESS }}
              >
                {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                {loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.submit')}
                {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </motion.button>
            </Stagger.Item>

            <Stagger.Item className="border-t border-outline-variant/70 pt-stack-md text-center">
              <Link className="inline-flex items-center justify-center gap-stack-sm font-body-md text-body-md text-secondary transition-colors hover:text-secondary-container hover:underline decoration-secondary" to={ROUTES.LOGIN}>
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </Stagger.Item>
          </Stagger>
        </Reveal>
      </main>
    </div>
  );
}
