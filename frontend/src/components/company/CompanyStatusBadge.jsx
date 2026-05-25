import { useTranslation } from 'react-i18next';

const statusStyles = {
  active: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
  paused: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
  draft: 'bg-surface-container-high text-on-surface-variant border-outline-variant',
  closed: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
  
  new: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30',
  applied: 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30',
  under_review: 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/30',
  shortlisted: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/30',
  approved: 'bg-[#0EA5E9]/10 text-[#0284C7] border-[#0EA5E9]/30',
  rejected: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
  pending: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30',
};

const labelKeys = {
  active: 'statuses.job.active',
  paused: 'statuses.job.paused',
  draft: 'statuses.job.draft',
  closed: 'statuses.job.closed',
  new: 'statuses.application.new',
  applied: 'statuses.application.applied',
  under_review: 'statuses.application.underReview',
  shortlisted: 'statuses.application.shortlisted',
  approved: 'statuses.application.approved',
  rejected: 'statuses.application.rejected',
  pending: 'statuses.pending',
};

export default function CompanyStatusBadge({ status }) {
  const { t } = useTranslation();
  const normalized = String(status || '').toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-label-sm text-label-sm ${statusStyles[normalized] || statusStyles.draft}`}>
      {labelKeys[normalized] ? t(labelKeys[normalized]) : status}
    </span>
  );
}
