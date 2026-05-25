import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import { evaluatePasswordStrength, isValidEmail } from '../../utils/validation';
import { useToast } from '../../components/useToast';
import { useAuth } from '../../context/useAuth';
import { normalizeApiError } from '../../utils/apiError';
import { motion, useReducedMotion } from 'framer-motion';
import PublicNavBar from '../../components/PublicNavBar';
import Stagger from '../../motion/Stagger';
import Reveal from '../../motion/Reveal';
import { SPRING_PRESS, EASE } from '../../motion/variants';
import icon from '../../assets/icon.png';

const authInputClass = (hasError) => [
  'mt-1 w-full rounded-2xl border px-stack-md py-3 text-on-surface outline-none transition-all duration-300 ease-out placeholder:text-on-surface-variant hover:border-secondary/40 focus:border-secondary focus:ring-2 focus:ring-secondary/25',
  hasError ? 'border-error bg-error-container/20' : 'border-outline-variant/80 bg-surface-container-lowest/85 shadow-sm',
].join(' ');

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { t } = useTranslation();
  const [role, setRole] = useState('seeker');
  const [form, setForm] = useState({ fullName: '', email: '', password: '', terms: false });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const strength = evaluatePasswordStrength(form.password);
  const reduce = useReducedMotion();

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = t('auth.register.errors.nameRequired');
    if (!form.email.trim()) e.email = t('auth.register.errors.emailRequired');
    else if (!isValidEmail(form.email)) e.email = t('auth.register.errors.emailInvalid');
    if (!form.password) {
      e.password = t('auth.register.errors.passwordRequired');
    } else if (form.password.length < 8) {
      e.password = t('auth.register.errors.passwordMin');
    } else if (!/[A-Z]/.test(form.password)) {
      e.password = t('auth.register.errors.passwordUpper');
    } else if (!/[0-9]/.test(form.password)) {
      e.password = t('auth.register.errors.passwordNumber');
    }
    if (!form.terms) e.terms = t('auth.register.errors.termsRequired');
    return e;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
    if (serverError) setServerError('');
  };

  const handleBlur = (e) => {
    setTouched((p) => ({ ...p, [e.target.name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    setTouched({ fullName: true, email: true, password: true, terms: true });
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setLoading(true);
    setServerError('');
    
    // Map role
    const backendRole = role === 'recruiter' ? 'company' : 'job_seeker';

    try {
      await register({
        name: form.fullName,
        email: form.email,
        password: form.password,
        password_confirmation: form.password,
        role: backendRole,
      });
      addToast({ title: t('auth.register.toastSuccessTitle'), message: t('auth.register.toastSuccessMessage'), type: 'success' });
      navigate(ROUTES.LOGIN);
    } catch (err) {
      setServerError(normalizeApiError(err));
      addToast({ title: t('auth.register.toastErrorTitle'), message: t('errors.generic'), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const showError = (field) => touched[field] && errors[field];

  return (
    <div className="stitch-page flex min-h-screen flex-col bg-background text-on-background font-body-md text-body-md antialiased">
      <PublicNavBar showAuthActions={false} />

      <main className="relative isolate grid flex-1 overflow-hidden bg-gradient-to-br from-background via-surface-container-low/50 to-background lg:grid-cols-2">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-180px] top-[-160px] h-[460px] w-[460px] rounded-full bg-secondary/10 blur-3xl lg:hidden"
          animate={reduce ? undefined : { y: [0, -16, 0], opacity: [0.65, 0.9, 0.65] }}
          transition={reduce ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />

        <Reveal as="section" className="relative hidden overflow-hidden border-e border-outline-variant/70 bg-surface-container-low/70 p-margin-desktop lg:flex lg:flex-col lg:items-center lg:justify-center">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-secondary/10 blur-3xl"
            animate={reduce ? undefined : { y: [0, -14, 0] }}
            transition={reduce ? undefined : { duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -right-32 h-[520px] w-[520px] rounded-full bg-tertiary/10 blur-3xl"
            animate={reduce ? undefined : { y: [0, 14, 0] }}
            transition={reduce ? undefined : { duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Stagger className="relative z-10 mx-auto max-w-sm text-center" delayChildren={0.1} staggerChildren={0.1}>
            <Stagger.Item className="mx-auto mb-stack-lg flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-outline-variant/70 bg-surface-container-lowest/80 p-3 shadow-hover backdrop-blur-xl">
              <img src={icon} alt={t('app.productName')} className="h-full w-full object-contain" />
            </Stagger.Item>
            <Stagger.Item as="h2" className="mb-stack-sm font-h1 text-h1 text-primary">
              <span>{t('auth.register.heroTitle')}</span>
            </Stagger.Item>
            <Stagger.Item as="p" className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
              <span>{t('auth.register.heroDescription')}</span>
            </Stagger.Item>
          </Stagger>
        </Reveal>

        {/* Right Side: Form */}
        <section className="relative z-10 flex w-full items-center justify-center px-4 py-10 md:px-8 lg:px-12 lg:py-margin-desktop">
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-outline-variant/70 bg-surface-container-lowest/85 p-6 shadow-hover backdrop-blur-xl md:p-8"
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div aria-hidden="true" className="absolute inset-px rounded-[1.95rem] bg-gradient-to-br from-white/70 via-transparent to-secondary/10 dark:from-white/5 dark:to-secondary/15" />
            <div aria-hidden="true" className="absolute end-8 top-8 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" />

            <div className="relative mb-6 text-center">
              <motion.div 
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-secondary/15 bg-secondary/10 text-secondary shadow-sm lg:hidden"
                initial={reduce ? false : { rotate: -8, opacity: 0, scale: 0.92 }}
                animate={reduce ? { opacity: 1 } : { rotate: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                <img src={icon} alt={t('app.productName')} className="h-10 w-10 object-contain" />
              </motion.div>
              <h1 className="font-h2 text-h2 tracking-tight text-primary">{t('auth.register.title')}</h1>
              <p className="mt-1 font-body-sm text-body-sm leading-relaxed text-on-surface-variant">{t('auth.register.subtitle')}</p>
            </div>
            
            {/* Role Selection */}
            <div className="relative mb-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <motion.button
                  whileHover={reduce ? undefined : { y: -2, transition: { duration: 0.2, ease: EASE } }}
                  whileTap={reduce ? undefined : { scale: 0.95, transition: SPRING_PRESS }}
                  className={`flex min-w-0 flex-row items-center justify-center gap-2 rounded-2xl border p-3 transition-all duration-300 ${role === 'seeker' ? 'border-secondary bg-secondary/10 text-secondary shadow-sm' : 'border-outline-variant/80 bg-surface-container-lowest/85 text-on-surface-variant hover:border-secondary/40 hover:bg-surface-container-low hover:text-secondary'}`}
                  type="button"
                  onClick={() => setRole('seeker')}
                >
                  <span className="material-symbols-outlined shrink-0 text-[20px]" style={{ fontVariationSettings: role === 'seeker' ? '"FILL" 1' : '"FILL" 0' }}>person_search</span>
                  <span className="min-w-0 break-words text-center font-body-md text-body-md font-semibold">{t('auth.register.roleSeeker')}</span>
                </motion.button>
                <motion.button
                  whileHover={reduce ? undefined : { y: -2, transition: { duration: 0.2, ease: EASE } }}
                  whileTap={reduce ? undefined : { scale: 0.95, transition: SPRING_PRESS }}
                  className={`flex min-w-0 flex-row items-center justify-center gap-2 rounded-2xl border p-3 transition-all duration-300 ${role === 'recruiter' ? 'border-secondary bg-secondary/10 text-secondary shadow-sm' : 'border-outline-variant/80 bg-surface-container-lowest/85 text-on-surface-variant hover:border-secondary/40 hover:bg-surface-container-low hover:text-secondary'}`}
                  type="button"
                  onClick={() => setRole('recruiter')}
                >
                  <span className="material-symbols-outlined shrink-0 text-[20px]" style={{ fontVariationSettings: role === 'recruiter' ? '"FILL" 1' : '"FILL" 0' }}>business_center</span>
                  <span className={`min-w-0 break-words text-center font-body-md text-body-md font-semibold ${role === 'recruiter' ? '' : 'text-on-surface'}`}>{t('auth.register.roleCompany')}</span>
                </motion.button>
              </div>
            </div>

            {/* Server Error */}
            {serverError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-stack-md flex items-start gap-stack-sm rounded-xl border border-error/20 bg-error-container p-stack-sm shadow-sm"
              >
                <span className="material-symbols-outlined shrink-0 text-error" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
                <p className="min-w-0 break-words font-body-md text-body-md text-on-error-container">{serverError}</p>
              </motion.div>
            )}

            <form className="relative space-y-4" onSubmit={handleSubmit}>
              <Stagger delayChildren={0.2} staggerChildren={0.05}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <Stagger.Item>
                    <label className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider" htmlFor="fullName">{t('auth.register.nameLabel')}</label>
                    <input
                      className={authInputClass(showError('fullName'))}
                      id="fullName" name="fullName" placeholder={t('auth.register.namePlaceholder')} type="text"
                      value={form.fullName} onChange={handleChange} onBlur={handleBlur}
                    />
                    {showError('fullName') && <p className="mt-1 break-words font-body-sm text-error">{errors.fullName}</p>}
                  </Stagger.Item>

                  {/* Email */}
                  <Stagger.Item>
                    <label className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider" htmlFor="email">{t('auth.register.emailLabel')}</label>
                    <input
                      className={authInputClass(showError('email'))}
                      id="email" name="email" type="email" placeholder={t('auth.register.emailPlaceholder')}
                      value={form.email} onChange={handleChange} onBlur={handleBlur}
                    />
                    {showError('email') && <p className="mt-1 break-words font-body-sm text-error">{errors.email}</p>}
                  </Stagger.Item>
                </div>

                {/* Password */}
                <Stagger.Item className="mt-4">
                  <label className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider" htmlFor="password">{t('auth.register.passwordLabel')}</label>
                  <input
                    className={authInputClass(showError('password'))}
                    id="password" name="password" placeholder={t('auth.register.passwordPlaceholder')} type="password"
                    value={form.password} onChange={handleChange} onBlur={handleBlur}
                  />
                  {/* Password Strength Indicator */}
                  {form.password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex h-1 gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 rounded-full ${i <= strength.level ? strength.color : 'bg-surface-variant'}`} />
                        ))}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <div className="hidden sm:flex flex-wrap gap-x-3">
                          {[
                            { key: 'length', label: '8+' },
                            { key: 'uppercase', label: 'A-Z' },
                            { key: 'number', label: '0-9' },
                            { key: 'special', label: '!@#' },
                          ].map((c) => (
                            <span key={c.key} className={`text-[10px] font-bold uppercase tracking-wider ${strength.criteria[c.key] ? 'text-success' : 'text-outline'}`}>
                              {c.label}
                            </span>
                          ))}
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${strength.level <= 1 ? 'text-error' : strength.level <= 2 ? 'text-warning' : 'text-success'}`}>
                          {strength.label}
                        </span>
                      </div>
                    </div>
                  )}
                  {showError('password') && <p className="mt-1 break-words font-body-sm text-error">{errors.password}</p>}
                </Stagger.Item>

                {/* Terms */}
                <Stagger.Item className="mt-4">
                  <div className="flex items-start gap-3 rounded-xl border border-outline-variant/70 bg-surface-container-lowest/60 p-3">
                    <div className="mt-0.5 flex h-5 items-center">
                      <input className="h-4 w-4 rounded border-outline-variant bg-surface-container-lowest text-secondary accent-[#2563EB] focus:ring-secondary/50" id="terms" name="terms" type="checkbox" checked={form.terms} onChange={handleChange} />
                    </div>
                    <label className="min-w-0 break-words font-body-sm text-body-sm leading-relaxed text-on-surface-variant" htmlFor="terms">
                      {t('auth.register.termsAgree')}
                    </label>
                  </div>
                  {showError('terms') && <p className="mt-1 break-words font-body-sm text-error">{errors.terms}</p>}
                </Stagger.Item>
                
                {/* Submit */}
                <Stagger.Item className="mt-6">
                  <motion.button
                    className={`flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary py-3 font-h3 text-h3 text-on-secondary shadow-sm transition-all duration-300 ease-out hover:bg-secondary-container hover:shadow-hover ${loading ? 'cursor-not-allowed opacity-60' : ''}`}
                    type="submit" disabled={loading}
                    whileHover={reduce || loading ? undefined : { y: -2, transition: { duration: 0.2, ease: EASE } }}
                    whileTap={reduce || loading ? undefined : { scale: 0.97, transition: SPRING_PRESS }}
                  >
                    {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                    {loading ? t('auth.register.creating') : t('auth.register.submit')}
                  </motion.button>
                </Stagger.Item>
              </Stagger>
            </form>
            
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.5 }}
              className="relative mt-6 border-t border-outline-variant/70 pt-4 text-center"
            >
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t('auth.register.haveAccount')} <Link className="font-semibold text-secondary transition-colors hover:text-secondary-container hover:underline" to={ROUTES.LOGIN}>{t('auth.register.signIn')}</Link>
              </p>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
