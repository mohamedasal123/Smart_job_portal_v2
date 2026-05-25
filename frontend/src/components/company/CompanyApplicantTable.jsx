import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ApplicantMatchScore from './ApplicantMatchScore';
import ApplicantStatusActions from './ApplicantStatusActions';
import CompanyEmptyState from './CompanyEmptyState';
import CompanyStatusBadge from './CompanyStatusBadge';

export default function CompanyApplicantTable({ applicants, onShortlist, onReject, onApprove }) {
  const { t } = useTranslation();

  if (!applicants.length) {
    return <CompanyEmptyState title={t('dashboardComponents.empty.noApplicantsTitle')} message={t('dashboardComponents.empty.noApplicantsMessage')} />;
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient overflow-hidden">
      <div className="hidden lg:grid grid-cols-12 gap-stack-md px-stack-lg py-stack-sm bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant border-b border-outline-variant">
        <div className="col-span-4">{t('dashboardComponents.common.candidate')}</div>
        <div className="col-span-2">{t('dashboardComponents.common.matchScore')}</div>
        <div className="col-span-2 flex justify-center">{t('dashboardComponents.common.status')}</div>
        <div className="col-span-1 text-center">{t('dashboardComponents.common.experience')}</div>
        <div className="col-span-3 text-end">{t('dashboardComponents.common.actions')}</div>
      </div>
      {applicants.map((applicant) => (
        <div className="grid grid-cols-1 gap-4 px-stack-md sm:px-stack-lg py-stack-md border-b border-outline-variant last:border-b-0 items-start lg:grid-cols-12 lg:items-center" key={applicant.id}>
          <div className="lg:col-span-4 flex items-center gap-stack-md min-w-0">
            {applicant.avatar ? (
              <img alt={applicant.name} className="w-11 h-11 rounded-full object-cover shrink-0" src={applicant.avatar} />
            ) : (
              <div className="w-11 h-11 rounded-full bg-secondary/10 flex items-center justify-center font-bold text-secondary shrink-0">
                {applicant.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <Link className="font-h3 text-h3 text-primary hover:text-secondary truncate block" to={`/company/applicants/${applicant.id}`}>{applicant.name}</Link>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{applicant.title || t('dashboardComponents.common.candidate')}</p>
            </div>
          </div>
          <div className="lg:col-span-2"><ApplicantMatchScore score={applicant.matchScore} /></div>
          <div className="lg:col-span-2 flex lg:justify-center"><CompanyStatusBadge status={applicant.status} /></div>
          <div className="lg:col-span-1 text-on-surface-variant text-sm lg:text-center"><span className="lg:hidden">{t('dashboardComponents.common.experience')}: </span>{t('dashboardComponents.common.yearsShort', { count: applicant.yearsExperience || 0 })}</div>
          <div className="lg:col-span-3 flex justify-start lg:justify-end overflow-x-auto pb-1">
            <ApplicantStatusActions applicant={applicant} compact onApprove={onApprove} onReject={onReject} onShortlist={onShortlist} />
          </div>
        </div>
      ))}
    </div>
  );
}
