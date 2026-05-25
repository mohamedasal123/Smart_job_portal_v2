import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import { useToast } from '../../components/useToast';
import { getParsedProfile, saveParsedProfile } from '../../services/jobSeekerDataService';

export default function JobSeekerCvReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [profileData, setProfileData] = useState(null);

  const [editModes, setEditModes] = useState({
    personal: false,
    summary: false,
    experience: false,
    education: false,
    skills: false,
  });

  const [editPersonal, setEditPersonal] = useState({});
  const [editSummary, setEditSummary] = useState('');
  const [editExperience, setEditExperience] = useState([]);
  const [editEducation, setEditEducation] = useState([]);
  const [editSkills, setEditSkills] = useState({ hard: [], soft: [], tools: [] });

  const [newSkillText, setNewSkillText] = useState({ hard: '', soft: '', tools: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getParsedProfile();
        setProfileData(data);
      } catch (error) {
        console.error('Error fetching parsed profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleEdit = (section) => {
    if (section === 'personal') setEditPersonal({ ...profileData.personalInfo });
    if (section === 'summary') setEditSummary(profileData.summary || '');
    if (section === 'experience') setEditExperience(Array.isArray(profileData.experience) ? [...profileData.experience] : []);
    if (section === 'education') setEditEducation(Array.isArray(profileData.education) ? [...profileData.education] : []);
    if (section === 'skills') setEditSkills({
      hard: Array.isArray(profileData.skills?.hard) ? [...profileData.skills.hard] : [],
      soft: Array.isArray(profileData.skills?.soft) ? [...profileData.skills.soft] : [],
      tools: Array.isArray(profileData.skills?.tools) ? [...profileData.skills.tools] : [],
    });
    setNewSkillText({ hard: '', soft: '', tools: '' });

    setEditModes(prev => ({ ...prev, [section]: true }));
  };

  const cancelEdit = (section) => {
    setEditModes(prev => ({ ...prev, [section]: false }));
  };

  const saveSection = (section) => {
    if (section === 'personal') {
      if (!editPersonal.firstName?.trim() || !editPersonal.lastName?.trim() || !editPersonal.title?.trim() || !editPersonal.email?.trim()) {
        addToast({ title: t('seekerCv.errors.validationTitle'), message: t('seekerCv.errors.personalValidation'), type: 'error' });
        return;
      }
      setProfileData(prev => ({ ...prev, personalInfo: editPersonal }));
    }
    if (section === 'summary') {
      setProfileData(prev => ({ ...prev, summary: editSummary }));
    }
    if (section === 'experience') {
      const invalid = editExperience.some(e => !e.title?.trim() || !e.company?.trim());
      if (invalid && editExperience.length > 0) {
         addToast({ title: t('seekerCv.errors.validationTitle'), message: t('seekerCv.errors.experienceValidation'), type: 'error' });
         return;
      }
      setProfileData(prev => ({ ...prev, experience: editExperience }));
    }
    if (section === 'education') {
      const invalid = editEducation.some(e => !e.degree?.trim() || !e.institution?.trim());
      if (invalid && editEducation.length > 0) {
         addToast({ title: t('seekerCv.errors.validationTitle'), message: t('seekerCv.errors.educationValidation'), type: 'error' });
         return;
      }
      setProfileData(prev => ({ ...prev, education: editEducation }));
    }
    if (section === 'skills') {
      setProfileData(prev => ({ ...prev, skills: editSkills }));
    }
    setEditModes(prev => ({ ...prev, [section]: false }));
  };

  const handleFinalSave = async () => {
    if (Object.values(editModes).some(v => v)) {
      addToast({ title: t('seekerCv.errors.unsavedTitle'), message: t('seekerCv.errors.unsavedMessage'), type: 'warning' });
      return;
    }
    setIsSubmitting(true);
    try {
      await saveParsedProfile(profileData);
      addToast({ title: t('seekerCv.toasts.profileSavedTitle'), message: t('seekerCv.toasts.profileSavedMessage'), type: 'success' });
      navigate(ROUTES.SEEKER_DASHBOARD);
    } catch {
      addToast({ title: t('seekerCv.toasts.saveFailedTitle'), message: t('seekerCv.toasts.saveFailedMessage'), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-[48px] text-secondary">progress_activity</span></div>;
  }
  if (!profileData) {
    return (
      <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop flex flex-col justify-center items-center h-full gap-4">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">upload_file</span>
        <p className="font-body-lg text-on-surface-variant">{t('seekerCv.noCv')}</p>
        <Link to={ROUTES.SEEKER_CV_UPLOAD} className="px-6 py-2.5 rounded-lg bg-secondary text-on-secondary font-label-md">{t('seekerCv.uploadCv')}</Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-7xl mx-auto flex flex-col h-full space-y-gutter pb-12">
      <SeekerPageHeader
        title={t('seekerCv.reviewTitle')}
        subtitle={t('seekerCv.reviewSubtitle')}
        icon="document_scanner"
      />

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col gap-6 p-6 md:p-8">

        {profileData.cvFile && (
          <div className="bg-primary-container/20 border border-primary-container p-4 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[24px]">description</span>
              <div>
                <p className="font-body-md font-bold text-primary">{profileData.cvFile.name}</p>
                <p className="font-label-sm text-on-surface-variant">{t('seekerCv.uploadedOn', { date: new Date(profileData.cvFile.uploadedAt).toLocaleDateString() })}</p>
              </div>
            </div>
            <Link to={ROUTES.SEEKER_CV_UPLOAD} className="text-secondary hover:underline font-label-md">{t('seekerCv.reupload')}</Link>
          </div>
        )}

        {/* --- PERSONAL INFORMATION --- */}
        <section className="border border-outline-variant rounded-lg p-5">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
            <h3 className="font-h3 text-h3 text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">person</span>
              {t('seekerCv.sections.personal')}
              <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ms-2">{t('seekerCv.aiExtractedBadge')}</span>
            </h3>
            {!editModes.personal && (
              <button onClick={() => toggleEdit('personal')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm">
                <span className="material-symbols-outlined text-[16px]">edit</span> {t('seekerCv.edit')}
              </button>
            )}
          </div>
          {editModes.personal ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.firstName')}</label>
                  <input type="text" value={editPersonal.firstName || ''} onChange={e => setEditPersonal({...editPersonal, firstName: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.lastName')}</label>
                  <input type="text" value={editPersonal.lastName || ''} onChange={e => setEditPersonal({...editPersonal, lastName: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.title')}</label>
                  <input type="text" value={editPersonal.title || ''} onChange={e => setEditPersonal({...editPersonal, title: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.email')}</label>
                  <input type="email" value={editPersonal.email || ''} onChange={e => setEditPersonal({...editPersonal, email: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.phone')}</label>
                  <input type="text" value={editPersonal.phone || ''} onChange={e => setEditPersonal({...editPersonal, phone: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                </div>
                <div>
                  <label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.location')}</label>
                  <input type="text" value={editPersonal.location || ''} onChange={e => setEditPersonal({...editPersonal, location: e.target.value})} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button onClick={() => cancelEdit('personal')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">{t('seekerCv.cancel')}</button>
                <button onClick={() => saveSection('personal')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">{t('seekerCv.saveSection')}</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div><p className="font-label-sm text-on-surface-variant">{t('seekerCv.fields.fullName')}</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.firstName} {profileData.personalInfo?.lastName}</p></div>
              <div><p className="font-label-sm text-on-surface-variant">{t('seekerCv.fields.title').replace(' *', '')}</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.title}</p></div>
              <div><p className="font-label-sm text-on-surface-variant">{t('seekerCv.fields.email').replace(' *', '')}</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.email}</p></div>
              <div><p className="font-label-sm text-on-surface-variant">{t('seekerCv.fields.phone')}</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.phone || '-'}</p></div>
              <div><p className="font-label-sm text-on-surface-variant">{t('seekerCv.fields.location')}</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.location || '-'}</p></div>
            </div>
          )}
        </section>

        {/* --- SUMMARY --- */}
        <section className="border border-outline-variant rounded-lg p-5">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
            <h3 className="font-h3 text-h3 text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">notes</span>
              {t('seekerCv.sections.summary')}
              <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ms-2">{t('seekerCv.aiExtractedBadge')}</span>
            </h3>
            {!editModes.summary && (
              <button onClick={() => toggleEdit('summary')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm">
                <span className="material-symbols-outlined text-[16px]">edit</span> {t('seekerCv.edit')}
              </button>
            )}
          </div>
          {editModes.summary ? (
            <div className="space-y-4">
              <textarea rows="4" value={editSummary} onChange={e => setEditSummary(e.target.value)} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary resize-y" />
              <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                <button onClick={() => cancelEdit('summary')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">{t('seekerCv.cancel')}</button>
                <button onClick={() => saveSection('summary')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">{t('seekerCv.saveSection')}</button>
              </div>
            </div>
          ) : (
            <p className="font-body-md text-on-surface">{profileData.summary || t('seekerCv.noSummary')}</p>
          )}
        </section>

        {/* --- EXPERIENCE --- */}
        <section className="border border-outline-variant rounded-lg p-5">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
            <h3 className="font-h3 text-h3 text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">work_history</span>
              {t('seekerCv.sections.experience')}
              <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ms-2">{t('seekerCv.aiExtractedBadge')}</span>
            </h3>
            {!editModes.experience && (
              <button onClick={() => toggleEdit('experience')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm">
                <span className="material-symbols-outlined text-[16px]">edit</span> {t('seekerCv.edit')}
              </button>
            )}
          </div>
          {editModes.experience ? (
            <div className="space-y-6">
              {editExperience.map((exp, index) => (
                <div key={index} className="bg-surface-variant/20 p-4 rounded-lg border border-outline-variant relative group">
                  <button onClick={() => setEditExperience(editExperience.filter((_, i) => i !== index))} className="absolute top-2 end-2 p-1 text-on-surface-variant hover:text-error rounded-full transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div><label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.jobTitle')}</label><input type="text" value={exp.title || ''} onChange={e => {const newE=[...editExperience]; newE[index].title=e.target.value; setEditExperience(newE);}} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                    <div><label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.company')}</label><input type="text" value={exp.company || ''} onChange={e => {const newE=[...editExperience]; newE[index].company=e.target.value; setEditExperience(newE);}} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                    <div><label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.startYear')}</label><input type="text" value={exp.startYear || ''} onChange={e => {const newE=[...editExperience]; newE[index].startYear=e.target.value; setEditExperience(newE);}} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                    <div><label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.endYear')}</label><input type="text" value={exp.endYear || ''} onChange={e => {const newE=[...editExperience]; newE[index].endYear=e.target.value; setEditExperience(newE);}} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                    <div className="md:col-span-2"><label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.description')}</label><textarea rows="3" value={exp.description || ''} onChange={e => {const newE=[...editExperience]; newE[index].description=e.target.value; setEditExperience(newE);}} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary resize-y" /></div>
                  </div>
                </div>
              ))}
              <button onClick={() => setEditExperience([...editExperience, { id: Date.now(), title: '', company: '', startYear: '', endYear: '', description: '' }])} className="w-full py-2 border border-dashed border-outline-variant text-on-surface-variant rounded-lg hover:border-secondary hover:text-secondary flex justify-center items-center gap-1 font-label-md transition-colors"><span className="material-symbols-outlined text-[18px]">add</span> {t('seekerCv.addExperience')}</button>
              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
                <button onClick={() => cancelEdit('experience')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">{t('seekerCv.cancel')}</button>
                <button onClick={() => saveSection('experience')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">{t('seekerCv.saveSection')}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {profileData.experience.length > 0 ? profileData.experience.map(exp => (
                <div key={exp.id || Math.random()} className="border-b border-surface-variant pb-3 last:border-0 last:pb-0">
                  <h4 className="font-body-lg font-bold text-primary">{exp.title}</h4>
                  <p className="font-body-md text-on-surface-variant">{exp.company} &bull; {exp.startYear} - {exp.endYear}</p>
                  {exp.description && <p className="font-body-sm text-on-surface mt-1 whitespace-pre-wrap">{exp.description}</p>}
                </div>
              )) : profileData.experienceRaw ? (
                <p className="font-body-md text-on-surface whitespace-pre-wrap">{profileData.experienceRaw}</p>
              ) : (
                <p className="text-on-surface-variant text-sm">{t('seekerCv.noExperience')}</p>
              )}
            </div>
          )}
        </section>

        {/* --- EDUCATION --- */}
        <section className="border border-outline-variant rounded-lg p-5">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
            <h3 className="font-h3 text-h3 text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">school</span>
              {t('seekerCv.sections.education')}
              <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ms-2">{t('seekerCv.aiExtractedBadge')}</span>
            </h3>
            {!editModes.education && (
              <button onClick={() => toggleEdit('education')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm">
                <span className="material-symbols-outlined text-[16px]">edit</span> {t('seekerCv.edit')}
              </button>
            )}
          </div>
          {editModes.education ? (
            <div className="space-y-6">
              {editEducation.map((edu, index) => (
                <div key={index} className="bg-surface-variant/20 p-4 rounded-lg border border-outline-variant relative group">
                  <button onClick={() => setEditEducation(editEducation.filter((_, i) => i !== index))} className="absolute top-2 end-2 p-1 text-on-surface-variant hover:text-error rounded-full transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div><label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.degree')}</label><input type="text" value={edu.degree || ''} onChange={e => {const newE=[...editEducation]; newE[index].degree=e.target.value; setEditEducation(newE);}} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                    <div><label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.institution')}</label><input type="text" value={edu.institution || ''} onChange={e => {const newE=[...editEducation]; newE[index].institution=e.target.value; setEditEducation(newE);}} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                    <div><label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.startYear')}</label><input type="text" value={edu.startYear || ''} onChange={e => {const newE=[...editEducation]; newE[index].startYear=e.target.value; setEditEducation(newE);}} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                    <div><label className="block font-label-md text-on-surface-variant mb-1">{t('seekerCv.fields.endYear')}</label><input type="text" value={edu.endYear || ''} onChange={e => {const newE=[...editEducation]; newE[index].endYear=e.target.value; setEditEducation(newE);}} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                  </div>
                </div>
              ))}
              <button onClick={() => setEditEducation([...editEducation, { id: Date.now(), degree: '', institution: '', startYear: '', endYear: '' }])} className="w-full py-2 border border-dashed border-outline-variant text-on-surface-variant rounded-lg hover:border-secondary hover:text-secondary flex justify-center items-center gap-1 font-label-md transition-colors"><span className="material-symbols-outlined text-[18px]">add</span> {t('seekerCv.addEducation')}</button>
              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
                <button onClick={() => cancelEdit('education')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">{t('seekerCv.cancel')}</button>
                <button onClick={() => saveSection('education')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">{t('seekerCv.saveSection')}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {profileData.education.length > 0 ? profileData.education.map(edu => (
                <div key={edu.id || Math.random()} className="border-b border-surface-variant pb-3 last:border-0 last:pb-0">
                  <h4 className="font-body-lg font-bold text-primary">{edu.degree}</h4>
                  <p className="font-body-md text-on-surface-variant">{edu.institution} &bull; {edu.startYear} - {edu.endYear}</p>
                </div>
              )) : profileData.educationRaw ? (
                <p className="font-body-md text-on-surface whitespace-pre-wrap">{profileData.educationRaw}</p>
              ) : (
                <p className="text-on-surface-variant text-sm">{t('seekerCv.noEducation')}</p>
              )}
            </div>
          )}
        </section>

        {/* --- SKILLS --- */}
        <section className="border border-outline-variant rounded-lg p-5">
          <div className="flex justify-between items-center mb-4 border-b border-outline-variant pb-2">
            <h3 className="font-h3 text-h3 text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">psychology</span>
              {t('seekerCv.sections.skills')}
              <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ms-2">{t('seekerCv.aiExtractedBadge')}</span>
            </h3>
            {!editModes.skills && (
              <button onClick={() => toggleEdit('skills')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm">
                <span className="material-symbols-outlined text-[16px]">edit</span> {t('seekerCv.edit')}
              </button>
            )}
          </div>
          {editModes.skills ? (
            <div className="space-y-6">
              {['hard', 'soft', 'tools'].map((cat) => (
                <div key={cat} className="space-y-2">
                  <label className="block font-label-md text-on-surface-variant">{t(`seekerCv.skillCategories.${cat}`)}</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editSkills[cat].map((skill, idx) => (
                      <span key={idx} className="bg-secondary-container/30 text-on-secondary-container px-3 py-1 rounded-full font-label-sm border border-secondary/20 flex items-center gap-1">
                        {skill}
                        <button onClick={() => setEditSkills({...editSkills, [cat]: editSkills[cat].filter((_, i) => i !== idx)})} className="hover:text-error transition-colors"><span className="material-symbols-outlined text-[14px]">close</span></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={newSkillText[cat]} onChange={e => setNewSkillText({...newSkillText, [cat]: e.target.value})} onKeyDown={(e) => {
                      if(e.key === 'Enter') {
                        e.preventDefault();
                        if (newSkillText[cat].trim()) {
                          setEditSkills({...editSkills, [cat]: [...editSkills[cat], newSkillText[cat].trim()]});
                          setNewSkillText({...newSkillText, [cat]: ''});
                        }
                      }
                    }} placeholder={t('seekerCv.addSkillPlaceholder', { category: t(`seekerCv.skillCategories.${cat}`) })} className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-1.5 outline-none focus:border-secondary text-sm" />
                    <button type="button" onClick={() => {
                      if (newSkillText[cat].trim()) {
                        setEditSkills({...editSkills, [cat]: [...editSkills[cat], newSkillText[cat].trim()]});
                        setNewSkillText({...newSkillText, [cat]: ''});
                      }
                    }} className="px-3 py-1.5 border border-outline-variant rounded text-on-surface font-label-sm hover:bg-surface-container-low">{t('seekerCv.addSkill')}</button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
                <button onClick={() => cancelEdit('skills')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">{t('seekerCv.cancel')}</button>
                <button onClick={() => saveSection('skills')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">{t('seekerCv.saveSection')}</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {['hard', 'soft', 'tools'].map((cat) => {
                 if (Array.isArray(profileData.skills?.[cat])) {
                   return profileData.skills[cat].length > 0 && (
                     <div key={cat}>
                       <p className="font-label-sm text-on-surface-variant mb-2">{t(`seekerCv.skillCategories.${cat}`)}</p>
                       <div className="flex flex-wrap gap-2">
                         {profileData.skills[cat].map((skill, idx) => (
                           <span key={idx} className="bg-surface-container-low border border-outline-variant px-3 py-1 rounded-full text-sm text-on-surface">
                             {skill}
                           </span>
                         ))}
                       </div>
                     </div>
                   );
                 } else if (profileData.skills?.[cat]) {
                   return (
                     <div key={cat}>
                       <p className="font-label-sm text-on-surface-variant mb-2">{t(`seekerCv.skillCategories.${cat}`)}</p>
                       <p className="font-body-md text-on-surface">{profileData.skills[cat]}</p>
                     </div>
                   );
                 }
                 return null;
              })}
              {(!profileData.skills || (!profileData.skills.hard?.length && !profileData.skills.soft?.length && !profileData.skills.tools?.length)) && (
                <p className="text-on-surface-variant text-sm">{t('seekerCv.noSkills')}</p>
              )}
            </div>
          )}
        </section>

        {/* Final Actions */}
        <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-outline-variant">
          <button onClick={() => navigate(ROUTES.SEEKER_CV_UPLOAD)} className="px-6 py-2.5 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors font-label-md">
            {t('seekerCv.discard')}
          </button>
          <button
            onClick={handleFinalSave}
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container transition-colors disabled:opacity-50 font-label-md flex items-center gap-2 shadow-sm"
          >
            {isSubmitting ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> {t('seekerCv.confirming')}</> : t('seekerCv.confirm')}
          </button>
        </div>

      </div>
    </div>
  );
}
