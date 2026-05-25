import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminEmptyState from './AdminEmptyState';
import AdminStatusBadge from './AdminStatusBadge';

export default function AdminJobTable({ jobs, onDeleteRequest }) {
  const { t } = useTranslation();

  if (!jobs.length) {
    return <AdminEmptyState title={t('dashboardComponents.empty.noJobsTitle')} message={t('dashboardComponents.empty.noAdminJobsMessage')} />;
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient overflow-hidden">
      <div className="hidden lg:grid grid-cols-12 gap-stack-md px-stack-lg py-stack-sm bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        <div className="col-span-3">{t('dashboardComponents.common.job')}</div>
        <div className="col-span-2">{t('dashboardComponents.common.company')}</div>
        <div className="col-span-2">{t('dashboardComponents.common.location')}</div>
        <div className="col-span-1 text-center">{t('dashboardComponents.common.applicants')}</div>
        <div className="col-span-1 text-center">{t('dashboardComponents.common.reports')}</div>
        <div className="col-span-1 flex justify-center">{t('dashboardComponents.common.status')}</div>
        <div className="col-span-2 text-center">{t('dashboardComponents.common.actions')}</div>
      </div>
      {jobs.map((job) => (
        <div className="grid grid-cols-1 gap-4 px-stack-md sm:px-stack-lg py-stack-md border-t border-outline-variant items-start lg:grid-cols-12 lg:items-center" key={job.id}>
          <div className="lg:col-span-3 min-w-0">
            <Link className="font-h3 text-h3 text-primary hover:text-secondary truncate block" to={`/admin/jobs/${job.id}`}>{job.title}</Link>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{job.postedAt}</p>
          </div>
          <div className="lg:col-span-2 text-on-surface-variant truncate"><span className="lg:hidden">{t('dashboardComponents.common.company')}: </span>{job.company}</div>
          <div className="lg:col-span-2 text-on-surface-variant truncate"><span className="lg:hidden">{t('dashboardComponents.common.location')}: </span>{job.location}</div>
          <div className="lg:col-span-1 lg:text-center text-on-surface-variant"><span className="lg:hidden">{t('dashboardComponents.common.applicants')}: </span>{job.applicantsCount}</div>
          <div className="lg:col-span-1 lg:text-center text-on-surface-variant"><span className="lg:hidden">{t('dashboardComponents.common.reports')}: </span>{job.reportsCount || 0}</div>
          <div className="lg:col-span-1 flex lg:justify-center"><AdminStatusBadge status={job.status} /></div>
          <div className="lg:col-span-2 flex justify-start lg:justify-center gap-2">
            <Link className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors" title={t('buttons.viewDetails')} to={`/admin/jobs/${job.id}`}>
              <span className="material-symbols-outlined text-[20px]">visibility</span>
            </Link>
            <button className="p-2 rounded-lg text-error hover:bg-error-container transition-colors" onClick={() => onDeleteRequest(job)} title={t('buttons.forceDelete')} type="button">
              <span className="material-symbols-outlined text-[20px]">delete_forever</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
