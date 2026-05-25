import { useTranslation } from 'react-i18next';

export default function CompanyEmptyState({ title, message }) {
  const { t } = useTranslation();

  return (
    <div className="bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl p-stack-lg text-center">
      <span className="material-symbols-outlined text-[48px] text-outline mb-stack-sm">inbox</span>
      <h3 className="font-h2 text-h2 text-primary">{title || t('dashboardComponents.empty.nothingFound')}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant mt-unit">{message || t('dashboardComponents.empty.adjustFilters')}</p>
    </div>
  );
}
