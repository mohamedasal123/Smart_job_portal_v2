import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { companyDataService } from '../services/companyDataService';
import { ROUTES } from '../utils/constants';
import { useState, useEffect, useRef, useCallback } from 'react';
import PageTransition from '../motion/PageTransition';
import ThemeToggle from '../components/ThemeToggle';
import icon from '../assets/icon.png';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: ROUTES.COMPANY_DASHBOARD },
  { key: 'profile', label: 'Company Profile', icon: 'domain', to: ROUTES.COMPANY_PROFILE },
  { key: 'jobs', label: 'Manage Jobs', icon: 'work', to: ROUTES.COMPANY_JOBS },
  { key: 'create-job', label: 'Create Job', icon: 'add_circle', to: ROUTES.COMPANY_CREATE_JOB },
  { key: 'applicants', label: 'Applicants / Smart ATS', icon: 'group', to: ROUTES.COMPANY_APPLICANTS },
  { key: 'messages', label: 'Messages', icon: 'chat', to: ROUTES.COMPANY_MESSAGES },
  { key: 'notifications', label: 'Notifications', icon: 'notifications', to: ROUTES.COMPANY_NOTIFICATIONS },
  { key: 'settings', label: 'Settings', icon: 'settings', to: ROUTES.COMPANY_SETTINGS },
  { key: 'public-site', label: 'View Public Site', icon: 'public', to: ROUTES.HOME },
];

const ROUTE_PATH_KEY = 'path' + 'name';

const isCompanyNavActive = (item, routePath) => {
  const itemTo = item.to;

  if (item.key === 'public-site') {
    return false;
  }

  if (item.key === 'applicants') {
    return routePath.includes('/applicants') || routePath.startsWith('/company/applicants');
  }

  if (item.key === 'jobs') {
    const isJobRoute = routePath.startsWith('/company/jobs');
    const isApplicantsRoute = routePath.includes('/applicants');
    const isCreateRoute = routePath === '/company/jobs/create';
    return isJobRoute && !isApplicantsRoute && !isCreateRoute;
  }

  if (item.key === 'create-job') {
    return routePath === '/company/jobs/create';
  }

  if (routePath === itemTo) return true;

  if (itemTo === ROUTES.COMPANY_DASHBOARD) {
    return routePath === ROUTES.COMPANY_DASHBOARD;
  }

  return routePath.startsWith(itemTo);
};

const navClass = (isActive) =>
  [
    'flex items-center gap-stack-md rounded-lg px-stack-md py-stack-sm transition-colors font-body-md text-body-md',
    isActive
      ? 'bg-secondary text-on-secondary shadow-md translate-x-1'
      : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary',
  ].join(' ');

