import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import { useToast } from '../../components/useToast';
import { useAuth } from '../../context/useAuth';
import { updateSettings, verifyPassword } from '../../services/jobSeekerDataService';

const buttonPrimary = 'inline-flex items-center justify-center gap-unit rounded-lg bg-secondary px-stack-md py-stack-sm font-h3 text-h3 text-on-secondary shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50';
const buttonSecondary = 'inline-flex items-center justify-center gap-unit rounded-lg border border-outline-variant px-stack-md py-stack-sm font-h3 text-h3 text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="font-label-md text-label-md text-primary">{label}</span>
      <div className="mt-unit">{children}</div>
      {error && <p className="mt-unit font-body-sm text-body-sm text-error">{error}</p>}
    </label>
  );
}

function TextInput(props) {
  return <input className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 disabled:opacity-50" {...props} />;
}

export default function JobSeekerSettingsPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { user, refreshUser } = useAuth();
  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [unlockState, setUnlockState] = useState({ email: false, password: false });
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!user) return;
    setSettings((prev) => ({
      ...prev,
      name: user.name || '',
      email: user.email || '',
    }));
  }, [user]);

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const startVerify = (target) => {
    setVerifyTarget(target);
    setVerifyInput('');
    setVerifyError('');
  };

  const cancelVerify = () => {
    setVerifyTarget(null);
    setVerifyInput('');
    setVerifyError('');
  };

  const confirmVerify = async () => {
    if (!verifyInput) return;
    setVerifying(true);
    setVerifyError('');

    try {
      await verifyPassword(verifyInput);
      setUnlockState((prev) => ({ ...prev, [verifyTarget]: true }));
      setSettings((prev) => ({ ...prev, currentPassword: verifyInput }));
      setVerifyTarget(null);
      setVerifyInput('');
    } catch {
      setVerifyError(t('seekerSettings.security.incorrect'));
    } finally {
      setVerifying(false);
    }
  };

  const validate = () => {
    const nextErrors = {};
    if (!settings.name.trim()) nextErrors.name = t('seekerSettings.errors.nameRequired');
    if (unlockState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) nextErrors.email = t('seekerSettings.errors.emailInvalid');

    if (unlockState.password) {
      if (!settings.newPassword || settings.newPassword.length < 8) nextErrors.newPassword = t('seekerSettings.errors.passwordMin');
      if (settings.newPassword !== settings.confirmPassword) nextErrors.confirmPassword = t('seekerSettings.errors.passwordMatch');
    }

    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);

    try {
      await updateSettings({
        name: settings.name,
        email: unlockState.email ? settings.email : undefined,
        currentPassword: settings.currentPassword || undefined,
        newPassword: unlockState.password ? settings.newPassword : undefined,
      });
      await refreshUser?.();
      addToast({ title: t('seekerSettings.toasts.savedTitle'), message: t('seekerSettings.toasts.savedMessage'), type: 'success' });
      setSettings((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setUnlockState({ email: false, password: false });
    } catch (error) {
      addToast({ title: t('seekerSettings.toasts.failedTitle'), message: error?.data?.message || error?.message || t('seekerSettings.toasts.failedMessage'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderVerifyBlock = (targetName) => (
    <div className="mt-2 rounded-xl border border-outline-variant bg-surface-container-low p-6 shadow-sm">
      <p className="mb-2 flex items-center gap-2 font-h3 text-primary">
        <span className="material-symbols-outlined text-[20px] text-secondary">lock</span>
        {t('seekerSettings.security.title')}
      </p>
      <p className="mb-4 font-body-sm text-on-surface-variant">{t('seekerSettings.security.subtitle', { target: targetName })}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="flex-1 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30"
          onChange={(event) => setVerifyInput(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') confirmVerify(); }}
          placeholder={t('seekerSettings.security.placeholder')}
          type="password"
          value={verifyInput}
        />
        <div className="flex gap-2">
          <button className={buttonSecondary} disabled={verifying} onClick={cancelVerify} type="button">{t('seekerSettings.security.cancel')}</button>
          <button className={buttonPrimary} disabled={verifying || !verifyInput} onClick={confirmVerify} type="button">{verifying ? t('seekerSettings.security.verifying') : t('seekerSettings.security.unlock')}</button>
        </div>
      </div>
      {verifyError && <p className="mt-2 flex items-center gap-1 font-body-sm text-error"><span className="material-symbols-outlined text-[16px]">error</span>{verifyError}</p>}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-4xl mx-auto flex flex-col h-full space-y-gutter">
      <SeekerPageHeader title={t('seekerSettings.title')} subtitle={t('seekerSettings.subtitle')} icon="settings" />

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient p-6 md:p-8 space-y-6">
        <div>
          <h2 className="font-h2 text-h2 text-primary">{t('seekerSettings.accountTitle')}</h2>
          <p className="mt-unit text-body-md text-on-surface-variant">{t('seekerSettings.accountSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Field error={errors.name} label={t('seekerSettings.fields.name')}>
            <TextInput disabled={saving} onChange={(event) => update('name', event.target.value)} value={settings.name} />
          </Field>

          <div>
            <span className="mb-1 block font-label-md text-label-md text-primary">{t('seekerSettings.fields.email')}</span>
            {!unlockState.email ? (
              verifyTarget === 'email' ? renderVerifyBlock(t('seekerSettings.security.targetEmail')) : (
                <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5">
                  <span className="truncate font-body-md text-on-surface-variant">{user?.email || settings.email}</span>
                  <button className="flex items-center gap-1 text-sm font-semibold text-secondary hover:underline" onClick={() => startVerify('email')} type="button">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    {t('seekerSettings.change')}
                  </button>
                </div>
              )
            ) : (
              <Field error={errors.email}>
                <TextInput disabled={saving} onChange={(event) => update('email', event.target.value)} type="email" value={settings.email} />
              </Field>
            )}
          </div>

          <div>
            <span className="mb-1 block font-label-md text-label-md text-primary">{t('seekerSettings.fields.password')}</span>
            {!unlockState.password ? (
              verifyTarget === 'password' ? renderVerifyBlock(t('seekerSettings.security.targetPassword')) : (
                <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5">
                  <span className="mt-1 font-body-md tracking-[0.2em] text-on-surface-variant">{t('seekerSettings.passwordMask')}</span>
                  <button className="flex items-center gap-1 text-sm font-semibold text-secondary hover:underline" onClick={() => startVerify('password')} type="button">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    {t('seekerSettings.change')}
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-low p-6 shadow-sm">
                <h3 className="font-h3 text-primary">{t('seekerSettings.newPasswordSection')}</h3>
                <Field error={errors.newPassword} label={t('seekerSettings.fields.newPassword')}>
                  <TextInput disabled={saving} onChange={(event) => update('newPassword', event.target.value)} type="password" value={settings.newPassword} />
                </Field>
                <Field error={errors.confirmPassword} label={t('seekerSettings.fields.confirm')}>
                  <TextInput disabled={saving} onChange={(event) => update('confirmPassword', event.target.value)} type="password" value={settings.confirmPassword} />
                </Field>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t border-outline-variant pt-6">
          <button className={buttonPrimary} disabled={saving} onClick={save} type="button">
            <span className="material-symbols-outlined text-[20px]">save</span>
            {saving ? t('seekerSettings.saving') : t('seekerSettings.save')}
          </button>
        </div>
      </section>
    </div>
  );
}
