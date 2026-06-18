import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import Stagger from '../motion/Stagger';
import { ROUTES, getRoleRedirect } from '../utils/constants';
import { useAuth } from '../context/useAuth';
import { adminDataService } from '../services/adminDataService';
import { EASE_IN_OUT, shouldAnimate } from '../motion/variants';
import icon from '../assets/icon.png';

const navItems = [
  { labelKey: 'nav.findJobs', to: ROUTES.JOBS, matches: ['/jobs'] },
  { labelKey: 'nav.companies', to: ROUTES.COMPANIES, matches: ['/companies'] },
  { labelKey: 'nav.salaryGuide', to: ROUTES.SALARIES, matches: ['/salaries', '/salary-guide'] },
];

const isActive = (pathname, item) =>
  item.matches.some((path) => pathname === path || pathname.startsWith(`${path}/`));

function NavLinkItem({ item, pathname, onClick, t }) {
  const active = isActive(pathname, item);
  const reduce = useReducedMotion();

  return (
    <Link
      className={[
        'group relative rounded-lg px-3 py-2 font-h3 text-h3 font-semibold transition-colors',
        active
          ? 'bg-surface-container-low text-secondary dark:text-secondary-fixed ring-1 ring-outline-variant'
          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-secondary dark:hover:text-secondary-fixed',
      ].join(' ')}
      key={item.to}
      to={item.to}
      onClick={onClick}
    >
      {t(item.labelKey)}
      {!active && shouldAnimate() && !reduce && (
        <span className="absolute bottom-1 left-3 right-3 h-0.5 bg-secondary origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out rounded-full" />
      )}
    </Link>
  );
}

