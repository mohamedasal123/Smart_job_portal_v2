import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import PageTransition from '../motion/PageTransition';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/useAuth';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { ROUTES } from '../utils/constants';
import { adminDataService } from '../services/adminDataService';
import icon from '../assets/icon.png';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', to: ROUTES.ADMIN_DASHBOARD },
  { label: 'Users Management', icon: 'group', to: ROUTES.ADMIN_USERS },
  { label: 'Jobs Management', icon: 'work', to: ROUTES.ADMIN_JOBS },
  { label: 'Activity Log', icon: 'history', to: ROUTES.ADMIN_ACTIVITY_LOG },
  { label: 'Settings', icon: 'settings', to: ROUTES.ADMIN_SETTINGS },
  { label: 'View Public Site', icon: 'public', to: ROUTES.HOME },
];

const navClass = ({ isActive }) =>
  [
    'flex items-center gap-stack-md rounded-lg px-stack-md py-stack-sm transition-colors font-body-md text-body-md',
    isActive
      ? 'bg-secondary text-on-secondary shadow-md translate-x-1'
      : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary',
  ].join(' ');

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const mobileDrawerRef = useRef(null);

  useEffect(() => {
    // Fetch some data for the notification bell
    let isMounted = true;
    adminDataService.getActivityLog().then(res => {
      if (isMounted) {
        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        setRecentActivities(res.filter(act => !dismissed.includes(act.id)).slice(0, 5));
      }
    }).catch(() => { });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  useFocusTrap(isMobileMenuOpen, mobileDrawerRef, mobileMenuButtonRef, closeMobileMenu);

  const handleLogout = async () => {
    await logout?.();
    navigate(ROUTES.LOGIN);
  };

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

  const markAllNotificationsRead = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
    const nextDismissed = [...new Set([...dismissed, ...recentActivities.map((activity) => activity.id)])];
    localStorage.setItem('dismissed_notifications', JSON.stringify(nextDismissed));
    setRecentActivities([]);
  };

  const displayName = user?.name || 'Admin';
  const displayEmail = user?.email || 'admin@smartjobportal.local';
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const unreadCount = recentActivities.length; // Just using recent length as a mock dynamic number
  const sidebarContent = (onNavigate) => (
    <>
      <Link to={ROUTES.ADMIN_DASHBOARD} className="mb-stack-lg flex items-center gap-stack-sm px-stack-sm shrink-0 hover:opacity-80 transition-opacity" onClick={onNavigate}>
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <img src={icon} alt="Smart Job Portal" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-h3 text-h3 font-bold text-primary">Smart Job Portal</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Admin Console</p>
        </div>
      </Link>

      <nav className="flex-1 min-h-0 flex flex-col gap-unit overflow-y-auto pr-unit">
        {navItems.map((item) => (
          <NavLink className={navClass} end={item.to === ROUTES.ADMIN_DASHBOARD} key={item.to} onClick={onNavigate} to={item.to}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-stack-md border-t border-outline-variant flex flex-col gap-unit shrink-0 bg-surface-container-low">
        <NavLink className="flex items-center gap-stack-md text-on-surface-variant hover:bg-surface-container-highest rounded-lg px-stack-md py-stack-sm transition-colors" onClick={onNavigate} to={ROUTES.CONTACT}>
          <span className="material-symbols-outlined">help</span>
          <span>Help</span>
        </NavLink>
        <button className="flex items-center gap-stack-md text-on-surface-variant hover:bg-surface-container-highest rounded-lg px-stack-md py-stack-sm transition-colors text-left" onClick={handleLogout} type="button">
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="stitch-page bg-background text-on-background font-body-md text-body-md flex h-screen overflow-hidden">
      {isSidebarOpen && (
        <aside className="hidden md:flex flex-col h-screen p-stack-md border-r border-outline-variant bg-surface-container-low w-sidebar-width shrink-0 overflow-hidden">
          {sidebarContent()}
        </aside>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <aside
            aria-label="Admin navigation"
            aria-modal="true"
            className="flex h-full w-[min(280px,85vw)] flex-col p-stack-md border-r border-outline-variant bg-surface-container-low overflow-hidden focus:outline-none"
            onClick={(event) => event.stopPropagation()}
            ref={mobileDrawerRef}
            role="dialog"
            tabIndex={-1}
          >
            {sidebarContent(() => setIsMobileMenuOpen(false))}
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background">
        <header className="min-h-16 h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-gutter lg:px-margin-desktop shrink-0 z-50 shadow-ambient">
          <div className="flex items-center gap-4">
            <button
              aria-expanded={isMobileMenuOpen}
              aria-label="Open navigation menu"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              ref={mobileMenuButtonRef}
              title="Open menu"
              type="button"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="hidden md:flex w-10 h-10 rounded-lg items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              title="Toggle sidebar"
              type="button"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <Link to={ROUTES.ADMIN_DASHBOARD} className="md:hidden flex items-center gap-stack-sm hover:opacity-80 transition-opacity">
              <img src={icon} alt="Smart Job Portal" className="w-8 h-8 object-contain" />
              <span className="hidden sm:inline font-h3 text-h3 font-bold text-primary">Smart Job Portal</span>
            </Link>
          </div>

          <div className="flex items-center gap-stack-md">
            <ThemeToggle compact />

            {/* Notifications Dropdown */}
            <div className="relative" ref={notifRef}>
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
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center gap-3">
                    <h3 className="font-h3 text-primary">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <button className="inline-flex items-center gap-1 text-xs text-secondary hover:underline disabled:opacity-40" disabled={!recentActivities.length} onClick={markAllNotificationsRead} type="button">
                        <span className="material-symbols-outlined text-[14px]">done_all</span>
                        Mark all as read
                      </button>
                      <Link to={ROUTES.ADMIN_ACTIVITY_LOG} className="text-xs text-secondary hover:underline" onClick={() => setIsNotifOpen(false)}>View all</Link>
                    </div>
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

            <div className="h-8 w-px bg-outline-variant" />

            {/* User Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-stack-sm hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-h3 text-h3">
                  {initials}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="font-body-md text-body-md font-semibold text-primary leading-tight">{displayName}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant leading-tight max-w-[150px] truncate" title={displayEmail}>{displayEmail}</p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md overflow-hidden z-50 flex flex-col">
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                    <p className="font-semibold text-primary">{displayName}</p>
                    <p className="text-xs text-on-surface-variant truncate" title={displayEmail}>{displayEmail}</p>
                  </div>
                  <Link
                    to={ROUTES.ADMIN_SETTINGS}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-surface-container-low transition-colors text-on-surface font-body-md"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                    Account Settings
                  </Link>
                  <Link
                    to={ROUTES.HOME}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-surface-container-low transition-colors text-on-surface font-body-md"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="material-symbols-outlined text-[20px]">public</span>
                    View Public Site
                  </Link>
                  <div className="border-t border-outline-variant">
                    <button
                      onClick={() => { setIsProfileOpen(false); handleLogout(); }}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-error-container hover:text-error transition-colors text-error font-body-md"
                    >
                      <span className="material-symbols-outlined text-[20px]">logout</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-12 space-y-8 pb-12">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
