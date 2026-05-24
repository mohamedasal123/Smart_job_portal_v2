import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import ApplicantMatchScore from '../../components/company/ApplicantMatchScore';
import CompanyApplicantCard from '../../components/company/CompanyApplicantCard';
import CompanyApplicantTable from '../../components/company/CompanyApplicantTable';
import CompanyEmptyState from '../../components/company/CompanyEmptyState';
import CompanyJobCard from '../../components/company/CompanyJobCard';
import CompanyJobTable from '../../components/company/CompanyJobTable';
import CompanyPageHeader from '../../components/company/CompanyPageHeader';
import CompanySkillTag from '../../components/company/CompanySkillTag';
import CompanyStatsCard from '../../components/company/CompanyStatsCard';
import CompanyStatusBadge from '../../components/company/CompanyStatusBadge';
import { useToast } from '../../components/useToast';
import { useAuth } from '../../context/useAuth';
import { useValidationErrors } from '../../hooks/useValidationErrors';
import { companyDataService } from '../../services/companyDataService';
import { companyApi } from '../../api/companyApi';
import { ROUTES } from '../../utils/constants';

const salary = (job) => `$${Math.round(job.salaryMin / 1000)}k - $${Math.round(job.salaryMax / 1000)}k`;
const jobParam = (params) => params.jobId || params.id;
const toText = (value) => (Array.isArray(value) ? value.join('\n') : value || '');
const toList = (value) => String(value || '').split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);

const buttonPrimary = 'inline-flex items-center justify-center gap-unit bg-secondary text-on-secondary px-stack-md py-stack-sm rounded-lg font-h3 text-h3 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed';
const buttonSecondary = 'inline-flex items-center justify-center gap-unit border border-outline-variant text-primary px-stack-md py-stack-sm rounded-lg font-h3 text-h3 hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
const buttonDanger = 'inline-flex items-center justify-center gap-unit border border-error/30 text-error px-stack-md py-stack-sm rounded-lg font-h3 text-h3 hover:bg-error-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

export function FullPageSpinner() {
  return (
    <div className="flex w-full min-h-[400px] items-center justify-center">
      <span className="material-symbols-outlined animate-spin text-4xl text-secondary">progress_activity</span>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="font-label-md text-label-md text-primary">{label}</span>
      <div className="mt-unit">{children}</div>
      {error && <p className="font-body-sm text-body-sm text-error mt-unit">{error}</p>}
    </label>
  );
}

function TextInput(props) {
  return <input className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary disabled:opacity-50" {...props} />;
}

function TextArea(props) {
  return <textarea className="w-full min-h-32 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary disabled:opacity-50" {...props} />;
}

function SelectInput(props) {
  return (
    <div className="relative">
      <select
        className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary disabled:opacity-50 appearance-none cursor-pointer"
        {...props}
      />
      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
        expand_more
      </span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient p-4 sm:p-6 lg:p-8 space-y-6">
      <h2 className="font-h2 text-h2 text-primary">{title}</h2>
      {children}
    </section>
  );
}

function PaginationControls({ page, setPage, itemsCount }) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-stack-md bg-surface-container-lowest p-stack-sm rounded-lg border border-outline-variant">
      <button className={buttonSecondary} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
      <span className="text-on-surface-variant font-label-md">Page {page}</span>
      <button className={buttonSecondary} disabled={itemsCount < 15} onClick={() => setPage(p => p + 1)}>Next</button>
    </div>
  );
}

