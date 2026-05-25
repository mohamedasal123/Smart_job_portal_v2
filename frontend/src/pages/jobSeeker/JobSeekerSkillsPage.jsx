import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { addSkill, getSkills, getSuggestedSkills, removeSkill } from '../../services/jobSeekerDataService';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import { useToast } from '../../components/useToast';
import ConfirmModal from '../../components/ConfirmModal';

const SkillChip = ({ skill, onRemove, t }) => (
  <div className="inline-flex items-center bg-surface-container-low border border-outline-variant rounded-full px-3 py-1.5 gap-2 group">
    <span className="font-body-md text-sm text-on-surface">{skill.name}</span>
    <span className={`material-symbols-outlined ${skill.source === 'cv_parsed' ? 'text-secondary' : 'text-on-surface-variant'} text-[14px]`}
      title={skill.source === 'cv_parsed' ? t('seekerSkills.tooltips.fromCv') : t('seekerSkills.tooltips.manual')}
      aria-hidden="true">
      {skill.source === 'cv_parsed' ? 'smart_toy' : 'person_add'}
    </span>
    <button
      type="button"
      onClick={() => onRemove(skill)}
      aria-label={t('seekerSkills.tooltips.removeAria', { name: skill.name })}
      className="text-outline-variant hover:text-error transition-colors rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
    >
      <span className="material-symbols-outlined text-[16px]" aria-hidden="true">close</span>
    </button>
  </div>
);

const SkillSection = ({ title, icon, items, onRemove, emptyText, t }) => (
  <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6">
    <h2 className="font-h3 text-h3 text-primary mb-4 flex items-center gap-2 border-b border-outline-variant pb-3">
      <span className="material-symbols-outlined text-secondary">{icon}</span>{title}
    </h2>
    <div className="flex flex-wrap gap-2">
      {items.map(skill => <SkillChip key={skill.id} skill={skill} onRemove={onRemove} t={t} />)}
      {items.length === 0 && <p className="text-on-surface-variant text-sm">{emptyText}</p>}
    </div>
  </section>
);

