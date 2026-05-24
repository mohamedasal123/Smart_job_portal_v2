import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { ROUTES, getRoleRedirect } from '../utils/constants';
import { useAuth } from '../context/useAuth';
import { adminDataService } from '../services/adminDataService';
import icon from '../assets/icon.png';

const navItems = [
  { label: 'Browse Jobs', to: ROUTES.JOBS, matches: ['/jobs'] },
  { label: 'Companies', to: ROUTES.COMPANIES, matches: ['/companies'] },
  { label: 'Salaries', to: ROUTES.SALARIES, matches: ['/salaries', '/salary-guide'] },
];

const isActive = (pathname, item) =>
  item.matches.some((path) => pathname === path || pathname.startsWith(`${path}/`));

export default function PublicNavBar({ showAuthActions = true }) {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const isAdmin = user?.role === 'admin';
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    if (isAdmin) {
      let isMounted = true;
      adminDataService.getActivityLog().then(res => {
        if (isMounted) {
          const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
          setRecentActivities(res.filter(act => !dismissed.includes(act.id)).slice(0, 5));
        }
      }).catch(() => { });
      return () => { isMounted = false; };
    }
  }, [isAdmin]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dismissNotification = (index, e) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentActivities(prev => {
      const act = prev[index];
      if (act) {
        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        localStorage.setItem('dismissed_notifications', JSON.stringify([...dismissed, act.id]));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const unreadCount = recentActivities.length;

  return (
    <header className="bg-surface-container-lowest/95 sticky top-0 z-50 w-full border-b border-outline-variant shadow-ambient backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-container-max-width flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-gutter lg:px-margin-desktop relative">
        <Link className="flex items-center gap-2 font-h2 text-h2 font-bold text-primary" to={ROUTES.HOME}>
          <img src={icon} alt="Smart Job Portal" className="h-8 w-auto object-contain" />
          <span className="hidden sm:inline">Smart Job Portal</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-2 items-center" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                className={[
                  'rounded-lg px-3 py-2 font-h3 text-h3 font-semibold transition-colors',
                  active
                    ? 'bg-surface-container-low text-secondary dark:text-secondary-fixed ring-1 ring-outline-variant'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-secondary dark:hover:text-secondary-fixed',
                ].join(' ')}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-stack-sm">
          <ThemeToggle compact />

          {isAdmin && (
            <div className="relative hidden md:block" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-error text-on-error rounded-full border-2 border-surface-container-lowest text-[9px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                    <h3 className="font-h3 text-primary">Notifications</h3>
                    <Link to={ROUTES.ADMIN_ACTIVITY_LOG} className="text-xs text-secondary hover:underline" onClick={() => setIsNotifOpen(false)}>View all</Link>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                      <div key={i} className="px-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors text-left text-sm relative group">
                        <button onClick={(e) => dismissNotification(i, e)} className="absolute right-2 top-2 w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                        <p className="font-semibold text-primary pr-6">{act.action}</p>
                        <p className="text-on-surface-variant text-xs mt-1 truncate pr-6">{act.targetType} - {act.targetName}</p>
                        <p className="text-outline text-xs mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                      </div>
                    )) : (
                      <p className="p-4 text-center text-on-surface-variant text-sm">No new notifications.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-[20px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>

          {showAuthActions && (
            <div className="hidden md:flex items-center gap-stack-sm">
              {isAuthenticated ? (
                <>
                  <Link className="items-center justify-center rounded-lg border border-outline-variant px-4 py-2 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low" to={getRoleRedirect(user?.role)}>
                    Dashboard
                  </Link>
                  <button onClick={() => logout()} className="items-center justify-center rounded-lg border border-error/30 text-error px-4 py-2 font-body-md text-body-md font-semibold transition-colors hover:bg-error-container">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="items-center justify-center rounded-lg border border-outline-variant px-4 py-2 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low" to={ROUTES.LOGIN}>
                    Sign In
                  </Link>
                  <Link className="inline-flex items-center justify-center rounded-lg bg-secondary text-on-secondary px-4 py-2 font-body-md text-body-md font-bold shadow-sm transition-colors hover:bg-secondary-container" to={ROUTES.POST_JOB}>
                    Post a Job
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-surface-container-lowest border-t border-outline-variant absolute top-full left-0 w-full shadow-md flex flex-col p-4 gap-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                className={[
                  'rounded-lg px-4 py-3 font-h3 text-h3 font-semibold transition-colors',
                  active
                    ? 'bg-surface-container-low text-secondary dark:text-secondary-fixed ring-1 ring-outline-variant'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-secondary dark:hover:text-secondary-fixed',
                ].join(' ')}
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          {showAuthActions && (
            <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-outline-variant">
              {isAuthenticated ? (
                <>
                  <Link className="w-full text-center items-center justify-center rounded-lg border border-outline-variant px-4 py-3 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low" to={getRoleRedirect(user?.role)} onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-center items-center justify-center rounded-lg border border-error/30 text-error px-4 py-3 font-body-md text-body-md font-semibold transition-colors hover:bg-error-container">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link className="w-full text-center items-center justify-center rounded-lg border border-outline-variant px-4 py-3 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low" to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link className="w-full text-center inline-flex items-center justify-center rounded-lg bg-secondary text-on-secondary px-4 py-3 font-body-md text-body-md font-bold shadow-sm transition-colors hover:bg-secondary-container" to={ROUTES.POST_JOB} onClick={() => setMobileMenuOpen(false)}>
                    Post a Job
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
