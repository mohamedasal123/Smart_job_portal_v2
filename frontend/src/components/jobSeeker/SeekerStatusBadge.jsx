import { useTranslation } from 'react-i18next';

export default function SeekerStatusBadge({ status }) {
  const { t } = useTranslation();
  const getStatusStyles = () => {
    switch (String(status || '').toLowerCase()) {
      case 'applied':
        return { bg: 'bg-[#2563EB]/10 border border-[#2563EB]/30', text: 'text-[#2563EB]', labelKey: 'statuses.application.applied', icon: 'send' };
      case 'under_review':
        return { bg: 'bg-[#8B5CF6]/10 border border-[#8B5CF6]/30', text: 'text-[#8B5CF6]', labelKey: 'statuses.application.underReview', icon: 'visibility' };
      case 'shortlisted':
        return { bg: 'bg-[#22C55E]/10 border border-[#22C55E]/30', text: 'text-[#22C55E]', labelKey: 'statuses.application.shortlisted', icon: 'star' };
      case 'approved':
        return { bg: 'bg-[#16A34A]/10 border border-[#16A34A]/30', text: 'text-[#16A34A]', labelKey: 'statuses.application.approved', icon: 'verified' };
      case 'interview_scheduled':
        return { bg: 'bg-[#0EA5E9]/10 border border-[#0EA5E9]/30', text: 'text-[#0EA5E9]', labelKey: 'statuses.application.interviewScheduled', icon: 'event_available' };
      case 'waiting_interview':
        return { bg: 'bg-[#F59E0B]/10 border border-[#F59E0B]/30', text: 'text-[#B45309]', labelKey: 'statuses.application.waitingInterview', icon: 'pending_actions' };
      case 'rejected':
        return { bg: 'bg-[#EF4444]/10 border border-[#EF4444]/30', text: 'text-[#EF4444]', labelKey: 'statuses.application.rejected', icon: 'cancel' };
      default:
        return { bg: 'bg-surface-variant', text: 'text-on-surface-variant', labelKey: null, icon: 'info' };
    }
  };

  const styles = getStatusStyles();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label-sm text-sm ${styles.bg} ${styles.text}`}>
      <span className="material-symbols-outlined text-[14px]">{styles.icon}</span>
      {styles.labelKey ? t(styles.labelKey) : status}
    </span>
  );
}
