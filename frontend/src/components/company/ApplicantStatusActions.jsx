import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ApplicantStatusActions({ applicant, onShortlist, onReject, onApprove, compact = false }) {
  const { t } = useTranslation();
  const normalizedStatus = String(applicant.status || '').toLowerCase();
  const isShortlisted = normalizedStatus === 'shortlisted';
  const buttonClass = compact
    ? 'p-2 rounded-lg hover:bg-surface-container-high'
    : 'inline-flex items-center gap-unit px-3 py-2 rounded-lg border border-outline-variant hover:bg-surface-container-low font-label-md text-label-md';

  return (
    <div className={`flex flex-wrap gap-unit ${compact ? 'justify-end' : 'mt-stack-md'}`}>
      <Link className={buttonClass} title={t('dashboardComponents.common.profile')} to={`/company/applicants/${applicant.id}`}>
        <span className="material-symbols-outlined text-[18px]">person</span>{!compact && t('dashboardComponents.common.profile')}
      </Link>
      <Link className={buttonClass} title={t('dashboardComponents.common.matching')} to={`/company/applicants/${applicant.id}/matching`}>
        <span className="material-symbols-outlined text-[18px]">analytics</span>{!compact && t('dashboardComponents.common.matching')}
      </Link>
      <Link className={buttonClass} title={t('dashboardComponents.common.cv')} to={`/company/applicants/${applicant.id}/cv`}>
        <span className="material-symbols-outlined text-[18px]">download</span>{!compact && t('dashboardComponents.common.cv')}
      </Link>
      <button className={`${buttonClass} ${isShortlisted ? 'text-[#F59E0B]' : 'text-[#15803D]'}`} onClick={() => onShortlist({ ...applicant, nextStatus: isShortlisted ? 'under_review' : 'shortlisted' })} title={isShortlisted ? t('dashboardComponents.common.unshortlist') : t('dashboardComponents.common.shortlist')} type="button">
        <span className="material-symbols-outlined text-[18px]">{isShortlisted ? 'undo' : 'check_circle'}</span>{!compact && (isShortlisted ? t('dashboardComponents.common.unshortlist') : t('dashboardComponents.common.shortlist'))}
      </button>
      <button className={`${buttonClass} text-[#0284C7]`} onClick={() => onApprove?.(applicant)} title={t('dashboardComponents.common.approve')} type="button">
        <span className="material-symbols-outlined text-[18px]">verified</span>{!compact && t('dashboardComponents.common.approve')}
      </button>
      <button className={`${buttonClass} text-error`} onClick={() => onReject(applicant)} title={t('dashboardComponents.common.reject')} type="button">
        <span className="material-symbols-outlined text-[18px]">cancel</span>{!compact && t('dashboardComponents.common.reject')}
      </button>
    </div>
  );
}
