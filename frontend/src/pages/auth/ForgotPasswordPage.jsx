import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import { isValidEmail } from '../../utils/validation';
import { authApi } from '../../api/authApi';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
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
    <div className="stitch-page bg-background min-h-screen flex items-center justify-center p-stack-md font-body-md text-body-md text-on-surface">
      <main className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-stack-lg">
          <h1 className="font-h2 text-h2 text-primary flex items-center justify-center gap-stack-sm">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>work</span>
            {t('app.productName')}
          </h1>
        </div>
        {/* Main Card */}
        <div className="bg-surface-container-lowest rounded-xl ambient-shadow p-stack-lg space-y-stack-lg">
          {/* Headers */}
          <div className="text-center space-y-stack-sm">
            <h2 className="font-h3 text-h3 text-primary">{t('auth.forgotPassword.title')}</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              {t('auth.forgotPassword.description')}
            </p>
          </div>
          {/* Form Area */}
          <div className="space-y-stack-md">
            {/* Email Input */}
            <div className="space-y-stack-sm">
              <label className="font-label-sm text-label-sm text-on-surface" htmlFor="email">{t('auth.forgotPassword.emailLabel')}</label>
              <div className={`relative input-focus rounded-lg bg-surface-container-highest border ${error ? 'border-error' : 'border-outline-variant'} overflow-hidden transition-all duration-200`}>
                <span className="absolute start-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">mail</span>
                <input
                  className="w-full bg-transparent border-none py-3 ps-10 pe-4 text-on-surface placeholder:text-outline focus:ring-0 font-body-md text-body-md"
                  id="email" placeholder={t('auth.forgotPassword.emailPlaceholder')} type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(false); }}
                />
              </div>
            </div>
            {/* Error State */}
            {error && (
              <div className="flex items-start gap-stack-sm p-stack-sm bg-error-container rounded-lg border border-error/20">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
                <p className="font-body-md text-body-md text-on-error-container">{error}</p>
              </div>
            )}
            {/* Success State */}
            {success && (
              <div className="flex items-start gap-stack-sm p-stack-sm bg-[#DCFCE7] rounded-lg border border-[#22C55E]/20">
                <span className="material-symbols-outlined text-[#166534]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                <p className="font-body-md text-body-md text-[#166534]">{t('auth.forgotPassword.successMessage')}</p>
              </div>
            )}
            {/* Primary Action */}
            <button
              className={`w-full py-3 bg-secondary text-on-secondary rounded-lg font-label-sm text-label-sm flex justify-center items-center gap-stack-sm hover:opacity-90 transition-opacity ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              type="button"
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              {loading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.submit')}
              {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
            </button>
          </div>
          {/* Secondary Action */}
          <div className="text-center pt-stack-sm">
            <Link className="font-body-md text-body-md text-secondary hover:underline decoration-secondary transition-all flex items-center justify-center gap-stack-sm" to={ROUTES.LOGIN}>
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
