import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getApplicationById, getNotifications } from '../../services/jobSeekerDataService';
import { ROUTES } from '../../utils/constants';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import SeekerStatusBadge from '../../components/jobSeeker/SeekerStatusBadge';
import MatchScoreBadge from '../../components/jobSeeker/MatchScoreBadge';

const profileApplicationsPath = `${ROUTES.SEEKER_PROFILE}#applications`;

const formatSalary = (job) => {
  const min = Number(job?.salaryMin || 0);
  const max = Number(job?.salaryMax || 0);
  const currency = job?.currency === 'USD' || !job?.currency ? '$' : job.currency;

  if (!min && !max) return '';
  if (min && max) return `${Math.round(min / 1000)}K ${currency} - ${Math.round(max / 1000)}K ${currency}`;
  return `${Math.round((min || max) / 1000)}K ${currency}`;
};

const getInterviewAt = (notification) => notification?.data?.interview_at;

export default function JobSeekerApplicationDetailsPage() {
  const { t, i18n } = useTranslation();
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [interviewNotification, setInterviewNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  const applicationStatusMessage = (status, interviewAt) => {
    if (interviewAt) {
      return t('seekerApplicationDetails.statusMessages.interview', {
        date: new Date(interviewAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' }),
      });
    }
    const known = ['under_review', 'shortlisted', 'approved', 'interview_scheduled', 'waiting_interview', 'rejected', 'hired'];
    if (known.includes(status)) {
      return t(`seekerApplicationDetails.statusMessages.${status}`);
    }
    return t('seekerApplicationDetails.statusMessages.default');
  };

  useEffect(() => {
    const fetchApplication = async () => {
      setLoading(true);
      try {
        const [result, notifications] = await Promise.all([
          getApplicationById(applicationId),
          getNotifications().catch(() => []),
        ]);
        if (!result) {
          navigate(profileApplicationsPath);
          return;
        }
        const interview = notifications
          .filter((notification) => notification.type === 'interview_scheduled' && String(notification.data?.job_id || '') === String(result.jobId || ''))
          .sort((a, b) => new Date(getInterviewAt(b) || b.created_at) - new Date(getInterviewAt(a) || a.created_at))[0] || null;
        setApplication(result);
        setInterviewNotification(interview);
      } catch (error) {
        console.error('Error fetching application:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-12">
        <span className="material-symbols-outlined animate-spin text-[48px] text-secondary">progress_activity</span>
      </div>
    );
  }

  if (!application) {
    return null;
  }

  const { job } = application;
  const requiredSkills = job?.requiredSkills || [];
  const salaryText = formatSalary(job);
  const matchScore = Number(application.matchScore || 0);
  const interviewAt = getInterviewAt(interviewNotification);

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-7xl mx-auto flex flex-col h-full space-y-gutter">
      <div>
        <Link to={profileApplicationsPath} className="inline-flex items-center text-on-surface-variant hover:text-secondary mb-4 transition-colors font-label-md">
          <span className="material-symbols-outlined me-1 text-[18px]">arrow_back</span>
          {t('seekerApplicationDetails.back')}
        </Link>
        <SeekerPageHeader
          title={t('seekerApplicationDetails.title')}
          subtitle={t('seekerApplicationDetails.subtitle')}
          icon="assignment"
        />
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 md:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row justify-between lg:items-start gap-6 mb-8 pb-8 border-b border-outline-variant">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-surface-variant flex items-center justify-center text-on-surface-variant font-bold text-2xl overflow-hidden">
              {job?.companyLogo ? (
                <img src={job.companyLogo || undefined} alt={job?.company} className="w-full h-full object-cover" />
              ) : (
                job?.company?.charAt(0) || 'C'
              )}
            </div>
            <div>
              <h1 className="font-h2 text-h2 text-primary mb-1">{job?.title || t('seekerApplicationDetails.unknownRole')}</h1>
              <p className="font-body-lg text-secondary mb-2">{job?.company || t('seekerApplicationDetails.unknownCompany')}</p>
              <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  {job?.location || t('seekerApplicationDetails.remote')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">work</span>
                  {job?.type || t('seekerApplicationDetails.fullTime')}
                </span>
                {salaryText && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    {salaryText}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <SeekerStatusBadge status={application.status} />
            <span className="text-sm text-on-surface-variant">
              {t('seekerApplicationDetails.appliedOn', { date: new Date(application.appliedAt).toLocaleDateString(dateLocale) })}
            </span>
          </div>
        </div>

        {interviewAt && (
          <div className="mb-8 rounded-xl border border-secondary/30 bg-secondary/10 p-5 text-secondary">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[28px]">event_available</span>
                <div>
                  <p className="font-h3 text-primary">{t('seekerApplicationDetails.interviewScheduledTitle')}</p>
                  <p className="text-sm text-on-surface-variant">{new Date(interviewAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
              {interviewNotification?.data?.sender_id && (
                <Link className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 font-label-md text-on-secondary hover:opacity-90" to={`${ROUTES.SEEKER_MESSAGES}?user=${interviewNotification.data.sender_id}&job=${job?.id || ''}`}>
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  {t('seekerApplicationDetails.openConversation')}
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-h3 text-h3 text-primary mb-3">{t('seekerApplicationDetails.statusTitle')}</h3>
              <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                <p className={`text-body-md ${application.status === 'hired' ? 'text-green-600' : 'text-on-surface-variant'}`}>
                  {applicationStatusMessage(application.status, interviewAt)}
                </p>
              </div>
            </div>

            {matchScore > 0 && (
              <div>
                <h3 className="font-h3 text-h3 text-primary mb-3">{t('seekerApplicationDetails.matchTitle')}</h3>
                <div className="bg-secondary bg-opacity-5 p-6 rounded-lg border border-secondary border-opacity-20 flex items-center gap-6">
                  <MatchScoreBadge score={matchScore} size="lg" variant="ring" />
                  <div className="flex-1">
                    <p className="font-bold text-primary mb-1">{t('seekerApplicationDetails.matchScore', { score: matchScore })}</p>
                    <p className="text-sm text-on-surface-variant">
                      {t('seekerApplicationDetails.matchDescription')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-h3 text-h3 text-primary mb-3">{t('seekerApplicationDetails.requiredSkills')}</h3>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.length ? requiredSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-surface border border-outline-variant rounded-full text-sm text-on-surface-variant">
                    {skill}
                  </span>
                )) : <span className="text-on-surface-variant text-sm">{t('seekerApplicationDetails.notSpecified')}</span>}
              </div>
            </div>

            <div>
              <h3 className="font-h3 text-h3 text-primary mb-3">{t('seekerApplicationDetails.actions')}</h3>
              <div className="space-y-3">
                <Link to={`/seeker/jobs/${job?.id}`} className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-outline-variant hover:border-secondary hover:text-secondary rounded-lg transition-colors font-label-md text-primary bg-surface">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  {t('seekerApplicationDetails.viewOriginal')}
                </Link>
                {application.status === 'rejected' && (
                  <Link to={ROUTES.SEEKER_REJECTION_FEEDBACK.replace(':applicationId', application.id)} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-on-secondary hover:bg-secondary-container rounded-lg transition-colors font-label-md">
                    <span className="material-symbols-outlined text-[18px]">feedback</span>
                    {t('seekerApplicationDetails.viewRejection')}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
