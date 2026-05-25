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
          <Stagger className="relative z-10 max-w-sm mx-auto text-center" delayChildren={0.1} staggerChildren={0.1}>
            <Stagger.Item className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-stack-lg">
              <img src={icon} alt={t('app.productName')} className="w-full h-full object-contain" />
            </Stagger.Item>
            <Stagger.Item as="h2" className="font-h1 text-h1 text-primary mb-stack-sm">
              <span>{t('auth.register.heroTitle')}</span>
            </Stagger.Item>
            <Stagger.Item as="p" className="font-body-lg text-body-lg text-on-surface-variant">
              <span>{t('auth.register.heroDescription')}</span>
            </Stagger.Item>
          </Stagger>
        </Reveal>

        {/* Right Side: Form */}
        <section className="flex items-center justify-center px-4 py-8 md:px-8 lg:px-12 relative z-10 w-full">
          <motion.div
            className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-6 md:p-8"
            initial={reduce ? false : { opacity: 0, scale: 0.95 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="text-center mb-6">
              <motion.div 
                className="w-16 h-16 mx-auto bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-4 lg:hidden"
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: EASE }}
              >
                <img src={icon} alt={t('app.productName')} className="w-10 h-10 object-contain" />
              </motion.div>
              <h1 className="font-h2 text-h2 text-primary tracking-tight">{t('auth.register.title')}</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">{t('auth.register.subtitle')}</p>
            </div>
            
            {/* Role Selection */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={reduce ? undefined : { scale: 0.95, transition: SPRING_PRESS }}
                  className={`flex flex-row items-center justify-center gap-2 p-3 rounded-lg border transition-all ${role === 'seeker' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'}`}
                  type="button"
                  onClick={() => setRole('seeker')}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: role === 'seeker' ? '"FILL" 1' : '"FILL" 0' }}>person_search</span>
                  <span className="font-body-md text-body-md font-semibold text-center">{t('auth.register.roleSeeker')}</span>
                </motion.button>
                <motion.button
                  whileTap={reduce ? undefined : { scale: 0.95, transition: SPRING_PRESS }}
                  className={`flex flex-row items-center justify-center gap-2 p-3 rounded-lg border transition-all ${role === 'recruiter' ? 'border-secondary bg-secondary/10 text-secondary' : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'}`}
                  type="button"
                  onClick={() => setRole('recruiter')}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: role === 'recruiter' ? '"FILL" 1' : '"FILL" 0' }}>business_center</span>
                  <span className={`font-body-md text-body-md font-semibold text-center ${role === 'recruiter' ? '' : 'text-on-surface'}`}>{t('auth.register.roleCompany')}</span>
                </motion.button>
              </div>
            </div>

            {/* Server Error */}
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

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Stagger delayChildren={0.2} staggerChildren={0.05}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <Stagger.Item>
                    <label className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider" htmlFor="fullName">{t('auth.register.nameLabel')}</label>
                    <input
                      className={`mt-1 w-full rounded-lg border ${showError('fullName') ? 'bg-error-container/20 border-error' : 'bg-surface-container-lowest border-outline-variant'} px-3 py-2 text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all`}
                      id="fullName" name="fullName" placeholder={t('auth.register.namePlaceholder')} type="text"
                      value={form.fullName} onChange={handleChange} onBlur={handleBlur}
                    />
                    {showError('fullName') && <p className="mt-1 font-body-sm text-error">{errors.fullName}</p>}
                  </Stagger.Item>

                  {/* Email */}
                  <Stagger.Item>
                    <label className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider" htmlFor="email">{t('auth.register.emailLabel')}</label>
                    <input
                      className={`mt-1 w-full rounded-lg border ${showError('email') ? 'bg-error-container/20 border-error' : 'bg-surface-container-lowest border-outline-variant'} px-3 py-2 text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all`}
                      id="email" name="email" type="email" placeholder={t('auth.register.emailPlaceholder')}
                      value={form.email} onChange={handleChange} onBlur={handleBlur}
                    />
                    {showError('email') && <p className="mt-1 font-body-sm text-error">{errors.email}</p>}
                  </Stagger.Item>
                </div>

                {/* Password */}
                <Stagger.Item className="mt-4">
                  <label className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider" htmlFor="password">{t('auth.register.passwordLabel')}</label>
                  <input
                    className={`mt-1 w-full rounded-lg border ${showError('password') ? 'bg-error-container/20 border-error' : 'bg-surface-container-lowest border-outline-variant'} px-3 py-2 text-on-surface focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all`}
                    id="password" name="password" placeholder={t('auth.register.passwordPlaceholder')} type="password"
                    value={form.password} onChange={handleChange} onBlur={handleBlur}
                  />
                  {/* Password Strength Indicator */}
                  {form.password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 h-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 rounded-full ${i <= strength.level ? strength.color : 'bg-surface-variant'}`} />
                        ))}
                      </div>
                      <div className="mt-1 flex justify-between items-center">
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
                  {showError('password') && <p className="mt-1 font-body-sm text-error">{errors.password}</p>}
                </Stagger.Item>

                {/* Terms */}
                <Stagger.Item className="mt-4">
                  <div className="flex items-start gap-2 pt-2">
                    <div className="flex items-center h-5 mt-0.5">
                      <input className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary/50 bg-surface-container-lowest" id="terms" name="terms" type="checkbox" checked={form.terms} onChange={handleChange} />
                    </div>
                    <label className="font-body-sm text-body-sm text-on-surface-variant leading-tight" htmlFor="terms">
                      {t('auth.register.termsAgree')}
                    </label>
                  </div>
                  {showError('terms') && <p className="mt-1 font-body-sm text-error">{errors.terms}</p>}
                </Stagger.Item>
                
                {/* Submit */}
                <Stagger.Item className="mt-6">
                  <motion.button
                    className={`w-full bg-secondary text-on-secondary font-h3 text-h3 py-2.5 rounded-lg hover:bg-secondary-container transition-all shadow-sm flex items-center justify-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5'}`}
                    type="submit" disabled={loading}
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
              className="mt-6 text-center border-t border-outline-variant pt-4"
            >
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {t('auth.register.haveAccount')} <Link className="text-secondary font-semibold hover:underline" to={ROUTES.LOGIN}>{t('auth.register.signIn')}</Link>
              </p>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}