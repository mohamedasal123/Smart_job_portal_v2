import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SeekerEmptyState from '../../components/jobSeeker/SeekerEmptyState';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import Stagger from '../../motion/Stagger';
import { getApplications, getNotifications } from '../../services/jobSeekerDataService';
import { ROUTES } from '../../utils/constants';

function InterviewsSpinner({ label }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center" role="status" aria-live="polite">
      <span className="material-symbols-outlined animate-spin text-[48px] text-secondary">progress_activity</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export default function JobSeekerInterviewsPage() {
  const { t, i18n } = useTranslation();
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [applicationsData, notificationsData] = await Promise.all([
          getApplications(),
          getNotifications(),
        ]);

        if (!isMounted) return;
        setApplications(applicationsData);
        setNotifications(notificationsData);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    const interval = window.setInterval(loadData, 5000);
    window.addEventListener('notifications_updated', loadData);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener('notifications_updated', loadData);
    };
  }, []);

  const interviews = useMemo(() => {
    const applicationByJob = new Map(applications.map((application) => [String(application.jobId || application.job?.id || ''), application]));

    return notifications
      .filter((notification) => (notification.type || notification.data?.type) === 'interview_scheduled')
      .map((notification) => {
        const data = notification.data || {};
        const application = applicationByJob.get(String(data.job_id || ''));
        const interviewAt = data.interview_at;

        return {
          id: notification.id,
          application,
          company: data.company_name || data.sender_name || application?.job?.company || t('seekerInterviews.fallbackCompany'),
          role: data.job_title || application?.job?.title || t('seekerInterviews.fallbackRole'),
          interviewAt,
          jobId: data.job_id || application?.jobId,
          senderId: data.sender_id,
          message: notification.message || data.message || '',
          createdAt: notification.created_at,
        };
      })
      .filter((interview) => interview.interviewAt)
      .sort((a, b) => new Date(a.interviewAt) - new Date(b.interviewAt));
  }, [applications, notifications, t]);

  const upcomingCount = interviews.filter((interview) => new Date(interview.interviewAt).getTime() >= Date.now()).length;
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-7xl mx-auto flex flex-col min-h-full space-y-gutter pb-12">
      <SeekerPageHeader title={t('seekerInterviews.title')} subtitle={t('seekerInterviews.subtitle')} icon="event_available" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-ambient">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{t('seekerInterviews.stats.total')}</p>
          <p className="mt-2 font-h2 text-h2 text-primary">{interviews.length}</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-ambient">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{t('seekerInterviews.stats.upcoming')}</p>
          <p className="mt-2 font-h2 text-h2 text-primary">{upcomingCount}</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-ambient">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">{t('seekerInterviews.stats.past')}</p>
          <p className="mt-2 font-h2 text-h2 text-primary">{interviews.length - upcomingCount}</p>
        </div>
      </div>

      <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-ambient">
        {loading ? <InterviewsSpinner label={t('seekerInterviews.loading')} /> : interviews.length ? (
          <Stagger className="grid grid-cols-1 xl:grid-cols-2 gap-gutter" delayChildren={0.05} staggerChildren={0.05}>
            {interviews.map((interview) => {
              const isPast = new Date(interview.interviewAt).getTime() < Date.now();
              return (
                <Stagger.Item key={interview.id}>
                  <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5 shadow-sm">
                    <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isPast ? 'bg-surface-container-high text-on-surface-variant' : 'bg-secondary-container text-on-secondary-container'}`}>
                      <span className="material-symbols-outlined text-[16px]">{isPast ? 'history' : 'event_available'}</span>
                      {isPast ? t('seekerInterviews.pastTag') : t('seekerInterviews.upcomingTag')}
                    </p>
                    <h2 className="mt-4 font-h2 text-h2 text-primary">{interview.role}</h2>
                    <p className="text-body-md text-secondary">{interview.company}</p>
                    <p className="mt-3 flex items-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      {new Date(interview.interviewAt).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    {interview.message && <p className="mt-3 text-body-sm text-on-surface-variant">{interview.message}</p>}
                    <div className="mt-5 flex flex-wrap gap-3 border-t border-outline-variant pt-4">
                      {interview.senderId && (
                        <Link className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 font-label-md text-on-secondary hover:opacity-90" to={`${ROUTES.SEEKER_MESSAGES}?user=${interview.senderId}&job=${interview.jobId || ''}`}>
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                          {t('seekerInterviews.openConversation')}
                        </Link>
                      )}
                      {interview.application?.id && (
                        <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 font-label-md text-primary hover:bg-surface-container-lowest" to={`/seeker/applications/${interview.application.id}`}>
                          <span className="material-symbols-outlined text-[18px]">assignment</span>
                          {t('seekerInterviews.viewApplication')}
                        </Link>
                      )}
                    </div>
                  </div>
                </Stagger.Item>
              );
            })}
          </Stagger>
        ) : (
          <SeekerEmptyState icon="event_busy" title={t('seekerInterviews.emptyTitle')} description={t('seekerInterviews.emptyDescription')} />
        )}
      </section>
    </div>
  );
}
