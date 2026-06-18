import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { SPRING_SOFT } from '../motion/variants';

/**
 * BackToTop — animated back-to-top button that appears after scrolling.
 * Smooth scroll, reduced-motion safe.
 */
export default function BackToTop({ threshold = 400 }) {
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.85 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.85 }}
          transition={reduce ? { duration: 0.01 } : SPRING_SOFT}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-secondary text-on-secondary shadow-md hover:shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 btn-cta-shine"
          aria-label="Back to top"
          type="button"
          whileHover={reduce ? undefined : { y: -2 }}
          whileTap={reduce ? undefined : { scale: 0.92 }}
        >
          <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
