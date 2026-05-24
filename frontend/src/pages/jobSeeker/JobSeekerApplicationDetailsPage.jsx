import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

const applicationStatusMessage = (status, interviewAt) => {
  if (interviewAt) {
    return `The company scheduled your interview for ${new Date(interviewAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.`;
  }

  switch (status) {
    case 'under_review':
      return "Your application is currently being reviewed by the hiring team. We'll notify you when there's an update.";
    case 'shortlisted':
      return "Congratulations! You've been shortlisted for this role. The company will contact you when they schedule the next step.";
    case 'approved':
      return 'Your application has been approved. Watch your messages for the company interview time.';
    case 'interview_scheduled':
    case 'waiting_interview':
      return 'The company will share the interview time here once it is scheduled.';
    case 'rejected':
      return 'Unfortunately, the company has decided to move forward with other candidates at this time.';
    case 'hired':
      return "Congratulations! You've been hired for this position.";
    default:
      return 'Your application has been received.';
  }
};

export default function JobSeekerApplicationDetailsPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [interviewNotification, setInterviewNotification] = useState(null);
  const [loading, setLoading] = useState(true);

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
          <span className="material-symbols-outlined mr-1 text-[18px]">arrow_back</span>
          Back to profile applications
        </Link>
        <SeekerPageHeader
          title="Application Details"
          subtitle="Review the status and details of your application."
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
              <h1 className="font-h2 text-h2 text-primary mb-1">{job?.title || 'Unknown Role'}</h1>
              <p className="font-body-lg text-secondary mb-2">{job?.company || 'Unknown Company'}</p>
              <div className="flex flex-wrap gap-3 text-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                  {job?.location || 'Remote'}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">work</span>
                  {job?.type || 'Full-time'}
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
              Applied {new Date(application.appliedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {interviewAt && (
          <div className="mb-8 rounded-xl border border-secondary/30 bg-secondary/10 p-5 text-secondary">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[28px]">event_available</span>
                <div>
                  <p className="font-h3 text-primary">Interview scheduled by the company</p>
                  <p className="text-sm text-on-surface-variant">{new Date(interviewAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
              </div>
              {interviewNotification?.data?.sender_id && (
                <Link className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-2 font-label-md text-on-secondary hover:opacity-90" to={`${ROUTES.SEEKER_MESSAGES}?user=${interviewNotification.data.sender_id}&job=${job?.id || ''}`}>
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  Open conversation
                </Link>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-h3 text-h3 text-primary mb-3">Application Status</h3>
              <div className="bg-surface p-4 rounded-lg border border-outline-variant">
                <p className={`text-body-md ${application.status === 'hired' ? 'text-green-600' : 'text-on-surface-variant'}`}>
                  {applicationStatusMessage(application.status, interviewAt)}
                </p>
              </div>
            </div>

            {matchScore > 0 && (
              <div>
                <h3 className="font-h3 text-h3 text-primary mb-3">Smart Match Analysis</h3>
                <div className="bg-secondary bg-opacity-5 p-6 rounded-lg border border-secondary border-opacity-20 flex items-center gap-6">
                  <MatchScoreBadge score={matchScore} size="lg" variant="ring" />
                  <div className="flex-1">
                    <p className="font-bold text-primary mb-1">{matchScore}% Match Score</p>
                    <p className="text-sm text-on-surface-variant">
                      This score reflects how well your skills and experience align with the requirements of this role.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-h3 text-h3 text-primary mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.length ? requiredSkills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-surface border border-outline-variant rounded-full text-sm text-on-surface-variant">
                    {skill}
                  </span>
                )) : <span className="text-on-surface-variant text-sm">Not specified</span>}
              </div>
            </div>

            <div>
              <h3 className="font-h3 text-h3 text-primary mb-3">Actions</h3>
              <div className="space-y-3">
                <Link to={`/seeker/jobs/${job?.id}`} className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-outline-variant hover:border-secondary hover:text-secondary rounded-lg transition-colors font-label-md text-primary bg-surface">
                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                  View Original Job Post
                </Link>
                {application.status === 'rejected' && (
                  <Link to={ROUTES.SEEKER_REJECTION_FEEDBACK.replace(':applicationId', application.id)} className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-on-secondary hover:bg-secondary-container rounded-lg transition-colors font-label-md">
                    <span className="material-symbols-outlined text-[18px]">feedback</span>
                    View Rejection Feedback
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
