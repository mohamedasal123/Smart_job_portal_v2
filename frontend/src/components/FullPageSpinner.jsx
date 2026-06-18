import { motion } from 'framer-motion';
import { shouldAnimate } from '../motion/variants';

/**
 * FullPageSpinner — full-screen loading overlay.
 *
 * Props:
 *  - message: optional text displayed under the animated icon (default: "Loading...")
 */
export function FullPageSpinner({ message = 'Loading...' }) {
  const animProps = shouldAnimate()
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {};

  return (
    <motion.div
      {...animProps}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-sm bg-white/70 dark:bg-gray-900/70"
    >
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-xl border border-slate-100 dark:border-slate-800/50 backdrop-blur-md">
        {/* Animated briefcase logo & outer dotted spinner */}
        <motion.div
          animate={shouldAnimate() ? { scale: [1, 1.08, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="relative flex items-center justify-center h-16 w-16"
        >
          <span className="material-symbols-outlined text-4xl text-secondary dark:text-blue-500">
            work
          </span>
          <div className="absolute inset-0 border-2 border-dashed border-secondary/40 dark:border-blue-500/40 rounded-full animate-[spin_8s_linear_infinite]" />
        </motion.div>

        {message && (
          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse">
            {message}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default FullPageSpinner;
