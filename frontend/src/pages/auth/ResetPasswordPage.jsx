import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import { evaluatePasswordStrength } from '../../utils/validation';
import { useToast } from '../../components/useToast';
import { authApi } from '../../api/authApi';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
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
    <div className="stitch-page bg-background min-h-screen flex flex-col font-body-md text-on-background">
      <div>
        <main className="flex-grow flex items-center justify-center p-gutter">
          <div className="w-full max-w-md">
            {/* Logo Header */}
            <div className="text-center mb-stack-lg">
              <h1 className="font-h1 text-h1 text-primary">{t('app.productName')}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mt-stack-sm">{t('auth.resetPassword.headerSubtitle')}</p>
            </div>

            {/* Reset Password Card - only show if not success */}
            {!success && (
              <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-stack-lg">
                <form className="flex flex-col gap-stack-md" onSubmit={handleSubmit}>
                  {errors.form && <p className="font-body-md text-body-md text-error text-sm">{errors.form}</p>}
                  {/* New Password Input */}
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-unit" htmlFor="new-password">{t('auth.resetPassword.newPasswordLabel')}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                      <input
                        className={`w-full ps-10 pe-4 py-2 bg-surface-container-low border ${errors.password ? 'border-error' : 'border-outline-variant'} rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors`}
                        id="new-password" name="password" placeholder={t('auth.resetPassword.newPasswordPlaceholder')} type="password"
                        value={form.password} onChange={handleChange}
                      />
                    </div>
                    {errors.password && <p className="mt-unit font-body-md text-body-md text-error text-sm">{errors.password}</p>}
                  </div>
                  {/* Password Strength Indicator */}
                  {form.password.length > 0 && (
                    <div className="flex flex-col gap-unit">
                      <div className="flex justify-between items-center">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{t('auth.resetPassword.strengthLabel')}</span>
                        <span className={`font-label-sm text-label-sm ${strength.level <= 1 ? 'text-error' : strength.level <= 2 ? 'text-[#F59E0B]' : 'text-[#22C55E]'}`}>{strength.label}</span>
                      </div>
                      <div className="flex gap-1 h-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={`flex-1 rounded-full ${i <= strength.level ? strength.color : 'bg-surface-variant'}`} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
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
                  {/* Confirm Password Input */}
                  <div>
                    <label className="block font-label-sm text-label-sm text-on-surface-variant mb-unit" htmlFor="confirm-password">{t('auth.resetPassword.confirmLabel')}</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-outline">lock_reset</span>
                      <input
                        className={`w-full ps-10 pe-4 py-2 bg-surface-container-low border ${errors.confirmPassword ? 'border-error' : 'border-outline-variant'} rounded-lg font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors`}
                        id="confirm-password" name="confirmPassword" placeholder={t('auth.resetPassword.confirmPlaceholder')} type="password"
                        value={form.confirmPassword} onChange={handleChange}
                      />
                    </div>
                    {errors.confirmPassword && <p className="mt-unit font-body-md text-body-md text-error text-sm">{errors.confirmPassword}</p>}
                    {form.confirmPassword && form.password === form.confirmPassword && !errors.confirmPassword && (
                      <p className="mt-unit font-body-md text-body-md text-[#22C55E] text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check</span> {t('auth.resetPassword.passwordsMatch')}
                      </p>
                    )}
                  </div>
                  {/* Submit */}
                  <button
                    className={`w-full bg-secondary text-on-secondary font-h3 text-h3 py-3 rounded-lg hover:bg-on-secondary-fixed-variant transition-colors mt-stack-sm flex justify-center items-center gap-2 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    type="submit" disabled={loading}
                  >
                    {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
                    {loading ? t('auth.resetPassword.resetting') : t('auth.resetPassword.submit')}
                    {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                  </button>
                </form>
                <div className="text-center mt-stack-lg">
                  <Link className="font-body-md text-body-md text-secondary hover:underline inline-flex items-center gap-1" to={ROUTES.LOGIN}>
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    {t('auth.forgotPassword.backToLogin')}
                  </Link>
                </div>
              </div>
            )}

            {/* Success State */}
            {success && (
              <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] p-stack-lg text-center">
                <div className="w-16 h-16 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto mb-stack-md">
                  <span className="material-symbols-outlined text-[#22C55E] text-[32px]">check_circle</span>
                </div>
                <h2 className="font-h2 text-h2 text-primary mb-stack-sm">{t('auth.resetPassword.successTitle')}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg">{t('auth.resetPassword.successMessage')}</p>
                <Link className="inline-block w-full bg-secondary text-on-secondary font-h3 text-h3 py-3 rounded-lg hover:bg-on-secondary-fixed-variant transition-colors" to={ROUTES.LOGIN}>
                  {t('auth.resetPassword.goToLogin')}
                </Link>
              </div>
            )}
          </div>
        </main>
        {/* Footer */}
        <footer className="w-full py-stack-lg px-margin-desktop flex justify-between items-center max-w-container-max-width mx-auto border-t border-outline-variant bg-surface-container-highest dark:bg-surface-dim">
          <div className="font-h3 text-h3 font-bold text-primary dark:text-primary-fixed">{t('app.productName')}</div>
          <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant dark:text-outline-variant text-center flex-grow mx-stack-lg">{t('footer.copyrightLong')}</div>
          <div className="flex gap-stack-md">
            <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" to={ROUTES.PRIVACY}>{t('footer.privacy')}</Link>
            <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" to={ROUTES.TERMS}>{t('footer.terms')}</Link>
            <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" to={ROUTES.HOME}>{t('footer.api')}</Link>
            <Link className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant hover:text-secondary hover:underline decoration-secondary transition-all" to={ROUTES.CONTACT}>{t('footer.support')}</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
