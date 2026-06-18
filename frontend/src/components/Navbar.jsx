import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { NAV_ITEMS, PRODUCT_NAME, ROUTES } from '../utils/constants';
import Stagger from '../motion/Stagger';
import { EASE_IN_OUT, shouldAnimate } from '../motion/variants';

export function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const headerClass = [
    'navbar',
    scrolled ? 'navbar-scrolled' : '',
  ].filter(Boolean).join(' ');

  return (
    <motion.nav
      aria-label="Primary"
      className={headerClass}
      animate={
        shouldAnimate() && !reduce
          ? { paddingTop: scrolled ? '0.65rem' : '1rem', paddingBottom: scrolled ? '0.65rem' : '1rem' }
          : undefined
      }
      transition={{ duration: 0.3, ease: EASE_IN_OUT }}
      initial={false}
    >
      <Link className="logo" to={ROUTES.HOME} aria-label={PRODUCT_NAME}>
        {PRODUCT_NAME}
      </Link>

      <div className="nav-links hidden md:flex">
        {NAV_ITEMS.map((item) => (
          <NavLink
            to={item.to}
            className={({ isActive }) => `nav-link group relative${isActive ? ' active' : ''}`}
            key={item.to}
          >
            {t(item.labelKey)}
            <span className="nav-link-underline" aria-hidden="true" />
          </NavLink>
        ))}
      </div>

      <div className="nav-actions">
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">{mobileOpen ? 'close' : 'menu'}</span>
        </button>
        <Link className="btn btn-secondary hidden md:inline-flex" to={ROUTES.LOGIN}>
          {t('buttons.login')}
        </Link>
        <Link className="btn btn-primary btn-shine hidden md:inline-flex" to={ROUTES.POST_JOB}>
          {t('buttons.postJob')}
        </Link>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: EASE_IN_OUT }}
            className="md:hidden absolute top-full left-0 w-full border-t border-outline-variant bg-surface-container-lowest shadow-md overflow-hidden"
          >
            <Stagger className="flex flex-col p-4 gap-2" delayChildren={0.04} staggerChildren={0.05}>
              {NAV_ITEMS.map((item) => (
                <Stagger.Item key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `block rounded-lg px-4 py-3 font-semibold transition-colors ${isActive ? 'text-secondary bg-surface-container-low' : 'text-on-surface-variant hover:bg-surface-container-low'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    {t(item.labelKey)}
                  </NavLink>
                </Stagger.Item>
              ))}
            </Stagger>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
