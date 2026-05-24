import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ROUTES } from '../utils/constants';
import { addLocalNotification, getNotifications, markNotificationRead } from '../services/jobSeekerDataService';
import PageTransition from '../motion/PageTransition';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '../components/useToast';
import icon from '../assets/icon.png';

const navItems = [
  { key: 'dashboard', to: ROUTES.SEEKER_DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
  { key: 'jobs', to: ROUTES.SEEKER_JOBS, label: 'Browse Jobs', icon: 'search' },
  { key: 'profile', to: ROUTES.SEEKER_PROFILE, label: 'Profile', icon: 'person' },
  { key: 'interviews', to: ROUTES.SEEKER_INTERVIEWS, label: 'Interviews', icon: 'event_available' },
  { key: 'messages', to: ROUTES.SEEKER_MESSAGES, label: 'Messages', icon: 'mail' },
  { key: 'notifications', to: ROUTES.SEEKER_NOTIFICATIONS, label: 'Notifications', icon: 'notifications' },
  { key: 'settings', to: ROUTES.SEEKER_SETTINGS, label: 'Settings', icon: 'settings' },
  { key: 'public-site', to: ROUTES.HOME, label: 'View Public Site', icon: 'public' },
];

const navClass = (isActive) =>
  [
    'flex items-center gap-stack-md rounded-lg px-stack-md py-stack-sm transition-colors font-body-md text-body-md',
    isActive
      ? 'bg-secondary text-on-secondary shadow-md translate-x-1'
      : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-primary',
  ].join(' ');

const isSeekerNavActive = (item, routePath) => {
  if (item.key === 'public-site') return false;
  if (item.key === 'dashboard') return routePath === item.to;
  if (item.key === 'profile') {
    return routePath.startsWith(ROUTES.SEEKER_PROFILE) || routePath.startsWith(ROUTES.SEEKER_APPLICATIONS) || routePath.startsWith(ROUTES.SEEKER_SAVED_JOBS) || routePath.startsWith(ROUTES.SEEKER_SKILLS);
  }
  if (item.key === 'interviews') return routePath === ROUTES.SEEKER_INTERVIEWS;
  if (item.key === 'jobs') return routePath.startsWith(ROUTES.SEEKER_JOBS) || routePath.startsWith(ROUTES.SEEKER_RECOMMENDED_JOBS);
  return routePath === item.to || routePath.startsWith(`${item.to}/`);
};

const getInitials = (name = '') => {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'JS';
};

const TOASTED_NOTIFICATIONS_KEY = 'seeker_notification_toasts_seen';
const SENT_INTERVIEW_REMINDERS_KEY = 'seeker_interview_reminders_sent';
const DISMISSED_NOTIFICATIONS_KEY = 'seeker_dismissed_notifications';
const MESSAGE_NOTIFICATION_TYPES = new Set(['message', 'message_received']);
const TOASTABLE_NOTIFICATION_TYPES = new Set(['message', 'message_received', 'interview_scheduled', 'interview_reminder']);

const readStoredArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeStoredArray = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const notificationType = (notification) => notification.type || notification.data?.type;

const notificationConversationKey = (notification) => {
  const senderId = notification.sender_id || notification.data?.sender_id;
  const jobId = notification.job_id || notification.data?.job_id;
  return `${senderId || ''}-${jobId || ''}`;
};

const isMutedMessageNotification = (notification) => {
  if (!MESSAGE_NOTIFICATION_TYPES.has(notificationType(notification))) return false;
  const muteAllMessages = localStorage.getItem('seeker_muted_messages_all') === 'true';
  const mutedConversations = readStoredArray('seeker_muted_message_conversations');

  return muteAllMessages || mutedConversations.includes(notificationConversationKey(notification));
};

const isRecentNotification = (notification) => {
  const createdAt = new Date(notification.created_at || Date.now()).getTime();
  return Date.now() - createdAt < 120000;
};

function SidebarContent({ currentPath, onNavigate, onLogout }) {
  return (
    <>
      <Link to={ROUTES.SEEKER_DASHBOARD} className="mb-stack-lg flex items-center gap-stack-sm px-stack-sm shrink-0 hover:opacity-80 transition-opacity" onClick={onNavigate}>
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          <img src={icon} alt="Smart Job Portal" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-h3 text-h3 font-bold text-primary">Smart Job Portal</h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">Candidate Workspace</p>
        </div>
      </Link>

      <nav className="flex-1 min-h-0 flex flex-col gap-unit overflow-y-auto pr-unit">
        {navItems.map((item) => {
          const isActive = isSeekerNavActive(item, currentPath);
          return (
            <NavLink className={() => navClass(isActive)} key={item.to} to={item.to} onClick={onNavigate}>
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto pt-stack-md border-t border-outline-variant flex flex-col gap-unit shrink-0 bg-surface-container-low">
        <NavLink className="flex items-center gap-stack-md text-on-surface-variant hover:bg-surface-container-highest rounded-lg px-stack-md py-stack-sm transition-colors" to={ROUTES.CONTACT} onClick={onNavigate}>
          <span className="material-symbols-outlined">help</span>
          <span>Help</span>
        </NavLink>
        <button className="flex items-center gap-stack-md text-on-surface-variant hover:bg-surface-container-highest rounded-lg px-stack-md py-stack-sm transition-colors text-left" onClick={onLogout}>
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}

export default function JobSeekerLayout({ children }) {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const firstNotificationFetchRef = useRef(true);
  const reminderTimersRef = useRef({});
  const currentPath = location.pathname;

  useEffect(() => {
    let isMounted = true;

    const scheduleInterviewReminders = (notifications) => {
      const sentReminders = new Set(readStoredArray(SENT_INTERVIEW_REMINDERS_KEY));

      notifications.forEach((notification) => {
        if (notificationType(notification) !== 'interview_scheduled') return;
        const interviewAt = notification.data?.interview_at;
        if (!interviewAt || sentReminders.has(String(notification.id))) return;

        const delay = new Date(interviewAt).getTime() - Date.now();
        const sendReminder = () => {
          const latestSent = new Set(readStoredArray(SENT_INTERVIEW_REMINDERS_KEY));
          if (latestSent.has(String(notification.id))) return;

          addLocalNotification({
            type: 'interview_reminder',
            title: 'Interview starting now',
            message: `Your interview${notification.data?.company_name ? ` with ${notification.data.company_name}` : ''}${notification.data?.job_title ? ` for ${notification.data.job_title}` : ''} is starting now.`,
            data: {
              ...(notification.data || {}),
              source_notification_id: notification.id,
              type: 'interview_reminder',
            },
          });
          latestSent.add(String(notification.id));
          writeStoredArray(SENT_INTERVIEW_REMINDERS_KEY, [...latestSent]);
        };

        if (delay <= 0) {
          sendReminder();
          return;
        }

        if (!reminderTimersRef.current[notification.id]) {
          reminderTimersRef.current[notification.id] = window.setTimeout(sendReminder, delay);
        }
      });
    };

    const toastNewNotifications = (notifications) => {
      const seen = new Set(readStoredArray(TOASTED_NOTIFICATIONS_KEY));
      const nextSeen = new Set(seen);

      notifications.forEach((notification) => {
        const type = notificationType(notification);
        if (!TOASTABLE_NOTIFICATION_TYPES.has(type) || notification.read_at || notification.read || seen.has(String(notification.id))) return;
        nextSeen.add(String(notification.id));
        if (isMutedMessageNotification(notification)) return;
        if (!firstNotificationFetchRef.current || isRecentNotification(notification)) {
          addToast({
            title: notification.title || notification.data?.title || (MESSAGE_NOTIFICATION_TYPES.has(type) ? 'New message' : 'Interview update'),
            message: notification.message || notification.data?.message || (MESSAGE_NOTIFICATION_TYPES.has(type) ? 'You have a new message.' : 'You have a new interview update.'),
            type: type === 'interview_scheduled' ? 'success' : 'info',
            duration: MESSAGE_NOTIFICATION_TYPES.has(type) ? 7000 : 9000,
          });
        }
      });

      writeStoredArray(TOASTED_NOTIFICATIONS_KEY, [...nextSeen]);
      firstNotificationFetchRef.current = false;
    };

    const fetchNotifications = () => {
      getNotifications()
        .then((notifications) => {
          if (!isMounted) return;
          const dismissed = readStoredArray(DISMISSED_NOTIFICATIONS_KEY);
          setRecentNotifications(notifications.filter((notification) => {
            if (dismissed.includes(notification.id)) return false;
            if (isMutedMessageNotification(notification)) return false;
            return true;
          }).slice(0, 5));
          scheduleInterviewReminders(notifications);
          toastNewNotifications(notifications);
        })
        .catch(console.error);
    };

    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 5000);
    window.addEventListener('notifications_updated', fetchNotifications);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      Object.values(reminderTimersRef.current).forEach((timer) => window.clearTimeout(timer));
      reminderTimersRef.current = {};
      window.removeEventListener('notifications_updated', fetchNotifications);
    };
  }, [addToast]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotifOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout?.();
    navigate(ROUTES.LOGIN);
  };

  const dismissNotification = (index, event) => {
    event.stopPropagation();
    event.preventDefault();
    setRecentNotifications((prev) => {
      const notification = prev[index];
      if (notification) {
        const dismissed = readStoredArray(DISMISSED_NOTIFICATIONS_KEY);
        writeStoredArray(DISMISSED_NOTIFICATIONS_KEY, [...dismissed, notification.id]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleNotificationClick = async (notification, event) => {
    event.preventDefault();
    if (!notification.read_at && !notification.read) {
      markNotificationRead(notification.id).catch(console.error);
      setRecentNotifications((prev) =>
        prev.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item)
      );
    }

    setIsNotifOpen(false);

    const type = notification.type || notification.data?.type;
    const applicationId = notification.application_id || notification.data?.application_id;
    const senderId = notification.sender_id || notification.data?.sender_id;
    const jobId = notification.job_id || notification.data?.job_id;

    if (type === 'interview_scheduled' || type === 'interview_reminder') {
      navigate(ROUTES.SEEKER_INTERVIEWS);
    } else if ((type === 'message' || type === 'message_received') && (senderId || jobId)) {
      navigate(`${ROUTES.SEEKER_MESSAGES}?user=${senderId || ''}&job=${jobId || ''}`);
    } else if ((type === 'application_update' || type === 'application_status_updated') && applicationId) {
      navigate(`/seeker/applications/${applicationId}`);
    } else {
      navigate(ROUTES.SEEKER_NOTIFICATIONS);
    }
  };

  const displayName = user?.profile?.name || user?.name || 'Job Seeker';
  const displayEmail = user?.email || '';
  const initials = getInitials(displayName);
  const profileImage = user?.profile_image || user?.avatar || null;
  const unreadCount = recentNotifications.filter((notification) => !notification.read_at && !notification.read).length;

  return (
    <div className="stitch-page bg-background text-on-background font-body-md text-body-md flex h-screen overflow-hidden">
      {isSidebarOpen && (
        <aside className="hidden md:flex flex-col h-screen p-stack-md border-r border-outline-variant bg-surface-container-low w-sidebar-width shrink-0 overflow-hidden">
          <SidebarContent currentPath={currentPath} onLogout={handleLogout} />
        </aside>
      )}

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="flex h-full w-[min(280px,85vw)] flex-col p-stack-md border-r border-outline-variant bg-surface-container-low overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <SidebarContent currentPath={currentPath} onNavigate={() => setIsMobileMenuOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-background">
        <header className="min-h-16 h-16 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between px-gutter lg:px-margin-desktop shrink-0 z-50 shadow-ambient">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="hidden md:flex w-10 h-10 rounded-lg items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              title="Toggle sidebar"
              type="button"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              title="Open menu"
              type="button"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <Link to={ROUTES.SEEKER_DASHBOARD} className="md:hidden flex items-center gap-stack-sm hover:opacity-80 transition-opacity">
              <img src={icon} alt="Smart Job Portal" className="w-8 h-8 object-contain" />
              <span className="hidden sm:inline font-h3 text-h3 font-bold text-primary">Smart Job Portal</span>
            </Link>
          </div>

          <div className="flex items-center gap-stack-md">
            <ThemeToggle compact />

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors relative"
                type="button"
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
                  <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                    <h3 className="font-h3 text-primary">Notifications</h3>
                    <Link to={ROUTES.SEEKER_NOTIFICATIONS} className="text-xs text-secondary hover:underline" onClick={() => setIsNotifOpen(false)}>View all</Link>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {recentNotifications.length > 0 ? recentNotifications.map((notification, index) => (
                      <div
                        key={notification.id || index}
                        className="px-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors text-left text-sm relative group cursor-pointer"
                        onClick={(event) => handleNotificationClick(notification, event)}
                      >
                        <button onClick={(event) => dismissNotification(index, event)} className="absolute right-2 top-2 w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container opacity-0 group-hover:opacity-100 transition-all shadow-sm" type="button">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                        <p className="font-semibold text-primary pr-6">{notification.title || notification.data?.title || 'Notification'}</p>
                        <p className="text-on-surface-variant text-xs mt-1 pr-6">{notification.message || notification.data?.message}</p>
                        <p className="text-outline text-xs mt-1">{new Date(notification.created_at || Date.now()).toLocaleString()}</p>
                      </div>
                    )) : (
                      <p className="p-4 text-center text-on-surface-variant text-sm">No new notifications.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-8 w-px bg-outline-variant" />

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-stack-sm hover:opacity-80 transition-opacity"
                type="button"
              >
                {profileImage ? (
                  <img
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover border border-outline-variant"
                    src={profileImage}
                  />
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
                    to={ROUTES.SEEKER_PROFILE}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-surface-container-low transition-colors text-on-surface font-body-md"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <span className="material-symbols-outlined text-[20px]">person</span>
                    Profile
                  </Link>
                  <Link
                    to={ROUTES.SEEKER_SETTINGS}
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
                      type="button"
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

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <PageTransition>
            {children || <Outlet />}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
