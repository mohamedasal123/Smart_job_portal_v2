import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getProfile, updateProfile } from '../../services/jobSeekerDataService';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import { useToast } from '../../components/useToast';
import { ROUTES } from '../../utils/constants';

export default function JobSeekerEditProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', title: '', location: '',
    bio: '', expectedSalary: '', portfolio: '', linkedin: '',
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const p = await getProfile();
        setFormData({
          firstName: p.firstName || '', lastName: p.lastName || '',
          title: p.title || '', location: p.location || '',
          bio: p.bio || '', expectedSalary: p.expectedSalary || '',
          portfolio: p.portfolio || '', linkedin: p.linkedin || '',
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      addToast({ title: t('seekerEditProfile.toasts.validationTitle'), message: t('seekerEditProfile.toasts.validationMessage'), type: 'error' });
      return;
    }
    setSaving(true);
    try {
      await updateProfile(formData);
      addToast({ title: t('seekerEditProfile.toasts.successTitle'), message: t('seekerEditProfile.toasts.successMessage'), type: 'success' });
      navigate(ROUTES.SEEKER_PROFILE);
    } catch { addToast({ title: t('seekerEditProfile.toasts.errorTitle'), message: t('seekerEditProfile.toasts.errorMessage'), type: 'error' }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-[48px] text-secondary">progress_activity</span></div>;

  const field = (label, name, type = 'text', extra = {}) => (
    <div className={extra.span2 ? 'md:col-span-2' : ''}>
      <label className="block text-label-md font-bold text-on-surface mb-2">{label}</label>
      {extra.textarea ? (
        <textarea name={name} value={formData[name]} onChange={handleChange} rows="4"
          className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors resize-y"
          placeholder={extra.placeholder || ''} />
      ) : (
        <input type={type} name={name} value={formData[name]} onChange={handleChange}
          className="w-full bg-surface border border-outline-variant rounded-lg px-4 py-2 focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-colors"
          placeholder={extra.placeholder || ''} required={extra.required} />
      )}
    </div>
  );

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-4xl mx-auto flex flex-col h-full space-y-gutter pb-12">
      <SeekerPageHeader title={t('seekerEditProfile.title')} subtitle={t('seekerEditProfile.subtitle')} icon="edit_document" />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
          <div className="space-y-6">
            <h3 className="font-h3 text-h3 text-primary">{t('seekerEditProfile.personalTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {field(t('seekerEditProfile.fields.firstName'), 'firstName', 'text', { required: true })}
              {field(t('seekerEditProfile.fields.lastName'), 'lastName', 'text', { required: true })}
              {field(t('seekerEditProfile.fields.title'), 'title', 'text', { span2: true, required: true, placeholder: t('seekerEditProfile.fields.titlePlaceholder') })}
              {field(t('seekerEditProfile.fields.bio'), 'bio', 'text', { span2: true, textarea: true, placeholder: t('seekerEditProfile.fields.bioPlaceholder') })}
            </div>
          </div>
          <div className="space-y-6 pt-6 border-t border-outline-variant">
            <h3 className="font-h3 text-h3 text-primary">{t('seekerEditProfile.additionalTitle')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {field(t('seekerEditProfile.fields.location'), 'location', 'text', { placeholder: t('seekerEditProfile.fields.locationPlaceholder') })}
              {field(t('seekerEditProfile.fields.expectedSalary'), 'expectedSalary', 'text', { placeholder: t('seekerEditProfile.fields.expectedSalaryPlaceholder') })}
              {field(t('seekerEditProfile.fields.portfolio'), 'portfolio', 'url', { placeholder: t('seekerEditProfile.fields.portfolioPlaceholder') })}
              {field(t('seekerEditProfile.fields.linkedin'), 'linkedin', 'url', { placeholder: t('seekerEditProfile.fields.linkedinPlaceholder') })}
            </div>
          </div>
          <div className="pt-8 border-t border-outline-variant flex justify-end gap-4">
            <button type="button" onClick={() => navigate(ROUTES.SEEKER_PROFILE)}
              className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low transition-colors font-label-md">
              {t('seekerEditProfile.cancel')}
            </button>
            <button type="submit" disabled={saving}
              className="bg-secondary text-on-secondary px-8 py-2.5 rounded-lg hover:bg-secondary-container transition-colors disabled:opacity-50 font-label-md flex items-center gap-2 shadow-sm">
              {saving ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> {t('seekerEditProfile.saving')}</> : t('seekerEditProfile.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