export default function JobSeekerSkillsPage() {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [skills, setSkills] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState('');
  const [skillPendingRemoval, setSkillPendingRemoval] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [skillsData, suggestedData] = await Promise.all([
          getSkills(),
          getSuggestedSkills(),
        ]);
        setSkills(skillsData);
        setSuggested(suggestedData);
      } catch (error) {
        console.error('Error fetching skills:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRemoveSkill = (skill) => {
    setSkillPendingRemoval(skill);
  };

  const confirmRemoveSkill = async () => {
    const skill = skillPendingRemoval;
    if (!skill) return;
    try {
      await removeSkill(skill.id);
      setSkills((prev) => prev.filter(s => s.id !== skill.id));
      addToast({ title: t('seekerSkills.toasts.removedTitle'), message: t('seekerSkills.toasts.removedMessage', { name: skill.name }), type: 'info' });
    } catch {
      addToast({ title: t('seekerSkills.toasts.removeFailedTitle'), message: t('seekerSkills.toasts.removeFailedMessage'), type: 'error' });
    } finally {
      setSkillPendingRemoval(null);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (skills.some(s => s.name.toLowerCase() === newSkill.trim().toLowerCase())) {
      addToast({ title: t('seekerSkills.toasts.duplicateTitle'), message: t('seekerSkills.toasts.duplicateMessage'), type: 'error' });
      return;
    }
    const existingSkill = suggested.find(s => s.name.toLowerCase() === newSkill.trim().toLowerCase());
    if (!existingSkill) {
      addToast({ title: t('seekerSkills.toasts.notFoundTitle'), message: t('seekerSkills.toasts.notFoundMessage'), type: 'error' });
      return;
    }

    await handleAddSuggested(existingSkill);
    setNewSkill('');
  };

  const handleAddSuggested = async (s) => {
    if (skills.some(sk => sk.name.toLowerCase() === s.name.toLowerCase())) return;
    try {
      const obj = { id: s.id, name: s.name, category: s.category, source: 'manual' };
      await addSkill(obj);
      setSkills([...skills, obj]);
      addToast({ title: t('seekerSkills.toasts.addedTitle'), message: t('seekerSkills.toasts.addedMessage', { name: s.name }), type: 'success' });
    } catch (error) {
      addToast({ title: t('seekerSkills.toasts.addFailedTitle'), message: error.message || t('seekerSkills.toasts.addFailedMessage'), type: 'error' });
    }
  };

  const technicalSkills = useMemo(
    () => skills.filter(s => s.category === 'technical' || s.category === 'framework'),
    [skills],
  );
  const softSkills = useMemo(
    () => skills.filter(s => s.category === 'soft_skill'),
    [skills],
  );
  const tools = useMemo(
    () => skills.filter(s => s.category === 'tool'),
    [skills],
  );

  const filteredSuggestions = useMemo(() => {
    const taken = new Set(skills.map((sk) => sk.name.toLowerCase()));
    return suggested.filter((s) => !taken.has(s.name.toLowerCase()));
  }, [suggested, skills]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-12" role="status" aria-live="polite">
        <span className="material-symbols-outlined animate-spin text-[48px] text-secondary" aria-hidden="true">progress_activity</span>
        <span className="sr-only">{t('seekerSkills.loading')}</span>
      </div>
    );
  }

  const technicalTitle = t('seekerSkills.sections.technical');
  const softTitle = t('seekerSkills.sections.soft');
  const toolsTitle = t('seekerSkills.sections.tools');

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-7xl mx-auto flex flex-col h-full space-y-gutter">
      <SeekerPageHeader title={t('seekerSkills.title')} subtitle={t('seekerSkills.subtitle')} icon="psychology" />

      <div className="flex flex-col lg:flex-row gap-gutter">
        <div className="flex-grow flex flex-col gap-stack-lg lg:w-2/3">
          <form onSubmit={handleAddSkill} className="relative bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant outline-none"
              placeholder={t('seekerSkills.searchPlaceholder')} type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
            {newSkill && (
              <button type="submit" className="bg-secondary text-on-secondary font-label-sm px-3 py-1.5 rounded flex items-center gap-1 hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined text-[16px]">add</span> {t('seekerSkills.addButton')}
              </button>
            )}
          </form>
          <SkillSection title={technicalTitle} icon="code" items={technicalSkills} onRemove={handleRemoveSkill} emptyText={t('seekerSkills.emptySection', { section: technicalTitle })} t={t} />
          <SkillSection title={softTitle} icon="psychology" items={softSkills} onRemove={handleRemoveSkill} emptyText={t('seekerSkills.emptySection', { section: softTitle })} t={t} />
          <SkillSection title={toolsTitle} icon="build" items={tools} onRemove={handleRemoveSkill} emptyText={t('seekerSkills.emptySection', { section: toolsTitle })} t={t} />
        </div>

        <aside className="lg:w-1/3 flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6 sticky top-24">
            <h3 className="font-h3 text-h3 text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">tips_and_updates</span>{t('seekerSkills.suggestedTitle')}
            </h3>
            <p className="font-body-md text-sm text-on-surface-variant mb-4">{t('seekerSkills.suggestedDescription')}</p>
            <div className="flex flex-col gap-2">
              {filteredSuggestions.map((s, idx) => (
                <button key={idx} onClick={() => handleAddSuggested(s)}
                  className="flex items-center justify-between p-3 border border-outline-variant rounded-lg hover:border-secondary hover:bg-surface-container-low transition-colors group text-start">
                  <div>
                    <span className="font-body-md text-sm text-primary font-bold block">{s.name}</span>
                    <span className="font-label-sm text-[12px] text-on-surface-variant">{s.category === 'soft_skill' ? t('seekerSkills.suggestedCategory.soft') : s.category === 'tool' ? t('seekerSkills.suggestedCategory.tool') : t('seekerSkills.suggestedCategory.technical')}</span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors">add_circle</span>
                </button>
              ))}
              {filteredSuggestions.length === 0 && <p className="text-on-surface-variant text-sm">{t('seekerSkills.allAdded')}</p>}
            </div>
          </div>
        </aside>
      </div>

      <ConfirmModal
        open={Boolean(skillPendingRemoval)}
        title={t('seekerSkills.confirm.title')}
        message={
          skillPendingRemoval
            ? t('seekerSkills.confirm.message', { name: skillPendingRemoval.name })
            : null
        }
        confirmLabel={t('seekerSkills.confirm.confirm')}
        cancelLabel={t('seekerSkills.confirm.cancel')}
        variant="danger"
        onConfirm={confirmRemoveSkill}
        onCancel={() => setSkillPendingRemoval(null)}
      />
    </div>
  );
}