function ApplicantActionModals({ shortlistTarget, rejectTarget, setShortlistTarget, setRejectTarget, onComplete }) {
  const { addToast } = useToast();
  const [sendEmail, setSendEmail] = useState(true);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [rejectJob, setRejectJob] = useState(null);

  useEffect(() => {
    if (rejectTarget) {
      companyDataService.getCompanyJobById(rejectTarget.jobId).then(setRejectJob).catch(console.error);
    }
  }, [rejectTarget]);

  const updateStatus = async (target, status) => {
    try {
      setSaving(true);
      const nextStatus = target.nextStatus || status;
      await companyDataService.updateApplicantStatus(target.applicationId, nextStatus);
      addToast({
        title: nextStatus === 'shortlisted' ? 'Candidate shortlisted' : nextStatus === 'under_review' ? 'Candidate moved back' : 'Candidate rejected',
        message: `${target.name} was moved to ${nextStatus.replace('_', ' ')}.`,
      });
      onComplete?.();
    } catch (e) {
      addToast({ title: 'Error', message: 'Failed to update applicant status.', type: 'error' });
    } finally {
      setSaving(false);
      setShortlistTarget(null);
      setRejectTarget(null);
    }
  };

  return (
    <>
      <ConfirmModal
        confirmLabel={saving ? "Saving..." : shortlistTarget?.nextStatus === 'under_review' ? "Unshortlist Candidate" : "Shortlist Candidate"}
        message={shortlistTarget ? (shortlistTarget.nextStatus === 'under_review' ? `Move ${shortlistTarget.name} back to under review?` : `Move ${shortlistTarget.name} to the shortlist for recruiter follow-up?`) : ''}
        onCancel={() => setShortlistTarget(null)}
        onConfirm={() => updateStatus(shortlistTarget, 'shortlisted')}
        open={Boolean(shortlistTarget)}
        title={shortlistTarget?.nextStatus === 'under_review' ? "Unshortlist candidate" : "Shortlist candidate"}
      />

      {rejectTarget && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/40">
          <div className="bg-surface-container-lowest rounded-xl shadow-overlay border border-outline-variant p-stack-lg w-full max-w-2xl mx-4">
            <h3 className="font-h2 text-h2 text-primary">Reject candidate</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
              Review the rejection details for {rejectTarget.name} on {rejectJob?.title || 'this job'}.
            </p>
            <div className="mt-stack-md flex flex-wrap gap-unit">
              {rejectTarget.missingSkills?.length ? rejectTarget.missingSkills.map((skill) => (
                <CompanySkillTag tone="missing" key={skill}>{skill}</CompanySkillTag>
              )) : <CompanySkillTag tone="matched">No missing skills</CompanySkillTag>}
            </div>
            <label className="mt-stack-md flex items-center gap-stack-sm text-on-surface-variant">
              <input checked={sendEmail} onChange={(event) => setSendEmail(event.target.checked)} type="checkbox" disabled={saving} />
              Send automated rejection email
            </label>
            {sendEmail && (
              <div className="mt-stack-md bg-surface-container-low rounded-lg p-stack-md border border-outline-variant">
                <p className="font-label-md text-label-md text-primary mb-unit">Email preview</p>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Hi {rejectTarget.name}, thank you for applying to {rejectJob?.title || 'our role'}. After review, we will not move forward at this time. We were specifically looking for stronger coverage in {rejectTarget.missingSkills?.join(', ') || 'the required role criteria'}.
                </p>
                <textarea
                  className="mt-stack-md w-full min-h-24 bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 disabled:opacity-50"
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Add an optional recruiter note"
                  value={note}
                  disabled={saving}
                />
              </div>
            )}
            <div className="mt-stack-lg flex justify-end gap-stack-sm">
              <button className={buttonSecondary} disabled={saving} onClick={() => setRejectTarget(null)}>Cancel</button>
              <button className={buttonDanger} disabled={saving} onClick={() => { updateStatus(rejectTarget, 'rejected'); setSendEmail(true); setNote(''); }}>
                {saving ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function useApplicantActions(refresh) {
  const { addToast } = useToast();
  const [shortlistTarget, setShortlistTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);

  const modals = (
    <>
      <ApplicantActionModals
        onComplete={refresh}
        rejectTarget={rejectTarget}
        setRejectTarget={setRejectTarget}
        setShortlistTarget={setShortlistTarget}
        shortlistTarget={shortlistTarget}
      />
      <ConfirmModal
        confirmLabel="Approve Candidate"
        message={approveTarget ? `Approve ${approveTarget.name} for this role?` : ''}
        onCancel={() => setApproveTarget(null)}
        onConfirm={async () => {
          try {
            await companyDataService.updateApplicantStatus(approveTarget.applicationId, 'approved');
            addToast({
              title: 'Candidate approved',
              message: `${approveTarget.name} was approved for this role.`,
            });
            setApproveTarget(null);
            refresh?.();
          } catch (e) {
            addToast({ title: 'Error', message: 'Failed to approve applicant.', type: 'error' });
          }
        }}
        open={Boolean(approveTarget)}
        title="Approve candidate"
      />
    </>
  );

  return { setShortlistTarget, setRejectTarget, setApproveTarget, modals };
}

function NotFoundState({ title = 'Item not found', message = 'The record may have been removed or is unavailable.' }) {
  return <CompanyEmptyState title={title} message={message} />;
}

function JobForm({ initialJob, mode }) {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { errors, serverError, handleApiError, clearErrors, setErrors } = useValidationErrors();
  const [savingStatus, setSavingStatus] = useState(null); // 'draft', 'active', 'preview', etc
  const [form, setForm] = useState({
    title: initialJob?.title || '',
    category: initialJob?.category || '',
    location: initialJob?.location || '',
    workMode: initialJob?.workMode || 'Hybrid',
    type: initialJob?.type || '',
    salaryMin: initialJob?.salaryMin || 90000,
    salaryMax: initialJob?.salaryMax || 130000,
    description: initialJob?.description || '',
    responsibilities: toText(initialJob?.responsibilities),
    requiredSkills: toText(initialJob?.requiredSkills),
    experienceLevel: initialJob?.experienceLevel || '',
    education: initialJob?.education || '',
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    clearErrors();
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = 'Job title is required.';
    if (!form.category.trim()) nextErrors.category = 'Category is required.';
    if (!form.location.trim()) nextErrors.location = 'Location is required.';
    if (!form.type.trim()) nextErrors.type = 'Job type is required.';
    if (!form.description.trim()) nextErrors.description = 'Description is required.';
    if (!toList(form.requiredSkills).length) nextErrors.requiredSkills = 'Add at least one required skill.';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      const firstError = Object.values(nextErrors)[0];
      addToast({ title: 'Missing information', message: firstError, type: 'error' });
      return false;
    }
    return true;
  };

  const payload = (status) => ({
    ...form,
    salaryMin: Number(form.salaryMin),
    salaryMax: Number(form.salaryMax),
    responsibilities: toList(form.responsibilities),
    requiredSkills: toList(form.requiredSkills),
    status,
  });

  const save = async (status) => {
    if (!validate()) return;
    setSavingStatus(status);
    try {
      if (mode === 'edit') {
        const updated = await companyDataService.updateCompanyJob(initialJob.id, payload(status === 'preview' ? 'draft' : status));
        addToast({ title: 'Job updated', message: `${updated.title} was saved.` });
        if (status === 'preview') {
          navigate(`/company/jobs/${updated.id}/preview`);
        } else {
          navigate(status === 'draft' ? ROUTES.COMPANY_JOBS : `/company/jobs/${updated.id}`);
        }
      } else {
        const created = await companyDataService.createCompanyJob(payload(status === 'preview' ? 'draft' : status));
        addToast({ title: status === 'draft' || status === 'preview' ? 'Draft saved' : 'Job published', message: `${created.title} is now saved.` });
        navigate(status === 'preview' ? `/company/jobs/${created.id}/preview` : (status === 'draft' ? ROUTES.COMPANY_JOBS : `/company/jobs/${created.id}`));
      }
    } catch (err) {
      handleApiError(err);
    } finally {
      setSavingStatus(null);
    }
  };

  const isSaving = savingStatus !== null;

  return (
    <form className="space-y-gutter" onSubmit={(event) => event.preventDefault()}>
      {serverError && (
        <div className="bg-error-container text-on-error-container p-stack-sm rounded-lg border border-error">
          <p>{serverError}</p>
        </div>
      )}
      <Section title="Basic info">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
          <Field error={errors.title} label="Job title"><TextInput disabled={isSaving} onChange={(event) =>
            update('title', event.target.value)} value={form.title} /></Field>
          <Field error={errors.category} label="Category">
            <SelectInput disabled={isSaving} onChange={(event) => update('category', event.target.value)} value={form.category}>
              <option value="">Select category</option>
              <option value="Engineering">Engineering</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Data Science">Data Science</option>
              <option value="Finance">Finance</option>
              <option value="Customer Success">Customer Success</option>
              <option value="Operations">Operations</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Other">Other</option>
            </SelectInput>
          </Field>
          <Field error={errors.type} label="Job type">
            <SelectInput disabled={isSaving} onChange={(event) => update('type', event.target.value)} value={form.type}>
              <option value="">Select type</option>
              <option value="full_time">Full time</option>
              <option value="part_time">Part time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </SelectInput>
          </Field>
          <Field error={errors.location} label="Location"><TextInput disabled={isSaving} onChange={(event) => update('location', event.target.value)} value={form.location} /></Field>
          <Field error={errors.workMode} label="Work mode">
            <SelectInput disabled={isSaving} onChange={(event) => update('workMode', event.target.value)} value={form.workMode}>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
            </SelectInput>
          </Field>
        </div>
      </Section>

      <Section title="Description">
        <Field error={errors.description} label="Job description"><TextArea disabled={isSaving} onChange={(event) => update('description', event.target.value)} value={form.description} /></Field>
      </Section>

      <Section title="Responsibilities">
        <Field error={errors.responsibilities} label="One responsibility per line"><TextArea disabled={isSaving} onChange={(event) => update('responsibilities', event.target.value)} value={form.responsibilities} /></Field>
      </Section>

      <Section title="Required skills">
        <Field error={errors.requiredSkills} label="Enter skills separated by commas or new lines"><TextArea disabled={isSaving} onChange={(event) => update('requiredSkills', event.target.value)} value={form.requiredSkills} /></Field>
        <div className="flex flex-wrap gap-unit">
          {toList(form.requiredSkills).map((skill) => <CompanySkillTag key={skill}>{skill}</CompanySkillTag>)}
        </div>
      </Section>

      <Section title="Salary, experience, and education">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
          <Field error={errors.salaryMin} label="Salary min">
            <TextInput
              disabled={isSaving}
              onChange={(event) => update('salaryMin', event.target.value.replace(/\D/g, '').slice(0, 7))}
              value={form.salaryMin ? Number(form.salaryMin).toLocaleString() : ''}
              placeholder="e.g. 90,000"
            />
          </Field>
          <Field error={errors.salaryMax} label="Salary max">
            <TextInput
              disabled={isSaving}
              onChange={(event) => update('salaryMax', event.target.value.replace(/\D/g, '').slice(0, 7))}
              value={form.salaryMax ? Number(form.salaryMax).toLocaleString() : ''}
              placeholder="e.g. 130,000"
            />
          </Field>
          <Field error={errors.experienceLevel} label="Experience level">
            <SelectInput disabled={isSaving} onChange={(event) => update('experienceLevel', event.target.value)} value={form.experienceLevel}>
              <option value="">Select level</option>
              <option value="Internship">Internship</option>
              <option value="Entry Level / Junior">Entry Level / Junior</option>
              <option value="Mid Level">Mid Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead / Manager">Lead / Manager</option>
              <option value="Director / Executive">Director / Executive</option>
            </SelectInput>
          </Field>
          <Field error={errors.education} label="Education"><TextInput disabled={isSaving} onChange={(event) => update('education', event.target.value)} value={form.education} /></Field>
        </div>
      </Section>

      <div className="flex flex-wrap justify-end gap-stack-sm">
        <button type="button" disabled={isSaving} className={buttonSecondary} onClick={() => navigate(mode === 'edit' ? `/company/jobs/${initialJob.id}` : ROUTES.COMPANY_JOBS)}>Cancel</button>

        <button type="button" disabled={isSaving} className={buttonSecondary} onClick={() => save('draft')}>
          {savingStatus === 'draft' ? 'Saving...' : 'Save Draft'}
        </button>

        <button type="button" disabled={isSaving} className={buttonSecondary} onClick={() => save('preview')}>
          {savingStatus === 'preview' ? 'Loading...' : 'Preview'}
        </button>

        <button type="button" disabled={isSaving} className={buttonPrimary} onClick={() => save('active')}>
          {savingStatus === 'active' ? 'Publishing...' : (mode === 'edit' ? 'Publish Changes' : 'Publish Job')}
        </button>
      </div>
    </form>
  );
}

function UndoToast({ target, onClear }) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!target) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!target) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-overlay flex items-center justify-between gap-4 w-auto min-w-[320px] max-w-[400px] animate-fade-up">
      <p className="font-body-sm truncate flex-1">Chat with {target.conv.candidate} deleted.</p>
      <div className="flex items-center gap-3 shrink-0">
        <span className="font-label-sm w-4 text-center">{timeLeft}s</span>
        <button
          onClick={() => {
            target.restore();
            onClear();
          }}
          className="font-label-sm text-secondary hover:underline px-2 py-1 rounded hover:bg-secondary/10 transition-colors uppercase tracking-wider"
        >
          Undo
        </button>
      </div>
    </div>
  );
}

