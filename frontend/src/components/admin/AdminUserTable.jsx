import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AdminEmptyState from './AdminEmptyState';
import AdminRoleBadge from './AdminRoleBadge';
import AdminStatusBadge from './AdminStatusBadge';

export default function AdminUserTable({ users, onStatusAction }) {
  const { t } = useTranslation();

  if (!users.length) {
    return <AdminEmptyState title={t('dashboardComponents.empty.noUsersTitle')} message={t('dashboardComponents.empty.noUsersMessage')} />;
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient overflow-hidden">
      <div className="hidden lg:grid grid-cols-12 gap-stack-md px-stack-lg py-stack-sm bg-surface-container-low font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
        <div className="col-span-3">{t('dashboardComponents.common.user')}</div>
        <div className="col-span-2">{t('dashboardComponents.common.role')}</div>
        <div className="col-span-2 flex justify-center">{t('dashboardComponents.common.verification')}</div>
        <div className="col-span-2 flex justify-center">{t('dashboardComponents.common.status')}</div>
        <div className="col-span-1 text-center">{t('dashboardComponents.common.created')}</div>
        <div className="col-span-2 text-center">{t('dashboardComponents.common.actions')}</div>
      </div>
      {users.map((user) => (
        <div className="grid grid-cols-1 gap-4 px-stack-md sm:px-stack-lg py-stack-md border-t border-outline-variant items-start lg:grid-cols-12 lg:items-center" key={user.id}>
          <div className="lg:col-span-3 min-w-0">
            <Link className="font-h3 text-h3 text-primary hover:text-secondary truncate block" to={`/admin/users/${user.id}`}>{user.name}</Link>
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{user.email}</p>
          </div>
          <div className="lg:col-span-2"><AdminRoleBadge role={user.role} /></div>
          <div className="lg:col-span-2 flex lg:justify-center"><AdminStatusBadge status={user.verificationStatus} /></div>
          <div className="lg:col-span-2 flex lg:justify-center"><AdminStatusBadge status={user.accountStatus} /></div>
          <div className="lg:col-span-1 lg:text-center text-on-surface-variant text-sm truncate" title={user.createdAt}><span className="lg:hidden">{t('dashboardComponents.common.created')}: </span>{user.createdAt}</div>
          <div className="lg:col-span-2 flex justify-start lg:justify-center gap-2">
            <Link className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors" title={t('buttons.viewDetails')} to={`/admin/users/${user.id}`}>
              <span className="material-symbols-outlined text-[20px]">visibility</span>
            </Link>
            <button
              className={`p-2 rounded-lg transition-colors ${user.accountStatus === 'banned' ? 'text-success hover:bg-success-container/20' : 'text-error hover:bg-error-container'}`}
              onClick={() => onStatusAction(user)}
              title={user.accountStatus === 'banned' ? t('buttons.unban') : t('buttons.ban')}
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">{user.accountStatus === 'banned' ? 'lock_open' : 'block'}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