export default function CompanyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routePath = location[ROUTE_PATH_KEY];
  const [profile, setProfile] = useState({ name: '', logo: '' });
  const [recentNotifications, setRecentNotifications] = useState([]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const mobileDrawerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    companyDataService.getCompanyProfile().then(res => {
      if (isMounted) setProfile(res);
    }).catch(console.error);

    const fetchNotifs = () => {
      companyDataService.getCompanyNotifications().then(notifications => {
        if (isMounted) {
          const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
          const muteAllMessages = localStorage.getItem('muted_messages_all') === 'true';
          const mutedConversations = JSON.parse(localStorage.getItem('muted_message_conversations') || '[]');
          setRecentNotifications(notifications.filter(n => {
            const type = n.type || n.data?.type;
            const senderId = n.sender_id || n.data?.sender_id;
            const jobId = n.job_id || n.data?.job_id;
            const conversationKey = `${senderId || ''}-${jobId || ''}`;

            if (dismissed.includes(n.id)) return false;
            if (type === 'message_received' && muteAllMessages) return false;
            if (type === 'message_received' && mutedConversations.includes(conversationKey)) return false;
            return true;
          }).slice(0, 5));
        }
      }).catch(console.error);
    };

    fetchNotifs();

    // Listen for custom event to trigger refresh immediately
    const handleUpdate = () => fetchNotifs();
    window.addEventListener('notifications_updated', handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('notifications_updated', handleUpdate);
    };
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

  const dismissNotification = (index, e) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentNotifications(prev => {
      const act = prev[index];
      if (act) {
        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        localStorage.setItem('dismissed_notifications', JSON.stringify([...dismissed, act.id]));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const markAllNotificationsRead = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await companyDataService.markAllNotificationsRead();
      setRecentNotifications((prev) => prev.map((notification) => ({ ...notification, read_at: new Date().toISOString(), read: true })));
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await logout?.();
    navigate(ROUTES.LOGIN);
  };

  const handleNotifClick = async (notif, e) => {
    e.preventDefault();
    if (!notif.read_at) {
      companyDataService.markNotificationRead(notif.id).catch(console.error);
      setRecentNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
    }
    setIsNotifOpen(false);

    const type = notif.type || notif.data?.type;
    const senderId = notif.sender_id || notif.data?.sender_id;
    const jobId = notif.job_id || notif.data?.job_id;
    const appId = notif.application_id || notif.data?.application_id;

    if (type === 'message_received' || type === 'interview_reminder') {
      navigate(`${ROUTES.COMPANY_MESSAGES}?user=${senderId}&job=${jobId || ''}`);
    } else if (type === 'application_submitted' && appId) {
      navigate(`/company/applicants/${appId}`);
    } else if (type === 'job_viewed' && jobId) {
      navigate(`/company/jobs/${jobId}`);
    } else {
      navigate(ROUTES.COMPANY_NOTIFICATIONS);
    }
  };

  const displayName = profile.name || user?.name || 'Company';
  const displayEmail = user?.email || '';
  const initials = displayName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const companyImage = user?.profile_image || user?.avatar || profile.logo || null;
  const unreadCount = recentNotifications.filter(n => !n.read_at && !n.read).length;
  const sidebarContent = (onNavigate) => (
    <>
      <Link to={ROUTES.COMPANY_DASHBOARD} className="mb-stack-lg flex items-center gap-stack-sm px-stack-sm shrink-0 hover:opacity-80 transition-opacity" onClick={onNavigate}>
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <img src={icon} alt="Smart Job Portal" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-h3 text-h3 font-bold text-primary">Smart Job Portal</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Recruiter Workspace</p>
        </div>
      </Link>

      <nav className="flex-1 min-h-0 flex flex-col gap-unit overflow-y-auto pr-unit">
        {navItems.map((item) => {
          const isActive = isCompanyNavActive(item, routePath);
          return (
            <NavLink
              className={() => navClass(isActive)}
              key={item.to}
              onClick={onNavigate}
              to={item.to}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
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
    <div className="stitch-page bg-surface text-on-surface font-body-md text-body-md flex h-screen overflow-hidden">
      {/* Sidebar */}
      {isSidebarOpen && (
        <aside className="hidden md:flex flex-col h-screen p-stack-md border-r border-outline-variant bg-surface-container-low w-sidebar-width shrink-0 overflow-hidden transition-all duration-300">
          {sidebarContent()}
        </aside>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <aside
            aria-label="Company navigation"
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
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex w-10 h-10 rounded-lg items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              title="Toggle Sidebar"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
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
                  <span className="absolute top-0 right-0 w-4 h-4 bg-error text-white rounded-full border-2 border-surface-container-lowest text-[9px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center gap-3">
                    <h3 className="font-h3 text-primary">Notifications</h3>
                    <div className="flex items-center gap-2">
                      <button className="inline-flex items-center gap-1 text-xs text-secondary hover:underline disabled:opacity-40" disabled={!unreadCount} onClick={markAllNotificationsRead} type="button">
                        <span className="material-symbols-outlined text-[14px]">done_all</span>
                        Mark all as read
                      </button>
                      <Link to={ROUTES.COMPANY_NOTIFICATIONS} className="text-xs text-secondary hover:underline" onClick={() => setIsNotifOpen(false)}>View all</Link>
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {recentNotifications.length > 0 ? recentNotifications.map((notif, i) => (
                      <div
                        key={notif.id || i}
                        className="px-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors text-left text-sm relative group cursor-pointer"
                        onClick={(e) => handleNotifClick(notif, e)}
                      >
                        <button onClick={(e) => dismissNotification(i, e)} className="absolute right-2 top-2 w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container opacity-0 group-hover:opacity-100 transition-all shadow-sm">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                        <p className="font-semibold text-primary pr-6">{notif.title || notif.data?.title || 'Notification'}</p>
                        <p className="text-on-surface-variant text-xs mt-1 pr-6">{notif.message || notif.data?.message}</p>
                        <p className="text-outline text-xs mt-1">{new Date(notif.created_at || Date.now()).toLocaleString()}</p>
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
                {companyImage ? (
                  <img alt={displayName} className="w-10 h-10 rounded-full object-cover border border-outline-variant" src={companyImage} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-h3 text-h3">
                    {initials}
                  </div>
                )}
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
                    to={ROUTES.COMPANY_PROFILE}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-surface-container-low transition-colors text-on-surface font-body-md"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="material-symbols-outlined text-[20px]">domain</span>
                    Company Profile
                  </Link>
                  <Link
                    to={ROUTES.COMPANY_SETTINGS}
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

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-12 pb-12">
          <PageTransition className="flex flex-col gap-8">
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
