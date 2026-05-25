import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import { applyToJob, getApplications, getJobById, isJobSaved, toggleSavedJob, trackJobView } from '../../services/jobSeekerDataService';
import { useToast } from '../../components/useToast';
import MatchScoreBadge from '../../components/jobSeeker/MatchScoreBadge';

export default function JobSeekerJobDetailsPage() {
  const { t } = useTranslation();
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const data = await getJobById(jobId);
        setJob(data);
        trackJobView(jobId).catch(console.error);
        const isSaved = await isJobSaved(jobId);
        setSaved(isSaved);
        const apps = await getApplications();
        if (apps.some(a => String(a.jobId) === String(jobId))) {
          setHasApplied(true);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchJob();
  }, [jobId]);

  const handleApply = async () => {
    if (isApplying) return;
    setIsApplying(true);
    try {
      await applyToJob(jobId);
      setHasApplied(true);
      addToast({ title: t('seekerJobDetails.toasts.appliedTitle'), message: t('seekerJobDetails.toasts.appliedMessageWithCompany', { company: job?.company }), type: 'success' });
    } catch (error) {
      if (error?.status === 403 && error?.data?.message?.includes('CV')) {
         addToast({ title: t('seekerJobDetails.toasts.cvRequiredTitle'), message: t('seekerJobDetails.toasts.cvRequiredMessage'), type: 'error' });
         navigate(ROUTES.SEEKER_CV_UPLOAD);
      } else if (error?.status === 409) {
         setHasApplied(true);
         addToast({ title: t('seekerJobDetails.toasts.alreadyAppliedTitle'), message: t('seekerJobDetails.toasts.alreadyAppliedMessage'), type: 'info' });
      } else {
         addToast({ title: t('seekerJobDetails.toasts.applyFailedTitle'), message: error.message || t('seekerJobDetails.toasts.applyFailedMessage'), type: 'error' });
      }
    } finally {
      setIsApplying(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const result = await toggleSavedJob(jobId);
      setSaved(result.isSaved);
      addToast({ title: result.isSaved ? t('seekerJobDetails.toasts.savedTitle') : t('seekerJobDetails.toasts.unsavedTitle'), message: result.isSaved ? t('seekerJobDetails.toasts.savedMessage') : t('seekerJobDetails.toasts.unsavedMessage'), type: result.isSaved ? 'success' : 'info' });
    } catch {
      addToast({ title: t('seekerJobDetails.toasts.saveErrorTitle'), message: t('seekerJobDetails.toasts.saveErrorMessage'), type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop flex justify-center items-center h-full"><span className="material-symbols-outlined animate-spin text-[48px] text-secondary">progress_activity</span></div>;
  if (!job) return <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop text-center text-on-surface-variant"><p>{t('seekerJobDetails.notFound')}</p><Link to={ROUTES.SEEKER_JOBS} className="text-secondary hover:underline mt-4 inline-block">{t('seekerJobDetails.browseJobs')}</Link></div>;

  const matchScore = job.recommendation?.matchScore || job.matchScore;
  const matchedSkills = job.recommendation?.matchedSkills || [];

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-5xl mx-auto flex flex-col h-full pb-12">
      <div className="flex flex-col gap-stack-lg">
        <nav className="flex items-center gap-2 text-on-surface-variant font-body-md">
          <Link className="hover:text-secondary transition-colors" to={ROUTES.SEEKER_JOBS}>{t('seekerJobDetails.breadcrumb')}</Link>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-primary font-semibold">{job.title}</span>
        </nav>

        {hasApplied && (
          <div className="bg-success-container/20 border border-success rounded-lg p-stack-md flex items-center gap-stack-md">
            <span className="material-symbols-outlined text-success" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
            <span className="font-body-md font-medium text-success">{t('seekerJobDetails.appliedBanner')}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 flex flex-col gap-stack-lg">
            {/* Header Card */}
            <div className="bg-surface-container-lowest rounded-[16px] p-stack-xl shadow-sm border border-outline-variant flex flex-col gap-stack-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center gap-stack-md">
                <div className="w-16 h-16 shrink-0 rounded-lg border border-surface-variant bg-surface flex items-center justify-center p-2 font-bold text-2xl text-on-surface-variant">
                  {job.companyLogo ? <img alt={job.company} className="w-full h-full object-contain" src={job.companyLogo} /> : job.company?.charAt(0)}
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h1 className="font-h1 text-h1 text-primary break-words min-w-0">{job.title}</h1>
                    {matchScore && <MatchScoreBadge score={matchScore} size="md" showLabel={true} />}
                  </div>
                  <h2 className="font-h3 text-h3 text-on-surface-variant break-words">{job.company}</h2>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-stack-md mt-2">
                <div className="flex items-center gap-1 text-on-surface-variant font-body-md"><span className="material-symbols-outlined text-[18px]">location_on</span> {job.location} ({job.workMode})</div>
                <div className="w-1 h-1 rounded-full bg-outline-variant" />
                <div className="flex items-center gap-1 text-on-surface-variant font-body-md"><span className="material-symbols-outlined text-[18px]">payments</span> {job.currency} {job.salaryMin?.toLocaleString()} - {job.salaryMax?.toLocaleString()}</div>
                <div className="w-1 h-1 rounded-full bg-outline-variant" />
                <div className="flex items-center gap-1 text-on-surface-variant font-body-md"><span className="material-symbols-outlined text-[18px]">schedule</span> {job.type?.replace('_', '-')}</div>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-stack-md mt-4 pt-4 border-t border-surface-variant">
                {hasApplied ? (
                  <button className="w-full sm:w-auto justify-center bg-success-container/20 text-success font-body-lg font-bold py-3 px-6 rounded-lg flex items-center gap-2 cursor-default border border-success" disabled>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span> {t('seekerJobDetails.alreadyApplied')}
                  </button>
                ) : (
                  <button
                    className={`w-full sm:w-auto justify-center bg-secondary text-on-secondary font-body-lg font-bold py-3 px-6 rounded-lg flex items-center gap-2 hover:bg-secondary-container transition-colors ${isApplying ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={handleApply}
                    disabled={isApplying}
                  >
                    {isApplying ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : t('seekerJobDetails.oneClickApply')}
                    {!isApplying && <span className="material-symbols-outlined">send</span>}
                  </button>
                )}
                <button className={`w-full sm:w-auto justify-center bg-transparent border ${saved ? 'border-secondary text-secondary' : 'border-outline-variant text-on-surface'} font-body-lg font-bold py-3 px-6 rounded-lg hover:bg-surface-variant/30 transition-colors flex items-center gap-2`} onClick={handleSave}>
                  <span className="material-symbols-outlined">{saved ? 'bookmark' : 'bookmark_border'}</span> {saved ? t('seekerJobDetails.saved') : t('seekerJobDetails.saveJob')}
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="bg-surface-container-lowest rounded-[16px] p-stack-xl shadow-sm border border-outline-variant flex flex-col gap-stack-lg">
              <div><h3 className="font-h2 text-h2 text-primary">{t('seekerJobDetails.jobDescription')}</h3><p className="font-body-lg text-on-surface-variant leading-relaxed mt-2">{job.description}</p></div>
              {job.responsibilities?.length > 0 && (
                <div><h3 className="font-h3 text-h3 text-primary">{t('seekerJobDetails.responsibilities')}</h3><ul className="list-disc ps-5 text-on-surface-variant flex flex-col gap-2 mt-2">{job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
              )}
              {job.requirements?.length > 0 && (
                <div><h3 className="font-h3 text-h3 text-primary">{t('seekerJobDetails.requirements')}</h3><ul className="list-disc ps-5 text-on-surface-variant flex flex-col gap-2 mt-2">{job.requirements.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
              )}
              {job.requiredSkills?.length > 0 && (
                <div className="pt-stack-md border-t border-surface-variant">
                  <h3 className="font-h3 text-h3 text-primary mb-3">{t('seekerJobDetails.yourSkillsMatch')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((s, i) => {
                      const matched = matchedSkills.includes(s);
                      return <span key={i} className={`px-3 py-1 rounded-full font-label-md flex items-center gap-1 border ${matched ? 'bg-success-container/20 text-success border-success/30' : 'bg-surface-variant/50 text-on-surface-variant border-outline-variant'}`}>
                        {matched && <span className="material-symbols-outlined text-[14px]">check</span>} {s}
                      </span>;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-stack-lg">
            <div className="bg-surface-container-lowest rounded-[16px] p-stack-lg shadow-sm border border-outline-variant flex flex-col gap-stack-md">
              <h3 className="font-h3 text-h3 text-primary">{t('seekerJobDetails.aboutCompany', { name: job.company })}</h3>
              <p className="font-body-md text-on-surface-variant">{job.companyInfo?.description || t('seekerJobDetails.noCompanyInfo')}</p>
              <div className="flex flex-col gap-2 mt-2">
                {job.companyInfo?.employees && <div className="flex items-center gap-2 text-on-surface-variant font-body-sm"><span className="material-symbols-outlined text-[16px]">business</span> {t('seekerJobDetails.employees', { count: job.companyInfo.employees })}</div>}
                {job.companyInfo?.website && <div className="flex items-center gap-2 text-on-surface-variant font-body-sm"><span className="material-symbols-outlined text-[16px]">link</span> {job.companyInfo.website}</div>}
              </div>
            </div>

            {matchScore && (
              <div className="bg-surface-container-lowest rounded-[16px] p-stack-lg shadow-sm border border-outline-variant flex flex-col gap-stack-md relative overflow-hidden">
                <div className="absolute top-0 end-0 p-4 opacity-10"><span className="material-symbols-outlined text-[64px] text-primary">smart_toy</span></div>
                <h3 className="font-h3 text-h3 text-primary">{t('seekerJobDetails.aiMatchAnalysis')}</h3>
                <div className="flex items-center gap-4 py-2">
                   <MatchScoreBadge score={matchScore} size="lg" variant="ring" />
                   <div>
                     <p className="font-bold text-primary">{t('seekerJobDetails.percentMatch', { score: matchScore })}</p>
                     <p className="text-xs text-on-surface-variant">{t('seekerJobDetails.basedOnSkills')}</p>
                   </div>
                </div>
                {job.recommendation?.matchSummary && <p className="font-body-sm text-on-surface-variant mt-2 border-t border-outline-variant pt-3">{job.recommendation.matchSummary}</p>}
                <p className="text-[10px] text-on-surface-variant mt-2 italic">{t('seekerJobDetails.aiMatchDisclaimer')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
