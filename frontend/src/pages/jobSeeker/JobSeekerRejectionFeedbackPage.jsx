import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import { api } from '../../api/axios';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import MatchScoreBadge from '../../components/jobSeeker/MatchScoreBadge';

export default function JobSeekerRejectionFeedbackPage() {
  const { t } = useTranslation();
  const { applicationId } = useParams();
  const [feedbackData, setFeedbackData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!applicationId) {
      setLoading(false);
      return;
    }

    api.get(`/applications/${applicationId}/feedback`)
      .then(res => setFeedbackData(res.data?.data || res.data))
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (loading) return <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-[48px] text-secondary">progress_activity</span></div>;
  if (error || !feedbackData) return <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop text-center text-on-surface-variant"><p>{t('seekerRejectionFeedback.noFeedback')}</p><Link to={ROUTES.SEEKER_APPLICATIONS} className="text-secondary hover:underline mt-4 inline-block">{t('seekerRejectionFeedback.back')}</Link></div>;

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-4xl mx-auto flex flex-col h-full space-y-gutter pb-12">
      <div className="mb-4">
        <Link to={ROUTES.SEEKER_APPLICATIONS} className="text-secondary font-label-md hover:underline flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          {t('seekerRejectionFeedback.back')}
        </Link>
      </div>

      <SeekerPageHeader
        title={t('seekerRejectionFeedback.title')}
        subtitle={t('seekerRejectionFeedback.subtitleWithRole', { role: feedbackData.job_title })}
        icon="feedback"
      />

      <div className="flex flex-col gap-stack-lg">
        {/* Top Summary Card */}
        <div className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-sm border border-outline-variant flex flex-col md:flex-row gap-stack-lg items-center">
          <MatchScoreBadge score={feedbackData.ai_score} size="lg" variant="ring" className="scale-150 m-8" />
          <div className="flex-1 text-center md:text-start">
            <h3 className="font-h3 text-h3 text-primary mb-2">{t('seekerRejectionFeedback.assessmentTitle')}</h3>
            <p className="text-body-lg text-on-surface-variant leading-relaxed">
              {t('seekerRejectionFeedback.assessmentDescription')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg">
          {/* Missing Skills */}
          <div className="bg-error-container/10 border border-error/30 rounded-xl p-stack-lg shadow-sm md:col-span-2">
            <h3 className="font-h3 text-h3 text-error mb-stack-md flex items-center gap-2">
              <span className="material-symbols-outlined">trending_up</span>
              {t('seekerRejectionFeedback.missingSkillsTitle')}
            </h3>
            <ul className="space-y-stack-sm">
              {(feedbackData.missing_skills || []).map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-on-surface font-body-md">
                  <span className="material-symbols-outlined text-error text-[18px] mt-0.5">arrow_right</span>
                  {item}
                </li>
              ))}
              {(!feedbackData.missing_skills || feedbackData.missing_skills.length === 0) && (
                <li className="text-on-surface-variant">{t('seekerRejectionFeedback.noMissingSkills')}</li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex justify-center mt-stack-md">
          <Link to={ROUTES.SEEKER_RECOMMENDED_JOBS} className="bg-secondary text-on-secondary px-8 py-3 rounded-lg font-label-md hover:bg-secondary-container transition-colors shadow-sm flex items-center gap-2">
            {t('seekerRejectionFeedback.findSimilar')}
            <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
