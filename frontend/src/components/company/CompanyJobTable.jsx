import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CompanyEmptyState from './CompanyEmptyState';
import CompanyStatusBadge from './CompanyStatusBadge';

export default function CompanyJobTable({ jobs, onToggleStatus, onDeleteRequest }) {
  const { t } = useTranslation();

  if (!jobs.length) {
    return <CompanyEmptyState title={t('dashboardComponents.empty.noJobsTitle')} message={t('dashboardComponents.empty.noJobsMessage')} />;
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient overflow-hidden">
      <div className="hidden lg:grid grid-cols-12 gap-stack-md px-stack-lg py-stack-sm bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        <div className="col-span-4">{t('dashboardComponents.common.job')}</div>
        <div className="col-span-2 flex justify-center">{t('dashboardComponents.common.status')}</div>
        <div className="col-span-2 text-center">{t('dashboardComponents.common.applicants')}</div>
        <div className="col-span-2 text-center">{t('dashboardComponents.common.views')}</div>
        <div className="col-span-2 text-center">{t('dashboardComponents.common.actions')}</div>
      </div>
      {jobs.map((job) => (
        <div className="grid grid-cols-1 gap-4 px-stack-md sm:px-stack-lg py-stack-md border-t border-outline-variant items-start lg:grid-cols-12 lg:items-center" key={job.id}>
          <div className="lg:col-span-4 min-w-0">
            <Link className="font-h3 text-h3 text-primary hover:text-secondary truncate block" to={`/company/jobs/${job.id}`}>{job.title}</Link>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{job.location} · {t(`companyFlow.jobTypeOptions.${job.type}`, { defaultValue: job.type })}</p>
          </div>
          <div className="lg:col-span-2 flex lg:justify-center"><CompanyStatusBadge status={job.status} /></div>
          <div className="lg:col-span-2 lg:text-center">
            <span className="text-on-surface-variant lg:hidden">{t('dashboardComponents.common.applicants')}: </span><Link className="text-secondary font-semibold hover:underline" to={`/company/jobs/${job.id}/applicants`}>{job.applicationsCount}</Link>
          </div>
          <div className="lg:col-span-2 lg:text-center text-on-surface-variant"><span className="lg:hidden">{t('dashboardComponents.common.views')}: </span>{job.views}</div>
          <div className="lg:col-span-2 flex justify-start lg:justify-center gap-2 overflow-x-auto pb-1">
            <Link className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" title={t('buttons.viewDetails')} to={`/company/jobs/${job.id}`}><span className="material-symbols-outlined text-[20px]">visibility</span></Link>
            <Link className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" title={t('buttons.edit')} to={`/company/jobs/${job.id}/edit`}><span className="material-symbols-outlined text-[20px]">edit</span></Link>
            <button className="p-2 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-variant" title={job.status === 'active' ? t('buttons.pause') : t('buttons.publish')} onClick={() => onToggleStatus(job.id)} type="button">
              <span className="material-symbols-outlined text-[20px]">{job.status === 'active' ? 'pause' : 'publish'}</span>
            </button>
            <button className="p-2 rounded-lg text-error hover:bg-error-container transition-colors" title={t('buttons.delete')} onClick={() => onDeleteRequest(job)} type="button">
              <span className="material-symbols-outlined text-[20px]">delete_forever</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
