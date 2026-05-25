import { useTranslation } from 'react-i18next';

const styles = {
  active: 'bg-[#22C55E]/10 text-[#15803D] border-[#22C55E]/30',
  banned: 'bg-error-container text-error border-error/20',
  verified: 'bg-[#22C55E]/10 text-[#15803D] border-[#22C55E]/30',
  unverified: 'bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/30',
  paused: 'bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/30',
  draft: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
  deleted: 'bg-error-container text-error border-error/20',
  success: 'bg-[#22C55E]/10 text-[#15803D] border-[#22C55E]/30',
  pending: 'bg-[#F59E0B]/10 text-[#B45309] border-[#F59E0B]/30',
  warning: 'bg-error-container text-error border-error/20',
};

const labelKeys = {
  active: 'statuses.user.active',
  banned: 'statuses.user.banned',
  verified: 'statuses.user.verified',
  unverified: 'statuses.user.unverified',
  paused: 'statuses.job.paused',
  draft: 'statuses.job.draft',
  deleted: 'statuses.job.deleted',
  success: 'statuses.success',
  pending: 'statuses.pending',
  warning: 'statuses.warning',
};

export default function AdminStatusBadge({ status }) {
  const { t } = useTranslation();
  const key = String(status || '').toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-label-sm text-label-sm ${styles[key] || styles.draft}`}>
      {labelKeys[key] ? t(labelKeys[key]) : status}
    </span>
  );
}