export function CompanyDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { addToast } = useToast();
  const [shortlistTarget, setShortlistTarget] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    companyApi.getDashboard()
      .then(res => setStats(res.data || res)) // Depending on axios interceptor unwrapping
      .catch(err => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (target, status) => {
    try {
      await companyApi.updateApplicantStatus(target.application_id, status);
      addToast({
        title: status === 'shortlisted' ? 'Candidate shortlisted' : 'Candidate rejected',
        message: `${target.applicant_name} was moved to ${status}.`,
      });
      fetchData();
    } catch (e) {
      addToast({ title: 'Error', message: 'Failed to update applicant status.', type: 'error' });
    } finally {
      setShortlistTarget(null);
    }
  };

  const modals = (
    <AdminConfirmModal
      confirmLabel="Shortlist Candidate"
      message={shortlistTarget ? `Move ${shortlistTarget.applicant_name} to the shortlist for recruiter follow-up?` : ''}
      onCancel={() => setShortlistTarget(null)}
      onConfirm={() => updateStatus(shortlistTarget, 'shortlisted')}
      open={Boolean(shortlistTarget)}
      title="Shortlist candidate"
    />
  );

  if (loading) return <FullPageSpinner />;
  if (error) return <CompanyEmptyState title="Error loading dashboard" message={error} />;
  if (!stats) return null;

  return (
    <>
      <CompanyPageHeader
        actions={<Link className={buttonPrimary} to={ROUTES.COMPANY_CREATE_JOB}><span className="material-symbols-outlined text-[18px]">add</span>Create Job</Link>}
        eyebrow="Company Dashboard"
        title="Welcome back"
        description="Track job performance, applicant quality, and recruiter actions from one connected workspace."
      />

      {/* Overview Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <CompanyStatsCard icon="work" label="Total jobs" to={ROUTES.COMPANY_JOBS} value={stats.total_jobs} />
        <CompanyStatsCard icon="work_outline" label="Active jobs" to={ROUTES.COMPANY_JOBS} value={stats.active_jobs} />
        <CompanyStatsCard icon="group" label="Total applicants" to={ROUTES.COMPANY_APPLICANTS} value={stats.total_applicants} />
        <CompanyStatsCard icon="new_releases" label="New this week" to={ROUTES.COMPANY_APPLICANTS} value={stats.new_applicants_this_week} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-gutter">
        {/* Main Content Area (Left side) */}
        <div className="xl:col-span-2 flex flex-col gap-gutter">
          <Section title="Recent applicants">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
              {stats.recent_applicants?.map((applicant) => {
                const isShortlisted = String(applicant.status || '').toLowerCase() === 'shortlisted';
                return (
                  <div key={applicant.applicationId} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm hover:shadow-hover transition-shadow flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-h3 text-primary truncate pr-2">{applicant.name}</p>
                        <span className="bg-secondary/10 text-secondary text-xs font-bold px-2 py-1 rounded-full shrink-0">
                          {applicant.matchScore}% Match
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">work</span>
                        <span className="truncate">{applicant.job_title || applicant.title || 'Job Application'}</span>
                      </p>
                    </div>
                    <button onClick={() => setShortlistTarget({ ...applicant, nextStatus: isShortlisted ? 'under_review' : 'shortlisted' })} className={`w-full mt-2 text-center py-2 font-label-md rounded-lg transition-colors border ${isShortlisted ? 'border-outline-variant text-primary hover:bg-surface-container-high' : 'border-secondary/30 bg-surface-container-highest hover:bg-secondary/10 text-secondary'}`}>
                      {isShortlisted ? 'Unshortlist' : 'Shortlist Candidate'}
                    </button>
                  </div>
                )
              })}
              {!stats.recent_applicants?.length && <p className="text-on-surface-variant p-4">No recent applicants.</p>}
            </div>
          </Section>

          <Section title="Top performing jobs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
              {stats.top_jobs?.map((job) => (
                <div key={job.id} className="bg-surface-container-lowest rounded-xl p-5 border border-outline-variant shadow-sm flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-h3 text-primary leading-tight">{job.title}</p>
                    <CompanyStatusBadge status={job.is_active ? 'active' : 'paused'} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-auto">
                    <span className="material-symbols-outlined text-[18px]">group</span>
                    <span>{job.applicants_count} Applicants</span>
                  </div>
                </div>
              ))}
              {!stats.top_jobs?.length && <p className="text-on-surface-variant p-4">No top jobs.</p>}
            </div>
          </Section>
        </div>

        {/* Sidebar Area (Right side) */}
        <div className="flex flex-col gap-gutter">
          <Section title="Hiring Pipeline">
            <div className="flex flex-col gap-stack-sm">
              <Link to={ROUTES.COMPANY_APPLICANTS} className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors rounded-xl p-4 border border-outline-variant flex justify-between items-center group">
                <span className="text-on-surface-variant group-hover:text-primary transition-colors flex items-center gap-3 font-medium">
                  <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                  </div>
                  Under review
                </span>
                <span className="font-h2 text-primary">{stats.under_review}</span>
              </Link>

              <Link to={ROUTES.COMPANY_APPLICANTS} className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors rounded-xl p-4 border border-outline-variant flex justify-between items-center group">
                <span className="text-on-surface-variant group-hover:text-primary transition-colors flex items-center gap-3 font-medium">
                  <div className="w-8 h-8 rounded-full bg-success/10 text-success flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </div>
                  Shortlisted
                </span>
                <span className="font-h2 text-primary">{stats.shortlisted}</span>
              </Link>

              <Link to={ROUTES.COMPANY_APPLICANTS} className="bg-surface-container-lowest hover:bg-surface-container-low transition-colors rounded-xl p-4 border border-outline-variant flex justify-between items-center group">
                <span className="text-on-surface-variant group-hover:text-primary transition-colors flex items-center gap-3 font-medium">
                  <div className="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                  </div>
                  Rejected
                </span>
                <span className="font-h2 text-primary">{stats.rejected}</span>
              </Link>
            </div>
          </Section>
        </div>
      </div>
      {modals}
    </>
  );
}

