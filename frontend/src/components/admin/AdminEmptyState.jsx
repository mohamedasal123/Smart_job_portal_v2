import { useTranslation } from 'react-i18next';
import EmptyState from '../EmptyState';

export default function AdminEmptyState({ title, message, actionLabel, actionTo }) {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon="manage_search"
      title={title || t('dashboardComponents.empty.nothingFound')}
      message={message || t('dashboardComponents.empty.adjustFilters')}
      actionLabel={actionLabel}
      actionTo={actionTo}
    />
  );
}
