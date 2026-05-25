import { useTranslation } from 'react-i18next';

const labels = {
  job_seeker: 'roles.jobSeeker',
  company: 'roles.company',
  admin: 'roles.admin',
};

const styles = {
  job_seeker: 'bg-primary-fixed text-on-primary-fixed-variant',
  company: 'bg-secondary-container text-on-secondary-container',
  admin: 'bg-surface-container-high text-primary',
};

export default function AdminRoleBadge({ role }) {
  const { t } = useTranslation();
  const key = String(role || '').toLowerCase();
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 font-label-sm text-label-sm ${styles[key] || styles.admin}`}>
      {labels[key] ? t(labels[key]) : role}
    </span>
  );
}
