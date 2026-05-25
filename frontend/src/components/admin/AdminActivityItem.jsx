import { useTranslation } from 'react-i18next';
import AdminStatusBadge from './AdminStatusBadge';

export default function AdminActivityItem({ item, onClick }) {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

  // Use a professional date formatter
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString(dateLocale, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  };

  const getStyle = () => {
    switch (item.actionType) {
      case 'create': return { icon: 'add_circle', bg: 'bg-secondary/10', text: 'text-secondary' };
      case 'verify': return { icon: 'verified', bg: 'bg-green-100', text: 'text-green-700' };
      case 'ban': return { icon: 'gavel', bg: 'bg-error-container', text: 'text-error' };
      case 'delete': return { icon: 'delete_forever', bg: 'bg-error-container', text: 'text-error' };
      case 'update': return { icon: 'pause_circle', bg: 'bg-surface-variant', text: 'text-on-surface-variant' };
      default: 
        if (item.targetType === 'User') return { icon: 'person', bg: 'bg-surface-variant', text: 'text-on-surface-variant' };
        if (item.targetType === 'Job') return { icon: 'work', bg: 'bg-surface-variant', text: 'text-on-surface-variant' };
        return { icon: 'history', bg: 'bg-surface-variant', text: 'text-on-surface-variant' };
    }
  };

  const style = getStyle();
  const targetTypeLabel = (targetType) => {
    const key = String(targetType || '').toLowerCase();
    if (key === 'user') return t('dashboardComponents.common.user');
    if (key === 'job') return t('dashboardComponents.common.job');
    if (key === 'company') return t('dashboardComponents.common.company');
    return targetType;
  };
  const performedByLabel = (performedBy) => {
    const key = String(performedBy || '').toLowerCase();
    if (key === 'admin') return t('roles.admin');
    if (key === 'system') return t('dashboardComponents.common.system');
    return performedBy;
  };

  return (
    <div
      className={`w-full text-start flex flex-col xl:flex-row xl:items-center gap-4 bg-surface-container-lowest hover:bg-surface-container-low transition-all px-6 py-4 group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={onClick}
    >
      {/* Icon + Title */}
      <div className="flex items-center gap-4 min-w-0 flex-1 xl:w-1/3">
        <div className={`w-10 h-10 rounded-full ${style.bg} ${style.text} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined text-[20px]">{style.icon}</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-h3 text-primary truncate">{item.action}</span>
          <p className="font-body-md text-on-surface-variant truncate mt-0.5">
            {item.targetName}
          </p>
        </div>
      </div>
      
      {/* Details Columns */}
      <div className="flex items-center justify-between xl:justify-end gap-6 shrink-0 pl-14 xl:pl-0 border-t border-outline-variant xl:border-none pt-3 xl:pt-0 mt-2 xl:mt-0 xl:w-2/3">
        {/* Type Badge */}
        <div className="w-20 flex justify-start shrink-0">
          <span className="text-on-surface-variant text-xs px-2 py-0.5 bg-surface-container-high/30 rounded-md font-medium uppercase tracking-wider text-center w-full">
            {targetTypeLabel(item.targetType)}
          </span>
        </div>

        {/* Performed By & Date */}
        <div className="flex flex-col min-w-[150px] max-w-[200px] shrink-0">
          <p className="font-body-sm text-on-surface-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline shrink-0">
              {item.performedBy === 'Admin' || item.performedBy === 'System' ? 'admin_panel_settings' : 'account_circle'}
            </span>
            <span className="truncate">{performedByLabel(item.performedBy)}</span>
          </p>
          <p className="font-label-sm text-outline mt-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-outline shrink-0">schedule</span>
            <span className="truncate">{formatDate(item.createdAt)}</span>
          </p>
        </div>
        
        {/* Status */}
        <div className="w-24 flex justify-end shrink-0">
          <AdminStatusBadge status={item.status} />
        </div>
      </div>
    </div>
  );
}
