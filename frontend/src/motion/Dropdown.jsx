import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { dropdownEnter, dropdownItem, shouldAnimate, stagger } from './variants';

/**
 * AnimatedDropdown — fade + slide panel with staggered items.
 */
export default function AnimatedDropdown({
  open,
  children,
  className = '',
  align = 'right',
  ...rest
}) {
  const reduce = useReducedMotion();

  const alignClass =
    align === 'left' ? 'left-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-0';

  if (reduce || !shouldAnimate()) {
    return open ? (
      <div className={`absolute ${alignClass} mt-2 z-50 ${className}`} {...rest}>
        {children}
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`absolute ${alignClass} mt-2 z-50 origin-top ${className}`}
          variants={dropdownEnter}
          initial="hidden"
          animate="visible"
          exit="exit"
          {...rest}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

AnimatedDropdown.List = function AnimatedDropdownList({
  children,
  className = '',
  staggerChildren = 0.04,
  ...rest
}) {
  const reduce = useReducedMotion();

  if (reduce || !shouldAnimate()) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={stagger(0, staggerChildren)}
      initial="hidden"
      animate="visible"
      {...rest}
    >
      {children}
    </motion.div>
  );
};

AnimatedDropdown.Item = function AnimatedDropdownItem({ children, className = '', ...rest }) {
  const reduce = useReducedMotion();

  if (reduce || !shouldAnimate()) {
    return (
      <div className={className} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <motion.div className={className} variants={dropdownItem} {...rest}>
      {children}
    </motion.div>
  );
};