export function CompanyProfile() {
  const [profile, setProfile] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      companyDataService.getCompanyProfile(),
      companyDataService.getCompanyJobs({ status: 'active' })
    ]).then(([p, j]) => {
      setProfile(p);
      setActiveJobs(j);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageSpinner />;
  if (!profile) return <NotFoundState title="Profile not found" />;

  return (
    <>
      <CompanyPageHeader
        actions={<><Link className={buttonSecondary} to={ROUTES.COMPANY_PROFILE + '/preview'}>
          <span className="material-symbols-outlined text-[18px]">open_in_new</span>
          Public Preview
        </Link><Link className={buttonPrimary} to={ROUTES.COMPANY_PROFILE + '/edit'}>
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </Link></>}
        eyebrow="Company Profile"
        title={profile.name}
        description={profile.description}
      />
      <Section title="Company details">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-36 h-36 rounded-2xl bg-surface border border-outline-variant flex items-center justify-center p-2 shrink-0">
            {profile.logo ? (
              <img alt={profile.name} className="w-full h-full object-contain" src={profile.logo} />
            ) : (
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">domain</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {[
              ['Industry', profile.industry],
              ['Website', profile.website],
              ['Location', profile.location],
              ['Contact email', profile.contactEmail],
              ['Phone', profile.phone],
              ['Founded', profile.foundedYear],
              ['Company size', profile.companySize],
              ['Active jobs', activeJobs.length],
            ].map(([label, value]) => (
              <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant shadow-sm flex flex-col justify-center" key={label}>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">{label}</p>
                <p className="font-h3 text-h3 text-primary break-all">{value || '-'}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}

export function CompanyEditProfile() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { errors, serverError, handleApiError, clearErrors, setErrors } = useValidationErrors();
  const { patchUser, refreshUser } = useAuth();

  const [form, setForm] = useState(null);
  const [logoFile, setLogoFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    companyDataService.getCompanyProfile().then(p => {
      setForm(p);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const validate = () => {
    clearErrors();
    const nextErrors = {};
    if (!form.name?.trim()) nextErrors.name = 'Company name is required.';
    if (!form.industry?.trim()) nextErrors.industry = 'Industry is required.';
    if (!form.location?.trim()) nextErrors.location = 'Location is required.';

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await companyDataService.updateCompanyProfile(form);
      addToast({ title: 'Profile saved', message: 'Company profile changes were saved.' });
      navigate(ROUTES.COMPANY_PROFILE);
    } catch (err) {
      handleApiError(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!form) return <NotFoundState />;

  return (
    <>
      <CompanyPageHeader eyebrow="Company Profile" title="Edit company profile" description="Keep your public employer brand and recruiter contact information current." />
      {serverError && (
        <div className="bg-error-container text-on-error-container p-stack-sm rounded-lg border border-error">
          <p>{serverError}</p>
        </div>
      )}
      <Section title="Profile information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
          <Field error={errors.name} label="Company name"><TextInput disabled={saving} onChange={(event) => update('name', event.target.value)} value={form.name || ''} /></Field>
          <Field error={errors.industry} label="Industry"><TextInput disabled={saving} onChange={(event) => update('industry', event.target.value)} value={form.industry || ''} /></Field>
          <Field error={errors.website} label="Website"><TextInput disabled={saving} onChange={(event) => update('website', event.target.value)} value={form.website || ''} /></Field>
          <Field error={errors.location} label="Location"><TextInput disabled={saving} onChange={(event) => update('location', event.target.value)} value={form.location || ''} /></Field>
          <Field error={errors.contactEmail} label="Contact email"><TextInput disabled={saving} onChange={(event) => update('contactEmail', event.target.value)} value={form.contactEmail || ''} /></Field>
          <Field error={errors.phone} label="Phone"><TextInput disabled={saving} onChange={(event) => update('phone', event.target.value)} value={form.phone || ''} /></Field>
          <Field error={errors.foundedYear} label="Founded year"><TextInput disabled={saving} onChange={(event) => update('foundedYear', event.target.value)} type="number" value={form.foundedYear || ''} /></Field>
          <Field error={errors.companySize} label="Company size"><TextInput disabled={saving} onChange={(event) => update('companySize', event.target.value)} value={form.companySize || ''} /></Field>
        </div>
        <Field error={errors.description} label="Description"><TextArea disabled={saving} onChange={(event) => update('description', event.target.value)} value={form.description || ''} /></Field>
        <Field label="Logo upload">
          <input
            className="block w-full text-on-surface-variant disabled:opacity-50"
            disabled={saving}
            onChange={async (event) => {
              const file = event.target.files?.[0];
              setLogoFile(file?.name || '');
              if (file) {
                try {
                  const uploadResult = await companyDataService.uploadCompanyLogo(file);
                  const newLogoUrl = uploadResult?.logo_url || uploadResult?.data?.logo_url || null;
                  if (newLogoUrl) {
                    patchUser({ profile_image: newLogoUrl, avatar: newLogoUrl });
                  }
                  addToast({ title: 'Logo uploaded', message: 'Logo was updated successfully.' });
                  await refreshUser();
                } catch (e) {
                  addToast({ title: 'Error', message: 'Failed to upload logo.', type: 'error' });
                }
              }
            }}
            type="file"
          />
          {logoFile && <p className="font-body-sm text-body-sm text-on-surface-variant mt-unit">Selected: {logoFile}</p>}
        </Field>
      </Section>
      <div className="flex justify-end gap-stack-sm mt-stack-md">
        <button disabled={saving} className={buttonSecondary} onClick={() => navigate(ROUTES.COMPANY_PROFILE)}>Cancel</button>
        <button disabled={saving} className={buttonPrimary} onClick={save}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </>
  );
}

export function CompanyProfilePreview() {
  const [profile, setProfile] = useState(null);
  const [activeJobs, setActiveJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      companyDataService.getCompanyProfile(),
      companyDataService.getCompanyJobs({ status: 'active' })
    ]).then(([p, j]) => {
      setProfile(p);
      setActiveJobs(j);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <FullPageSpinner />;
  if (!profile) return <NotFoundState />;

  return (
    <>
      <CompanyPageHeader
        actions={<><Link className={buttonSecondary} to={ROUTES.COMPANY_PROFILE}>
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Profile
        </Link><Link className={buttonPrimary} to={ROUTES.COMPANY_PROFILE + '/edit'}>
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </Link></>}
        eyebrow="Public Preview"
        title={profile.name}
        description={profile.description}
      />
      <Section title="Employer profile">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-32 h-32 rounded-2xl bg-surface border border-outline-variant flex items-center justify-center p-2 shrink-0">
            {profile.logo ? (
              <img alt={profile.name} className="w-full h-full object-contain" src={profile.logo} />
            ) : (
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant">domain</span>
            )}
          </div>
          <div className="space-y-2 text-on-surface-variant flex flex-col justify-center">
            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">category</span> {profile.industry} · {profile.location}</p>
            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">group</span> {profile.companySize} · Founded {profile.foundedYear}</p>
            <p className="flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">language</span> <a href={profile.website} target="_blank" rel="noreferrer" className="text-secondary hover:underline">{profile.website}</a></p>
          </div>
        </div>
      </Section>
      <Section title="Open jobs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeJobs.map((job) => <CompanyJobCard job={job} key={job.id} />)}
        </div>
      </Section>
    </>
  );
}

export function CompanyManageJobs() {
  const { addToast } = useToast();
  const [filters, setFilters] = useState({ query: '', status: 'all', sort: 'newest' });
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await companyDataService.getCompanyJobs({ ...filters, page });
      setJobs(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateFilters = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <>
      <CompanyPageHeader
        actions={<Link className={buttonPrimary} to={ROUTES.COMPANY_CREATE_JOB}><span className="material-symbols-outlined text-[18px]">add</span>Create Job</Link>}
        eyebrow="Manage Jobs"
        title="Job board"
        description="Search, filter, publish, pause, edit, preview, and remove job posts."
      />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient p-6 grid grid-cols-1 md:grid-cols-[1fr_160px_160px] gap-6 mb-8">
        <TextInput onChange={(event) => updateFilters('query', event.target.value)} placeholder="Search jobs by title, location, skill, work mode, or status..." value={filters.query} />
        <SelectInput onChange={(event) => updateFilters('status', event.target.value)} value={filters.status}>
          <option value="all">All Status</option><option value="active">Active</option><option value="draft">Draft</option><option value="paused">Paused</option><option value="closed">Closed</option>
        </SelectInput>
        <SelectInput onChange={(event) => updateFilters('sort', event.target.value)} value={filters.sort}>
          <option value="newest">Newest</option><option value="applicants">Most applicants</option><option value="views">Most views</option>
        </SelectInput>
      </div>

      {loading ? <FullPageSpinner /> : (
        <>
          <CompanyJobTable
            jobs={jobs}
            onDeleteRequest={setDeleteTarget}
            onToggleStatus={async (id) => {
              try {
                const updated = await companyDataService.toggleJobStatus(id);
                addToast({ title: 'Job status updated', message: `${updated.title} is now ${updated.status}.` });
                refresh();
              } catch (e) {
                addToast({ title: 'Error', message: 'Failed to update job status.', type: 'error' });
              }
            }}
          />
          <PaginationControls page={page} setPage={setPage} itemsCount={jobs.length} />
        </>
      )}

      <ConfirmModal
        confirmLabel={saving ? "Deleting..." : "Delete Job"}
        message={deleteTarget ? `Delete ${deleteTarget.title}? Applicants for this job will also be removed.` : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          setSaving(true);
          try {
            await companyDataService.deleteCompanyJob(deleteTarget.id);
            addToast({ title: 'Job deleted', message: `${deleteTarget.title} was removed.` });
            setDeleteTarget(null);
            refresh();
          } catch (e) {
            addToast({ title: 'Error', message: 'Failed to delete job.', type: 'error' });
          } finally {
            setSaving(false);
          }
        }}
        open={Boolean(deleteTarget)}
        title="Delete job"
        variant="danger"
      />
    </>
  );
}

export function CompanyCreateJobPost() {
  return (
    <>
      <CompanyPageHeader eyebrow="Create Job" title="Create job post" description="Build a complete job post and save it as a draft or publish it immediately." />
      <JobForm mode="create" />
    </>
  );
}

export function CompanyEditJobPost() {
  const params = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companyDataService.getCompanyJobById(jobParam(params)).then(res => {
      setJob(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params]);

  if (loading) return <FullPageSpinner />;
  if (!job) return <NotFoundState title="Job not found" message="This job post is unavailable." />;

  return (
    <>
      <CompanyPageHeader eyebrow="Edit Job" title={job.title} description="Update job details, requirements, and hiring expectations." />
      <JobForm initialJob={job} mode="edit" />
    </>
  );
}

export function CompanyJobPostPreview() {
  const params = useParams();
  const { addToast } = useToast();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companyDataService.getCompanyJobById(jobParam(params)).then(res => {
      setJob(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params]);

  const toggle = async () => {
    try {
      const updated = await companyDataService.toggleJobStatus(job.id);
      setJob(updated);
      addToast({ title: 'Job status updated', message: `${updated.title} is now ${updated.status}.` });
    } catch (e) {
      addToast({ title: 'Error', message: 'Failed to update status.', type: 'error' });
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!job) return <NotFoundState title="Preview unavailable" message="This job post could not be found." />;

  return (
    <>
      <CompanyPageHeader
        actions={<><Link className={buttonSecondary} to={`/company/jobs/${job.id}/edit`}>Back to Edit</Link><button className={buttonPrimary} onClick={toggle}>{job.status === 'active' ? 'Pause' : 'Publish'}</button><Link className={buttonSecondary} to={`/company/jobs/${job.id}/applicants`}>View Applicants</Link></>}
        eyebrow="Job Preview"
        title={job.title}
        description={`${job.location} · ${job.workMode} · ${job.type}`}
      />
      <Section title="Preview">
        <div className="flex items-center justify-between"><CompanyStatusBadge status={job.status} /><p className="font-h2 text-h2 text-primary">{salary(job)}</p></div>
        <p className="font-body-lg text-body-lg text-on-surface-variant">{job.description}</p>
        <div className="flex flex-wrap gap-unit">{job.requiredSkills.map((skill) => <CompanySkillTag key={skill}>{skill}</CompanySkillTag>)}</div>
        <ul className="list-disc pl-6 text-on-surface-variant space-y-unit">{job.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
      </Section>
    </>
  );
}

export function CompanyJobDetails() {
  const params = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const id = jobParam(params);
      const j = await companyDataService.getCompanyJobById(id);
      setJob(j);
      try {
        const a = await companyDataService.getApplicantsByJob(id);
        setApplicants(a);
      } catch (applicantsError) {
        console.error(applicantsError);
        setApplicants([]);
      }
    } catch (e) {
      console.error(e);
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { setShortlistTarget, setRejectTarget, setApproveTarget, modals } = useApplicantActions(fetchData);

  if (loading) return <FullPageSpinner />;
  if (!job) return <NotFoundState title="Job not found" message="This job post is unavailable." />;

  const averageScore = applicants.length ? Math.round(applicants.reduce((sum, item) => sum + item.matchScore, 0) / applicants.length) : 0;

  return (
    <>
      <CompanyPageHeader
        actions={<><Link className={buttonSecondary} to={`/company/jobs/${job.id}/applicants`}>View Applicants</Link><Link className={buttonSecondary} to={`/company/jobs/${job.id}/edit`}>Edit Job</Link><Link className={buttonSecondary} to={`/company/jobs/${job.id}/preview`}>Preview</Link><button className={buttonPrimary} onClick={async () => { const updated = await companyDataService.toggleJobStatus(job.id); setJob(updated); addToast({ title: 'Job status updated', message: `${updated.title} is now ${updated.status}.` }); }}>{job.status === 'active' ? 'Pause' : 'Publish'}</button><button className={buttonDanger} onClick={() => setDeleteOpen(true)}>Delete</button></>}
        eyebrow="Job Details"
        title={job.title}
        description={`${job.location} · ${job.workMode} · ${salary(job)}`}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-gutter">
        <CompanyStatsCard icon="visibility" label="Views" value={job.views} />
        <CompanyStatsCard icon="group" label="Applicants" value={applicants.length} />
        <CompanyStatsCard icon="analytics" label="Avg. match" value={`${averageScore}%`} />
        <CompanyStatsCard icon="work" label="Status" value={<CompanyStatusBadge status={job.status} />} />
      </div>
      <Section title="Job overview">
        <p className="font-body-lg text-body-lg text-on-surface-variant">{job.description}</p>
        <div className="flex flex-wrap gap-unit">{job.requiredSkills.map((skill) => <CompanySkillTag key={skill}>{skill}</CompanySkillTag>)}</div>
        <ul className="list-disc pl-6 text-on-surface-variant space-y-unit">{job.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="text-on-surface-variant">Experience: {job.experienceLevel} · Education: {job.education}</p>
      </Section>
      <Section title="Recent applicants">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-stack-md">
          {applicants.slice(0, 4).map((applicant) => <CompanyApplicantCard applicant={applicant} key={applicant.id} onReject={setRejectTarget} onShortlist={setShortlistTarget} onApprove={setApproveTarget} />)}
          {!applicants.length && <p className="text-on-surface-variant">No applicants yet.</p>}
        </div>
      </Section>
      {modals}
      <ConfirmModal
        confirmLabel="Delete Job"
        message={`Delete ${job.title}?`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await companyDataService.deleteCompanyJob(job.id);
          addToast({ title: 'Job deleted', message: `${job.title} was removed.` });
          navigate(ROUTES.COMPANY_JOBS);
        }}
        open={deleteOpen}
        title="Delete job"
        variant="danger"
      />
    </>
  );
}

export function CompanyApplicants() {
  const params = useParams();
  const jobId = jobParam(params);

  const [filters, setFilters] = useState({ query: '', status: 'all', sort: 'match' });
  const [page, setPage] = useState(1);
  const [applicants, setApplicants] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (jobId) {
        const [j, a] = await Promise.all([
          companyDataService.getCompanyJobById(jobId),
          companyDataService.getApplicantsByJob(jobId, { ...filters, page })
        ]);
        setJob(j);
        setApplicants(a);
      } else {
        const a = await companyDataService.getApplicants({ ...filters, page });
        setJob({ title: 'All Jobs' });
        setApplicants(a);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [jobId, filters, page]);

  useEffect(() => { refresh(); }, [refresh]);
  const { setShortlistTarget, setRejectTarget, setApproveTarget, modals } = useApplicantActions(refresh);

  const updateFilters = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  if (loading && !job) return <FullPageSpinner />;
  if (!job) return <NotFoundState title="Job not found" message="Applicants cannot be loaded for this job." />;

  return (
    <>
      <CompanyPageHeader eyebrow="Smart ATS" title={`Applicants for ${job.title}`} description="Review AI match scores, skill gaps, and candidate status." />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient p-stack-md grid grid-cols-1 md:grid-cols-[1fr_180px_200px] gap-stack-md">
        <TextInput onChange={(event) => updateFilters('query', event.target.value)} placeholder="Search by name, title, skill, or status" value={filters.query} />
        <SelectInput onChange={(event) => updateFilters('status', event.target.value)} value={filters.status}>
          <option value="all">All</option><option value="new">New</option><option value="under_review">Under Review</option><option value="shortlisted">Shortlisted</option><option value="rejected">Rejected</option>
        </SelectInput>
        <SelectInput onChange={(event) => updateFilters('sort', event.target.value)} value={filters.sort}>
          <option value="match">Match score</option><option value="newest">Newest</option><option value="experience">Years experience</option>
        </SelectInput>
      </div>

      {loading ? <FullPageSpinner /> : (
        <>
          <CompanyApplicantTable applicants={applicants} onApprove={setApproveTarget} onReject={setRejectTarget} onShortlist={setShortlistTarget} />
          <PaginationControls page={page} setPage={setPage} itemsCount={applicants.length} />
        </>
      )}

      {modals}
    </>
  );
}

export function CompanyApplicantProfile() {
  const params = useParams();
  const [applicant, setApplicant] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const a = await companyDataService.getApplicantById(params.id);
      setApplicant(a);
      if (a) {
        setJob(await companyDataService.getCompanyJobById(a.jobId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const { setShortlistTarget, setRejectTarget, setApproveTarget, modals } = useApplicantActions(fetchData);

  if (loading) return <FullPageSpinner />;
  if (!applicant) return <NotFoundState title="Applicant not found" message="This candidate record is unavailable." />;

  const isShortlisted = String(applicant.status || '').toLowerCase() === 'shortlisted';
  const messagePath = applicant.userId ? `${ROUTES.COMPANY_MESSAGES}?user=${applicant.userId}&job=${applicant.jobId}&application=${applicant.id}&name=${encodeURIComponent(applicant.name)}` : ROUTES.COMPANY_MESSAGES;
  const profileActionBase = 'h-14 w-full sm:w-[260px] px-stack-lg py-stack-md text-center whitespace-nowrap text-base font-semibold';
  const primaryActions = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-sm w-full">
      <button className={`${buttonPrimary} ${profileActionBase}`} onClick={() => setApproveTarget(applicant)}>
        <span className="material-symbols-outlined text-[18px]">verified</span>
        Approve
      </button>
      <button className={`${isShortlisted ? buttonSecondary : buttonPrimary} ${profileActionBase}`} onClick={() => setShortlistTarget({ ...applicant, nextStatus: isShortlisted ? 'under_review' : 'shortlisted' })}>
        <span className="material-symbols-outlined text-[18px]">{isShortlisted ? 'undo' : 'check_circle'}</span>
        {isShortlisted ? 'Unshortlist' : 'Shortlist'}
      </button>
      {isShortlisted ? <Link className={`${buttonSecondary} ${profileActionBase}`} to={messagePath}><span className="material-symbols-outlined text-[18px]">chat</span>Message Candidate</Link> : <div className={`${profileActionBase} hidden sm:block invisible`} />}
    </div>
  );
  const secondaryActions = (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-stack-sm w-full">
      <button className={`${buttonDanger} ${profileActionBase}`} onClick={() => setRejectTarget(applicant)}>
        <span className="material-symbols-outlined text-[18px]">cancel</span>
        Reject
      </button>
      <button className={`${buttonSecondary} ${profileActionBase}`} onClick={async () => {
        const blob = await companyDataService.getApplicantCV(applicant.id);
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `cv-${applicant.name}.pdf`);
        document.body.appendChild(link);
        link.click();
      }}>
        <span className="material-symbols-outlined text-[18px]">download</span>
        Download CV
      </button>
      <Link className={`${buttonSecondary} ${profileActionBase}`} to={`/company/jobs/${applicant.jobId}/applicants`}>
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Applicants
      </Link>
    </div>
  );

  return (
    <>
      <CompanyPageHeader
        actions={<div className="w-full sm:w-auto flex flex-col gap-stack-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-sm shadow-sm">{primaryActions}{secondaryActions}</div>}
        eyebrow="Applicant Profile"
        title={applicant.name}
        description={`${applicant.title} for ${job?.title || 'selected role'}`}
      />
      <div className="flex flex-col gap-8">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="h-32 bg-secondary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4">
              <span className="material-symbols-outlined text-[150px] text-secondary">person</span>
            </div>
          </div>
          <div className="px-8 pb-8 relative">
            <div className="w-24 h-24 rounded-full bg-surface border-4 border-surface-container-lowest flex items-center justify-center font-display text-h1 text-primary shadow-sm -mt-12 mb-4 overflow-hidden">
              {applicant.avatar ? <img alt={applicant.name} className="w-full h-full object-cover" src={applicant.avatar} /> : applicant.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col gap-8">
              <div className="max-w-3xl">
                <h1 className="font-display text-h2 text-primary">{applicant.name}</h1>
                <p className="font-body-lg text-on-surface-variant mt-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">email</span>
                  {applicant.email || 'No email available'}
                </p>
                {applicant.location && <p className="font-body-md text-on-surface-variant mt-1 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">location_on</span>{applicant.location}</p>}
                {applicant.phone && <p className="font-body-md text-on-surface-variant mt-1 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">call</span>{applicant.phone}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[180px_160px_minmax(260px,1fr)] gap-3 items-stretch">
                <div className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 min-h-[96px] flex flex-col justify-center">
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Application status</p>
                  <CompanyStatusBadge status={applicant.status} />
                </div>
                <div className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 min-h-[96px] flex flex-col justify-center">
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">work</span>Experience</p>
                  <p className="font-h3 text-primary">{applicant.yearsExperience} years</p>
                </div>
                <div className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 min-h-[96px] flex flex-col justify-center">
                  <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">school</span>Education</p>
                  <p className="font-body-md text-primary leading-relaxed" title={applicant.education}>{applicant.education}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-outline-variant grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
              <div>
                <h3 className="font-h3 text-primary mb-3">Top Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {applicant.skills?.length > 0 ? applicant.skills.map((skill) => <CompanySkillTag key={skill}>{skill}</CompanySkillTag>) : <p className="text-sm italic text-on-surface-variant">No skills listed.</p>}
                </div>
              </div>
              <Link to={`/company/applicants/${applicant.id}/matching`} className="block bg-surface-container-low rounded-xl p-4 border border-outline-variant hover:border-secondary hover:shadow-hover transition-all">
                <p className="font-h3 text-primary mb-3">AI match</p>
                <div className="flex justify-center"><ApplicantMatchScore score={applicant.matchScore} size="lg" /></div>
                <p className="font-label-md text-label-md text-primary mt-4 mb-2">Missing skills</p>
                <div className="flex flex-wrap gap-2">
                  {applicant.missingSkills?.length ? applicant.missingSkills.map((skill) => <CompanySkillTag tone="missing" key={skill}>{skill}</CompanySkillTag>) : <CompanySkillTag tone="matched">No missing skills detected</CompanySkillTag>}
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {modals}
    </>
  );
}

export function CompanyApplicantCvViewer() {
  return <NotFoundState title="CV Viewer unavailable" message="CV viewing is partially mocked and relies on download right now." />;
}

export function CompanyApplicantMatchingDetails() {
  const { id } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const a = await companyDataService.getApplicantById(id);
      setApplicant(a);
      if (a) {
        setJob(await companyDataService.getCompanyJobById(a.jobId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  const { setShortlistTarget, setRejectTarget, setApproveTarget, modals } = useApplicantActions(fetchData);

  if (loading) return <FullPageSpinner />;
  if (!applicant || !job) return <NotFoundState title="Matching details unavailable" message="Applicant or job data could not be found." />;
  const recommendation = applicant.matchScore >= 85 ? 'Strong candidate' : applicant.matchScore >= 70 ? 'Needs review' : 'Low match';

  return (
    <>
      <CompanyPageHeader
        actions={<div className="flex flex-col items-start sm:items-end gap-unit"><div className="flex flex-wrap gap-unit"><button className={buttonPrimary} onClick={() => setApproveTarget(applicant)}>Approve</button><button className={buttonSecondary} onClick={() => setShortlistTarget({ ...applicant, nextStatus: 'shortlisted' })}>Shortlist</button></div><div className="flex flex-wrap gap-unit"><button className={buttonDanger} onClick={() => setRejectTarget(applicant)}>Reject</button><Link className={buttonSecondary} to={`/company/applicants/${applicant.id}`}>View Profile</Link></div></div>}
        eyebrow="AI Matching Details"
        title={`${applicant.name} · ${recommendation}`}
        description={`Evaluated against ${job.title}.`}
      />
      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8">
        <div className="flex flex-col gap-6">
          <Section title="Match Score">
            <div className="flex justify-center py-4 border-b border-outline-variant mb-4">
              <ApplicantMatchScore score={applicant.matchScore} size="lg" />
            </div>
            <div className="flex justify-center">
              <CompanyStatusBadge status={applicant.status} />
            </div>
          </Section>
        </div>
        <Section title="Required skills checklist">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {job.requiredSkills.length ? job.requiredSkills.map((skill) => {
              const normalize = (value) => String(value || '').trim().toLowerCase();
              const applicantSkills = (applicant.skills || []).map(normalize);
              const missingSkills = (applicant.missingSkills || []).map(normalize);
              const normalizedSkill = normalize(skill);
              const matched = applicantSkills.includes(normalizedSkill) && !missingSkills.includes(normalizedSkill);
              return (
                <div className="flex items-center gap-3 bg-surface-container-low rounded-xl p-4 border border-outline-variant shadow-sm" key={skill}>
                  <span className={`material-symbols-outlined text-[24px] ${matched ? 'text-success' : 'text-error'}`}>{matched ? 'check_circle' : 'cancel'}</span>
                  <span className="font-body-md text-primary font-medium">{skill}</span>
                </div>
              );
            }) : <CompanyEmptyState title="No required skills" message="This job does not have required skills configured yet." />}
          </div>
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant shadow-sm space-y-3">
            <p className="text-on-surface-variant font-body-md flex items-center gap-2"><span className="material-symbols-outlined text-secondary">work</span> Experience match: <span className="font-bold text-primary">{applicant.yearsExperience} years</span> for a {job.experienceLevel} role.</p>
            <p className="text-on-surface-variant font-body-md flex items-center gap-2"><span className="material-symbols-outlined text-secondary">school</span> Education match: <span className="font-bold text-primary">{applicant.education}</span></p>
            <div className="border-t border-outline-variant pt-3 mt-3">
              <p className="font-h3 text-h3 text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">psychology</span>
                Recommendation: <span className={applicant.matchScore >= 85 ? 'text-success' : applicant.matchScore >= 70 ? 'text-secondary' : 'text-error'}>{recommendation}</span>
              </p>
            </div>
          </div>
        </Section>
      </div>
      {modals}
    </>
  );
}

export function CompanyNotifications() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    companyDataService.getCompanyNotifications()
      .then((items) => {
        setNotifications(items);
      })
      .catch((error) => {
        console.error(error);
        addToast({ title: 'Notifications unavailable', message: 'Could not load company notifications.', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, [addToast]);

  useEffect(() => { refresh(); }, [refresh]);

  const visibleNotifications = notifications.filter((notification) => {
    const type = notification.type || notification.data?.type;
    if (filter === 'unread') return !notification.read_at && !notification.read;
    if (filter === 'messages') return type === 'message_received' || type === 'message';
    if (filter === 'applications') return type === 'application_submitted' || type === 'application_update';
    if (filter === 'views') return type === 'job_viewed';
    return true;
  });
  const unreadCount = notifications.filter((notification) => !notification.read_at && !notification.read).length;

  const toneFor = (type) => {
    if (type === 'message_received' || type === 'message') return { icon: 'chat', className: 'bg-primary-container text-on-primary-container' };
    if (type === 'application_submitted' || type === 'application_update') return { icon: 'person_add', className: 'bg-success-container text-success' };
    if (type === 'job_viewed') return { icon: 'visibility', className: 'bg-secondary-container text-on-secondary-container' };
    if (type === 'interview_reminder') return { icon: 'event_available', className: 'bg-secondary-container text-on-secondary-container' };
    return { icon: 'notifications', className: 'bg-surface-container-high text-on-surface-variant' };
  };

  const markAll = async () => {
    try {
      await companyDataService.markAllNotificationsRead();
      refresh();
    } catch (error) {
      console.error(error);
      addToast({ title: 'Update failed', message: 'Could not mark notifications as read.', type: 'error' });
    }
  };

  const openNotification = async (notification) => {
    if (!notification.read_at && !notification.read) {
      await companyDataService.markNotificationRead(notification.id).catch(console.error);
      setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString(), read: true } : item));
    }

    const type = notification.type || notification.data?.type;
    const senderId = notification.sender_id || notification.data?.sender_id;
    const jobId = notification.job_id || notification.data?.job_id;
    const applicationId = notification.application_id || notification.data?.application_id;

    if ((type === 'message_received' || type === 'message') && (senderId || jobId)) {
      navigate(`${ROUTES.COMPANY_MESSAGES}?user=${senderId || ''}&job=${jobId || ''}`);
    } else if ((type === 'application_submitted' || type === 'application_update') && applicationId) {
      navigate(`/company/applicants/${applicationId}`);
    } else if (type === 'job_viewed' && jobId) {
      navigate(`/company/jobs/${jobId}`);
    }
  };

  return (
    <div className="w-full max-w-7xl space-y-gutter">
      <CompanyPageHeader
        actions={<button className={buttonSecondary} disabled={!unreadCount} onClick={markAll} type="button"><span className="material-symbols-outlined text-[18px]">done_all</span>Mark all as read</button>}
        eyebrow="Notifications"
        title="Company notifications"
        description="Monitor applicant, job, message, and view updates."
      />
      <div className="flex flex-wrap gap-unit">{['all', 'unread', 'messages', 'applications', 'views'].map((item) => <button className={`${filter === item ? 'bg-secondary text-on-secondary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'} px-stack-md py-stack-sm rounded-lg font-label-md text-label-md capitalize transition-colors`} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div>
      <section className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-ambient">
        {loading ? <FullPageSpinner /> : (!visibleNotifications.length ? <CompanyEmptyState title="No notifications" message="No notifications match this filter." /> : visibleNotifications.map((notification) => {
          const type = notification.type || notification.data?.type;
          const tone = toneFor(type);
          const unread = !notification.read_at && !notification.read;

          return (
            <button className={`w-full border-b border-outline-variant p-stack-lg text-left transition-colors last:border-b-0 ${unread ? 'bg-secondary-container/10 hover:bg-secondary-container/20' : 'hover:bg-surface-container-low'}`} key={notification.id} onClick={() => openNotification(notification)} type="button">
              <div className="flex items-start gap-stack-md">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${tone.className}`}>
                  <span className="material-symbols-outlined">{notification.icon || tone.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className={`font-h3 text-h3 ${unread ? 'text-primary' : 'text-on-surface'}`}>{notification.title || notification.data?.title || 'Notification'}</h3>
                    <span className="whitespace-nowrap text-label-sm text-on-surface-variant">{new Date(notification.created_at || Date.now()).toLocaleString()}</span>
                  </div>
                  <p className="mt-unit text-body-md text-on-surface-variant">{notification.message || notification.data?.message}</p>
                </div>
                {unread && <span className="mt-2 h-3 w-3 shrink-0 rounded-full bg-secondary" aria-hidden="true" />}
              </div>
            </button>
          );
        }))}
      </section>
    </div>
  );
}

export function CompanyMessages() {
  const location = useLocation();
  const { addToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [interviewTime, setInterviewTime] = useState('');
  const [editingInterview, setEditingInterview] = useState(false);
  const [interviews, setInterviews] = useState(() => JSON.parse(localStorage.getItem('scheduled_interviews') || '{}'));
  const [muteAllMessages, setMuteAllMessages] = useState(() => localStorage.getItem('muted_messages_all') === 'true');
  const [mutedConversations, setMutedConversations] = useState(() => JSON.parse(localStorage.getItem('muted_message_conversations') || '[]'));
  const [mutePulse, setMutePulse] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [messageQuery, setMessageQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, conversation: item });
  };

  const conversationKey = (conversation) => `${conversation?.other_user_id || ''}-${conversation?.job_id || ''}`;
  const active = conversations.find((item) => item.id === activeId);
  const activeConversationKey = conversationKey(active);
  const filteredConversations = conversations.filter((item) => {
    const query = messageQuery.trim().toLowerCase();
    if (!query) return true;

    return [item.candidate, item.role, item.last_message, item.status, item.company]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const saveInterviews = (next) => {
    setInterviews({ ...next });
    localStorage.setItem('scheduled_interviews', JSON.stringify(next));
    window.dispatchEvent(new Event('interviews_updated'));
  };

  useEffect(() => {
    const handleUpdate = () => {
      setInterviews(JSON.parse(localStorage.getItem('scheduled_interviews') || '{}'));
    };
    window.addEventListener('interviews_updated', handleUpdate);
    return () => window.removeEventListener('interviews_updated', handleUpdate);
  }, []);

  const scheduledInterviewData = active ? interviews[activeConversationKey] : null;
  const scheduledInterview = typeof scheduledInterviewData === 'object' ? scheduledInterviewData?.time : scheduledInterviewData;

  const toggleMuteAllMessages = () => {
    setMutePulse('all');
    window.setTimeout(() => setMutePulse(null), 350);
    setMuteAllMessages((prev) => {
      const next = !prev;
      localStorage.setItem('muted_messages_all', String(next));
      return next;
    });
  };

  const toggleMuteConversation = (conversation) => {
    const key = conversationKey(conversation);
    setMutePulse(key);
    window.setTimeout(() => setMutePulse(null), 350);
    setMutedConversations((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key];
      localStorage.setItem('muted_message_conversations', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    companyDataService.getCompanyMessages().then(data => {
      const params = new URLSearchParams(location.search);
      const targetUser = params.get('user');
      const targetJob = params.get('job');
      const targetApplication = params.get('application');
      const targetName = params.get('name');
      let nextConversations = data;

      if (targetUser && !nextConversations.some((item) => String(item.other_user_id) === String(targetUser) && String(item.job_id || '') === String(targetJob || ''))) {
        nextConversations = [{
          id: `draft-${targetUser}-${targetJob || 'general'}`,
          other_user_id: Number(targetUser),
          candidate: targetName || 'Selected candidate',
          role: targetJob ? 'Job conversation' : 'General conversation',
          job_id: targetJob ? Number(targetJob) : null,
          application_id: targetApplication ? Number(targetApplication) : null,
          last_message: '',
          time: 'New',
          unread: false,
          status: 'Shortlisted',
        }, ...nextConversations];
      }

      setConversations(nextConversations);
      if (nextConversations.length > 0) {
        const requested = targetUser ? nextConversations.find((item) => String(item.other_user_id) === String(targetUser) && String(item.job_id || '') === String(targetJob || '')) : null;
        setActiveId((requested || nextConversations[0]).id);
      }
      setLoading(false);
    });
  }, [location.search]);

  useEffect(() => {
    if (activeId) {
      const conv = conversations.find(c => c.id === activeId);
      if (conv) {
        companyDataService.getCompanyConversation(conv.other_user_id, conv.job_id).then(msgs => {
          setMessages(msgs);
        });
        if (conv.unread) {
          companyDataService.markMessagesAsRead(conv.other_user_id).then(() => {
            setConversations(prev => prev.map(c => c.id === activeId ? { ...c, unread: false } : c));
          });
        }
      }
    }
  }, [activeId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [activeId, messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeId) return;
    const conv = conversations.find(c => c.id === activeId);
    if (!conv) return;

    try {
      const sent = await companyDataService.sendCompanyMessage(conv.other_user_id, newMessage, conv.job_id);
      setMessages(prev => [...prev, { id: sent.id, from: 'You', text: sent.content, created_at: sent.created_at }]);
      setNewMessage('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleScheduleInterview = async () => {
    // Prevent schedule if input is empty, even if activeId exists
    if (!activeId || !interviewTime) return;
    const conv = conversations.find(c => c.id === activeId);
    if (!conv) return;

    // strip _passed if user is rescheduling
    const cleanTime = interviewTime.replace('_passed', '');
    const formatted = new Date(cleanTime).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
    const text = `Interview scheduled for ${formatted}. Please confirm your availability.`;

    try {
      const sent = await companyDataService.sendCompanyMessage(conv.other_user_id, text, conv.job_id, { interview_at: cleanTime });
      setMessages(prev => [...prev, { id: sent.id, from: 'You', text: sent.content, created_at: sent.created_at }]);

      const payload = {
        time: cleanTime,
        candidate: conv.candidate,
        job_id: conv.job_id,
        other_user_id: conv.other_user_id,
      };
      saveInterviews({ ...interviews, [conversationKey(conv)]: payload });

      const delay = new Date(cleanTime).getTime() - Date.now();
      if (delay <= 0) {
        // immediately mark as passed if scheduling in the past
        saveInterviews({ ...interviews, [conversationKey(conv)]: { ...payload, time: cleanTime + '_passed' } });
      }

      setInterviewTime('');
      setEditingInterview(false);
    } catch (e) {
      console.error(e);
    }
  };

  const [undoTarget, setUndoTarget] = useState(null);

  const handleDeleteConversation = async (convToDelete) => {
    const conv = convToDelete || active;
    if (!conv) return;

    // Remove from UI immediately for snappy feel
    const prevConversations = [...conversations];
    const prevMessages = [...messages];
    const prevActiveId = activeId;

    setConversations((prev) => prev.filter((item) => item.id !== conv.id));
    if (activeId === conv.id) {
      setMessages([]);
      setActiveId(null);
    }

    setContextMenu(null);

    const target = {
      conv,
      isUndone: false,
      restore: () => {
        target.isUndone = true;
        setConversations(prevConversations);
        if (prevActiveId === conv.id) {
          setMessages(prevMessages);
          setActiveId(prevActiveId);
        }
        setUndoTarget(null);
      }
    };

    setUndoTarget(target);

    // Wait 5 seconds to see if user undid the action
    setTimeout(async () => {
      if (target.isUndone) return;

      try {
        await companyDataService.deleteCompanyConversation(conv.other_user_id, conv.job_id);
        const key = conversationKey(conv);
        const nextInterviews = { ...interviews };
        delete nextInterviews[key];
        saveInterviews(nextInterviews);
      } catch (e) {
        console.error(e);
        // If delete fails, revert UI
        setConversations(prevConversations);
        if (prevActiveId === conv.id) {
          setMessages(prevMessages);
          setActiveId(prevActiveId);
        }
        addToast({ title: 'Error', message: 'Failed to delete chat.', type: 'error' });
      }
      setUndoTarget((current) => current === target ? null : current);
    }, 5000);
  };

  return (
    <>
      <div className="h-full min-h-0 overflow-hidden flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
          <div>
            <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary mb-1">Messages</p>
            <h1 className="font-h2 text-h2 text-primary">Candidate conversations</h1>
          </div>
          <button className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 shadow-sm ${muteAllMessages ? 'bg-surface-container-high text-on-surface-variant border border-outline-variant' : 'bg-secondary text-on-secondary hover:opacity-90'} ${mutePulse === 'all' ? 'animate-scale-in' : ''}`} onClick={toggleMuteAllMessages}>
            <span className="material-symbols-outlined text-[20px]">{muteAllMessages ? 'notifications_off' : 'notifications_active'}</span>
            {muteAllMessages ? 'Unmute all messages' : 'Mute all messages'}
          </button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5 flex-1 min-h-0 overflow-hidden">
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient overflow-hidden flex flex-col min-h-0">
            <div className="px-5 py-4 border-b border-outline-variant flex items-center justify-between">
              <h2 className="font-h2 text-h2 text-primary">Inbox</h2>
              <span className="text-sm text-on-surface-variant">{filteredConversations.length} chats</span>
            </div>
            <div className="px-4 pb-4 border-b border-outline-variant">
              <label className="relative block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input
                  className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2 pl-10 pr-3 text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                  onChange={(event) => setMessageQuery(event.target.value)}
                  placeholder="Search candidates, roles, messages"
                  value={messageQuery}
                />
              </label>
            </div>
            <div className="divide-y divide-outline-variant overflow-y-auto flex-1 p-2">
              {loading ? <FullPageSpinner /> : (
                filteredConversations.length === 0 ? <CompanyEmptyState title="No messages" message={messageQuery ? 'No conversations match your search.' : 'You have no messages yet.'} /> :
                  filteredConversations.map((item) => (
                    <div
                      key={item.id}
                      className={`w-full py-4 transition-colors hover:bg-surface-container-low rounded-lg px-4 cursor-pointer select-none ${active?.id === item.id ? 'bg-secondary-container/15' : ''}`}
                      onClick={() => setActiveId(item.id)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold shrink-0">
                          {item.candidate?.charAt(0)?.toUpperCase() || 'C'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <Link className="font-h3 text-h3 text-primary hover:text-secondary truncate block" to={item.application_id ? `/company/applicants/${item.application_id}` : '#'}>{item.candidate}</Link>
                            <span className="flex shrink-0 items-center gap-2 mt-1">
                              {mutedConversations.includes(conversationKey(item)) && <span className="material-symbols-outlined text-[16px] text-on-surface-variant" title="Muted conversation">notifications_off</span>}
                              {item.unread && <span className="h-2.5 w-2.5 rounded-full bg-secondary" aria-hidden="true" />}
                            </span>
                          </div>
                          <p className="text-on-surface-variant text-sm truncate">{item.role}</p>
                          <p className="mt-2 text-body-sm text-on-surface-variant truncate">{item.last_message || 'No messages yet'}</p>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <span className="text-body-sm text-secondary font-medium">{item.status}</span>
                            <span className="text-xs text-outline">{item.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient overflow-hidden flex flex-col min-h-0">
            {active ? (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex items-center justify-between gap-4 bg-surface-container-lowest border-b border-outline-variant px-4 py-2 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold shrink-0">
                      {active.candidate?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-h3 text-primary truncate">{active.candidate}</p>
                      <p className="text-on-surface-variant text-sm truncate">{active.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 ${mutedConversations.includes(conversationKey(active)) ? 'border border-outline-variant bg-surface-container-high text-on-surface-variant' : 'bg-secondary text-on-secondary'} ${mutePulse === conversationKey(active) ? 'animate-scale-in' : ''}`} onClick={() => toggleMuteConversation(active)}>
                      <span className="material-symbols-outlined text-[18px]">{mutedConversations.includes(conversationKey(active)) ? 'notifications_off' : 'notifications_active'}</span>
                      {mutedConversations.includes(conversationKey(active)) ? 'Unmute Chat' : 'Mute Chat'}
                    </button>
                  </div>
                </div>
                <div className="border-b border-outline-variant bg-surface-container-lowest px-4 py-1.5 shrink-0">
                  {scheduledInterview ? (
                    <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-2 rounded-lg border px-3 py-1.5 ${scheduledInterview.includes('_passed') ? 'border-outline-variant bg-surface-container-low text-on-surface-variant' : 'border-secondary/30 bg-secondary/10'}`}>
                      <div className={`flex items-center gap-3 ${scheduledInterview.includes('_passed') ? 'text-on-surface-variant' : 'text-secondary'}`}>
                        <span className="material-symbols-outlined">{scheduledInterview.includes('_passed') ? 'history' : 'event_available'}</span>
                        <div>
                          <p className="font-semibold text-sm">{scheduledInterview.includes('_passed') ? 'Interview passed' : 'Interview scheduled'}</p>
                          <p className="text-sm">{new Date(scheduledInterview.replace('_passed', '')).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                      </div>
                      <button className={`${scheduledInterview.includes('_passed') ? 'text-primary' : 'text-secondary'} font-semibold underline`} onClick={() => { setInterviewTime(scheduledInterview.includes('_passed') ? '' : scheduledInterview); setEditingInterview(true); }}>{scheduledInterview.includes('_passed') ? 'Re-interview' : 'Edit interview time'}</button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-outline-variant px-3 py-1.5 text-on-surface-variant text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">event_busy</span>
                      No interview scheduled yet.
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 bg-surface-container-lowest px-4 py-1.5 border-b border-outline-variant shrink-0 min-h-[52px]">
                  {(!scheduledInterview || editingInterview) && (
                    <>
                      {scheduledInterview && !editingInterview ? null : (
                        <>
                          <div className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 shadow-sm">
                            <span className="material-symbols-outlined text-[18px] text-secondary">event</span>
                            <input
                              className="bg-transparent text-sm outline-none text-primary min-w-[190px]"
                              type="datetime-local"
                              value={interviewTime}
                              onChange={(event) => setInterviewTime(event.target.value)}
                            />
                          </div>
                          <button className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-1.5 font-semibold text-sm transition-all duration-200 shadow-sm ${interviewTime ? 'bg-secondary text-on-secondary hover:-translate-y-0.5 hover:opacity-90' : 'bg-surface-container text-on-surface-variant cursor-not-allowed opacity-50'}`} disabled={!interviewTime} onClick={handleScheduleInterview}>
                            <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
                            {scheduledInterview ? 'Reschedule' : 'Schedule'}
                          </button>
                          <button className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-1.5 font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 border border-outline-variant text-on-surface-variant hover:bg-surface-container-high" onClick={() => { setEditingInterview(false); setInterviewTime(''); }}>
                            Cancel
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-4 bg-surface-container-low px-6 py-5 flex-1 overflow-y-auto min-h-0">
                  {messages.length === 0 ? <p className="text-on-surface-variant text-center font-body-sm italic mt-10">No messages yet.</p> :
                    messages.map((message, index) => {
                      const mine = message.from === 'You';
                      return (
                        <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`} key={`${active.id}-${message.id || index}`}>
                          <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${mine ? 'bg-secondary text-on-secondary rounded-tr-none' : 'bg-surface-container-lowest border border-outline-variant rounded-tl-none'}`}>
                            <p className={`font-label-sm text-xs mb-1 ${mine ? 'opacity-80' : 'text-on-surface-variant'}`}>{message.from}</p>
                            <p className="font-body-md leading-relaxed">{message.text}</p>
                          </div>
                        </div>
                      );
                    })
                  }
                  <div ref={messagesEndRef} />
                </div>
                <div className="flex gap-3 p-2.5 border-t border-outline-variant bg-surface-container-lowest shrink-0">
                  <input
                    className="flex-1 rounded-full border border-outline-variant bg-surface-container-low px-5 py-2.5 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/30 transition-all"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button className={`${buttonPrimary} rounded-full px-5`} onClick={handleSend} disabled={!newMessage.trim()}>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    Send
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center p-12 text-on-surface-variant border-2 border-dashed border-outline-variant rounded-xl m-6">Select a conversation from the left to start messaging.</div>
            )}
          </section>
        </div>
      </div>
      {contextMenu && (
        <div
          className="fixed bg-surface-container-lowest border border-outline-variant shadow-lg rounded-xl overflow-hidden z-[9999]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="w-full text-left px-4 py-3 flex items-center gap-2 text-error hover:bg-error-container transition-colors"
            onClick={() => handleDeleteConversation(contextMenu.conversation)}
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
            Delete Chat
          </button>
        </div>
      )}

      <UndoToast target={undoTarget} onClear={() => setUndoTarget(null)} />
    </>
  );
}

export function CompanySettings() {
  const { addToast } = useToast();
  const { user, refreshUser } = useAuth();

  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [unlockState, setUnlockState] = useState({ email: false, password: false });
  const [verifyInput, setVerifyInput] = useState('');
  const [verifyTarget, setVerifyTarget] = useState(null); // 'email' | 'password'
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
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
      await companyApi.verifyPassword(verifyInput);
      setUnlockState(prev => ({ ...prev, [verifyTarget]: true }));
      // Store the verified password to send with the final save request
      setSettings(prev => ({ ...prev, currentPassword: verifyInput }));
      setVerifyTarget(null);
    } catch (e) {
      setVerifyError('Incorrect password. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!settings.name.trim()) next.name = 'Name is required.';
    if (unlockState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)) next.email = 'Enter a valid email.';

    if (unlockState.password) {
      if (!settings.newPassword || settings.newPassword.length < 8) next.newPassword = 'Password must be at least 8 characters.';
      if (settings.newPassword !== settings.confirmPassword) next.confirmPassword = 'Passwords must match.';
    }

    setErrors(next);
    return !Object.keys(next).length;
  };

  const save = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await companyApi.updateSettings({
        name: settings.name,
        email: unlockState.email ? settings.email : undefined,
        currentPassword: settings.currentPassword || undefined,
        newPassword: unlockState.password ? settings.newPassword : undefined,
      });

      addToast({ title: 'Settings saved', message: 'Account settings were updated successfully.', type: 'success' });

      refreshUser();

      setSettings(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setUnlockState({ email: false, password: false });
    } catch (e) {
      addToast({ title: 'Update failed', message: e?.response?.data?.message || 'Could not update settings.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderVerifyBlock = (targetName) => (
    <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant shadow-sm mt-2">
      <p className="font-h3 text-primary mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-secondary">lock</span>
        Security Check Required
      </p>
      <p className="font-body-sm text-on-surface-variant mb-4">Please enter your current password to unlock {targetName} changes.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="password"
          className="flex-1 bg-surface border border-outline-variant rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
          placeholder="Current password"
          value={verifyInput}
          onChange={(e) => setVerifyInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && confirmVerify()}
        />
        <div className="flex gap-2">
          <button className={buttonSecondary} onClick={cancelVerify} disabled={verifying}>Cancel</button>
          <button className={buttonPrimary} onClick={confirmVerify} disabled={verifying || !verifyInput}>
            {verifying ? 'Verifying...' : 'Unlock'}
          </button>
        </div>
      </div>
      {verifyError && <p className="font-body-sm text-error mt-2 flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">error</span>{verifyError}</p>}
    </div>
  );

  return (
    <>
      <CompanyPageHeader
        eyebrow="Settings"
        title="Account Settings"
        description="Manage your account profile, email, and password security."
      />
      <div className="flex flex-col gap-8">
        <Section title="Account Details">
          <div className="grid grid-cols-1 gap-6">
            <Field error={errors.name} label="Account Name">
              <TextInput onChange={(e) => update('name', e.target.value)} value={settings.name} disabled={saving} />
            </Field>

            <div>
              <span className="font-label-md text-label-md text-primary block mb-1">Email Address</span>
              {!unlockState.email ? (
                verifyTarget === 'email' ? renderVerifyBlock('email') : (
                  <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5">
                    <span className="text-on-surface-variant font-body-md truncate">{user?.email}</span>
                    <button onClick={() => startVerify('email')} className="text-secondary font-semibold text-sm hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">edit</span> Change
                    </button>
                  </div>
                )
              ) : (
                <Field error={errors.email}>
                  <TextInput type="email" onChange={(e) => update('email', e.target.value)} value={settings.email} disabled={saving} />
                </Field>
              )}
            </div>

            <div>
              <span className="font-label-md text-label-md text-primary block mb-1">Password</span>
              {!unlockState.password ? (
                verifyTarget === 'password' ? renderVerifyBlock('password') : (
                  <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5">
                    <span className="text-on-surface-variant font-body-md tracking-[0.2em] mt-1">••••••••</span>
                    <button onClick={() => startVerify('password')} className="text-secondary font-semibold text-sm hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">edit</span> Change
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-4 bg-surface-container-low p-6 rounded-xl border border-outline-variant shadow-sm">
                  <h4 className="font-h3 text-primary">New Password</h4>
                  <Field error={errors.newPassword} label="Password">
                    <TextInput type="password" onChange={(e) => update('newPassword', e.target.value)} value={settings.newPassword} disabled={saving} />
                  </Field>
                  <Field error={errors.confirmPassword} label="Confirm Password">
                    <TextInput type="password" onChange={(e) => update('confirmPassword', e.target.value)} value={settings.confirmPassword} disabled={saving} />
                  </Field>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-outline-variant mt-2">
            <button className={buttonPrimary} onClick={save} disabled={saving}>
              <span className="material-symbols-outlined text-[20px]">save</span>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </Section>
      </div>
    </>
  );
}