export default function PublicNavBar({ showAuthActions = true }) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const reduce = useReducedMotion();

  const isAdmin = user?.role === 'admin';
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAdmin) {
      let isMounted = true;
      adminDataService.getActivityLog().then((res) => {
        if (isMounted) {
          const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
          setRecentActivities(res.filter((act) => !dismissed.includes(act.id)).slice(0, 5));
        }
      }).catch(() => {});
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const dismissNotification = (index, e) => {
    e.stopPropagation();
    e.preventDefault();
    setRecentActivities((prev) => {
      const act = prev[index];
      if (act) {
        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        localStorage.setItem('dismissed_notifications', JSON.stringify([...dismissed, act.id]));
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const unreadCount = recentActivities.length;

  const headerMotion = shouldAnimate() && !reduce
    ? {
        animate: {
          paddingTop: scrolled ? 10 : 12,
          paddingBottom: scrolled ? 10 : 12,
        },
        transition: { duration: 0.3, ease: EASE_IN_OUT },
      }
    : {};

  return (
    <motion.header
      className={[
        'sticky top-0 z-50 w-full border-b transition-all duration-300',
        scrolled
          ? 'bg-surface-container-lowest/90 border-outline-variant shadow-md backdrop-blur-xl'
          : 'bg-surface-container-lowest/70 border-outline-variant/60 backdrop-blur-md',
      ].join(' ')}
      {...headerMotion}
    >
      <div className="mx-auto flex min-h-[3.25rem] w-full max-w-container-max-width flex-wrap items-center justify-between gap-3 px-4 sm:px-gutter lg:px-margin-desktop relative">
        <Link className="flex items-center gap-2 font-h2 text-h2 font-bold text-primary transition-opacity hover:opacity-85" to={ROUTES.HOME}>
          <img src={icon} alt={t('app.productName')} className="h-8 w-auto object-contain" />
          <span className="hidden sm:inline">{t('app.productName')}</span>
        </Link>

        <nav className="hidden md:flex gap-2 items-center" aria-label={t('a11y.primaryNav')}>
          {navItems.map((item) => (
            <NavLinkItem key={item.to} item={item} pathname={pathname} t={t} />
          ))}
        </nav>

        <div className="flex items-center gap-stack-sm">
          <LanguageSwitcher compact />
          <ThemeToggle compact />

          {isAdmin && (
            <div className="relative hidden md:block" ref={notifRef}>
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

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: EASE_IN_OUT }}
                    className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md overflow-hidden z-50"
                  >
                    <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
                      <h3 className="font-h3 text-primary">{t('sidebar.notifications')}</h3>
                      <Link to={ROUTES.ADMIN_ACTIVITY_LOG} className="text-xs text-secondary hover:underline" onClick={() => setIsNotifOpen(false)}>{t('buttons.viewAll')}</Link>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {recentActivities.length > 0 ? recentActivities.map((act, i) => (
                        <div key={i} className="px-4 py-3 border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors text-left text-sm relative group">
                          <button onClick={(e) => dismissNotification(i, e)} className="absolute right-2 top-2 w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container opacity-0 group-hover:opacity-100 transition-all shadow-sm" type="button">
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                          <p className="font-semibold text-primary pr-6">{act.action}</p>
                          <p className="text-on-surface-variant text-xs mt-1 truncate pr-6">{act.targetType} - {act.targetName}</p>
                          <p className="text-outline text-xs mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                        </div>
                      )) : (
                        <p className="p-4 text-center text-on-surface-variant text-sm">{t('emptyStatesShort.notifications')}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <button
            className="md:hidden w-9 h-9 flex items-center justify-center text-on-surface hover:bg-surface-container-low rounded-full transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>

          {showAuthActions && (
            <div className="hidden md:flex items-center gap-stack-sm">
              {isAuthenticated ? (
                <>
                  <Link className="items-center justify-center rounded-lg border border-outline-variant px-4 py-2 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low" to={getRoleRedirect(user?.role)}>
                    {t('buttons.dashboard')}
                  </Link>
                  <button onClick={() => logout()} className="items-center justify-center rounded-lg border border-error/30 text-error px-4 py-2 font-body-md text-body-md font-semibold transition-colors hover:bg-error-container" type="button">
                    {t('buttons.logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link className="items-center justify-center rounded-lg border border-outline-variant px-4 py-2 font-body-md text-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low" to={ROUTES.LOGIN}>
                    {t('buttons.signIn')}
                  </Link>
                  <Link className="inline-flex items-center justify-center rounded-lg bg-secondary text-on-secondary px-4 py-2 font-body-md text-body-md font-bold shadow-sm transition-colors hover:bg-secondary-container btn-shine" to={ROUTES.POST_JOB}>
                    {t('buttons.postJob')}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE_IN_OUT }}
            className="md:hidden overflow-hidden border-t border-outline-variant bg-surface-container-lowest shadow-md"
          >
            <Stagger className="flex flex-col p-4 gap-2" delayChildren={0.04} staggerChildren={0.05}>
              {navItems.map((item) => {
                const active = isActive(pathname, item);
                return (
                  <Stagger.Item key={item.to}>
                    <Link
                      className={[
                        'block rounded-lg px-4 py-3 font-h3 text-h3 font-semibold transition-colors',
                        active
                          ? 'bg-surface-container-low text-secondary dark:text-secondary-fixed ring-1 ring-outline-variant'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-secondary dark:hover:text-secondary-fixed',
                      ].join(' ')}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t(item.labelKey)}
                    </Link>
                  </Stagger.Item>
                );
              })}
              {showAuthActions && (
                <Stagger.Item>
                  <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-outline-variant">
                    {isAuthenticated ? (
                      <>
                        <Link className="w-full text-center rounded-lg border border-outline-variant px-4 py-3 font-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low" to={getRoleRedirect(user?.role)} onClick={() => setMobileMenuOpen(false)}>
                          {t('buttons.dashboard')}
                        </Link>
                        <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full text-center rounded-lg border border-error/30 text-error px-4 py-3 font-body-md font-semibold transition-colors hover:bg-error-container" type="button">
                          {t('buttons.logout')}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link className="w-full text-center rounded-lg border border-outline-variant px-4 py-3 font-body-md font-semibold text-on-surface transition-colors hover:bg-surface-container-low" to={ROUTES.LOGIN} onClick={() => setMobileMenuOpen(false)}>
                          {t('buttons.signIn')}
                        </Link>
                        <Link className="w-full text-center inline-flex items-center justify-center rounded-lg bg-secondary text-on-secondary px-4 py-3 font-body-md font-bold shadow-sm transition-colors hover:bg-secondary-container btn-shine" to={ROUTES.POST_JOB} onClick={() => setMobileMenuOpen(false)}>
                          {t('buttons.postJob')}
                        </Link>
                      </>
                    )}
                  </div>
                </Stagger.Item>
              )}
            </Stagger>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
