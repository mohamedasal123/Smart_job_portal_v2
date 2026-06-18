import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageEnter, pageExit, shouldAnimate } from './variants';

/**
 * PageTransition — wrap the routed `<Outlet />` (or any leaf page tree) and
 * we fade+lift between routes. Keyed on pathname so AnimatePresence sees a
 * different child whenever the route changes.
 *
 * Falls back to a plain wrapper when the user prefers reduced motion.
 */
export default function PageTransition({ children, className }) {
  const reduce = useReducedMotion();
  const location = useLocation();

  if (reduce || !shouldAnimate()) {
    return <div className={className}>{children}</div>;
  }

  const combinedVariants = {
    hidden: pageEnter.hidden,
    visible: pageEnter.visible,
    exit: pageExit.exit,
  };

  return (
    <>
      {/* CSS-only Top Progress Bar mimicking nprogress during page navigation */}
      <motion.div
        key={`pb-${location.pathname}`}
        className="fixed top-0 left-0 right-0 h-[3px] bg-primary z-[9999] origin-left pointer-events-none"
        style={{ backgroundColor: 'var(--color-primary)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: [0, 0.3, 0.7, 1] }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={combinedVariants}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  );
}
