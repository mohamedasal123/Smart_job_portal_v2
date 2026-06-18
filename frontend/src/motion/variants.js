// Shared framer-motion variants. Importing from here keeps timing/easing
// consistent across pages and lets us tune the whole site in one file.
//
// Easing rationale: cubic-bezier(0.16, 1, 0.3, 1) is the "ease-out-expo"
// curve — fast in, gentle out. Reads as smooth and assertive, not bouncy.

export const EASE = [0.16, 1, 0.3, 1];
export const EASE_IN_OUT = [0.4, 0, 0.2, 1];
export const SPRING_SOFT = { type: 'spring', stiffness: 260, damping: 26 };
export const SPRING_PRESS = { type: 'spring', stiffness: 400, damping: 22 };

export const shouldAnimate = () => {
  if (typeof window === 'undefined') return true;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// --- Fades ---
export const fadeUp = {
  hidden: { opacity: 0, y: shouldAnimate() ? 16 : 0 },
  visible: { opacity: 1, y: 0, transition: { duration: shouldAnimate() ? 0.4 : 0.01, ease: EASE } },
};

export const fadeDown = {
  hidden: { opacity: 0, y: shouldAnimate() ? -16 : 0 },
  visible: { opacity: 1, y: 0, transition: { duration: shouldAnimate() ? 0.4 : 0.01, ease: EASE } },
};

export const fadeLeft = {
  hidden: { opacity: 0, x: shouldAnimate() ? 16 : 0 },
  visible: { opacity: 1, x: 0, transition: { duration: shouldAnimate() ? 0.4 : 0.01, ease: EASE } },
};

export const fadeRight = {
  hidden: { opacity: 0, x: shouldAnimate() ? -16 : 0 },
  visible: { opacity: 1, x: 0, transition: { duration: shouldAnimate() ? 0.4 : 0.01, ease: EASE } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: shouldAnimate() ? 0.3 : 0.01, ease: EASE } },
};

// --- Scales ---
export const scaleIn = {
  hidden: { opacity: 0, scale: shouldAnimate() ? 0.95 : 1 },
  visible: { opacity: 1, scale: 1, transition: { duration: shouldAnimate() ? 0.3 : 0.01, ease: EASE } },
  exit: { opacity: 0, scale: shouldAnimate() ? 0.95 : 1, transition: { duration: shouldAnimate() ? 0.2 : 0.01, ease: EASE } },
};

export const scaleOut = {
  hidden: { opacity: 0, scale: shouldAnimate() ? 1.05 : 1 },
  visible: { opacity: 1, scale: 1, transition: { duration: shouldAnimate() ? 0.3 : 0.01, ease: EASE } },
  exit: { opacity: 0, scale: shouldAnimate() ? 1.05 : 1, transition: { duration: shouldAnimate() ? 0.2 : 0.01, ease: EASE } },
};

// --- Slides ---
export const slideInLeft = {
  hidden: { opacity: 0, x: shouldAnimate() ? '-100%' : 0 },
  visible: { opacity: 1, x: 0, transition: { duration: shouldAnimate() ? 0.5 : 0.01, ease: EASE } },
  exit: { opacity: 0, x: shouldAnimate() ? '-100%' : 0, transition: { duration: shouldAnimate() ? 0.4 : 0.01, ease: EASE } },
};

export const slideInRight = {
  hidden: { opacity: 0, x: shouldAnimate() ? '100%' : 0 },
  visible: { opacity: 1, x: 0, transition: { duration: shouldAnimate() ? 0.5 : 0.01, ease: EASE } },
  exit: { opacity: 0, x: shouldAnimate() ? '100%' : 0, transition: { duration: shouldAnimate() ? 0.4 : 0.01, ease: EASE } },
};

export const slideUp = {
  hidden: { opacity: 0, y: shouldAnimate() ? 24 : 0 },
  visible: { opacity: 1, y: 0, transition: { duration: shouldAnimate() ? 0.5 : 0.01, ease: EASE } },
  exit: { opacity: 0, y: shouldAnimate() ? -8 : 0, transition: { duration: shouldAnimate() ? 0.2 : 0.01, ease: EASE } },
};

export const slideRight = {
  hidden: { opacity: 0, x: shouldAnimate() ? 24 : 0 },
  visible: { opacity: 1, x: 0, transition: { duration: shouldAnimate() ? 0.35 : 0.01, ease: EASE } },
  exit: { opacity: 0, x: shouldAnimate() ? 24 : 0, transition: { duration: shouldAnimate() ? 0.2 : 0.01, ease: EASE } },
};

// --- Containers / Stagger ---
export const stagger = (delayChildren = 0.05, stagger = 0.06) => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: shouldAnimate() ? delayChildren : 0,
      staggerChildren: shouldAnimate() ? stagger : 0,
    },
  },
});

export const staggerContainer = (delayChildren = 0.1, staggerChildren = 0.08) => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: shouldAnimate() ? delayChildren : 0,
      staggerChildren: shouldAnimate() ? staggerChildren : 0,
    },
  },
});

// --- Page Transitions ---
export const pageEnter = {
  hidden: { opacity: 0, y: shouldAnimate() ? 16 : 0 },
  visible: { opacity: 1, y: 0, transition: { duration: shouldAnimate() ? 0.35 : 0.01, ease: EASE_IN_OUT } },
};

export const pageExit = {
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: shouldAnimate() ? -12 : 0, transition: { duration: shouldAnimate() ? 0.28 : 0.01, ease: EASE_IN_OUT } },
};

export const pageTransition = {
  initial: { opacity: 0, y: shouldAnimate() ? 12 : 0 },
  animate: { opacity: 1, y: 0, transition: { duration: shouldAnimate() ? 0.35 : 0.01, ease: EASE_IN_OUT } },
  exit: { opacity: 0, y: shouldAnimate() ? -8 : 0, transition: { duration: shouldAnimate() ? 0.25 : 0.01, ease: EASE_IN_OUT } },
};

// --- Hover / Tap Affordances ---
export const cardHover = {
  rest: { y: 0, boxShadow: '0px 4px 20px rgba(15, 23, 42, 0.05)' },
  hover: {
    y: shouldAnimate() ? -4 : 0,
    boxShadow: '0px 14px 40px rgba(15, 23, 42, 0.12)',
    transition: SPRING_SOFT,
  },
};

export const buttonPress = {
  whileTap: { scale: shouldAnimate() ? 0.97 : 1, transition: SPRING_PRESS },
};

// --- Modals ---
export const modalEnter = {
  hidden: { opacity: 0, scale: shouldAnimate() ? 0.95 : 1, y: shouldAnimate() ? 20 : 0 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: shouldAnimate() ? 0.4 : 0.01, ease: EASE } },
};

export const modalExit = {
  exit: { opacity: 0, scale: shouldAnimate() ? 0.95 : 1, y: shouldAnimate() ? 20 : 0, transition: { duration: shouldAnimate() ? 0.3 : 0.01, ease: EASE } },
};

// --- Toasts ---
export const toastEnter = {
  hidden: { opacity: 0, y: shouldAnimate() ? -20 : 0, scale: shouldAnimate() ? 0.9 : 1 },
  visible: { opacity: 1, y: 0, scale: 1, transition: shouldAnimate() ? { type: 'spring', stiffness: 300, damping: 25 } : { duration: 0.01 } },
};

export const toastExit = {
  exit: { opacity: 0, scale: shouldAnimate() ? 0.9 : 1, transition: { duration: shouldAnimate() ? 0.2 : 0.01 } },
};

// --- Images ---
export const imageReveal = {
  hidden: { opacity: 0, scale: shouldAnimate() ? 0.96 : 1 },
  visible: { opacity: 1, scale: 1, transition: { duration: shouldAnimate() ? 0.45 : 0.01, ease: EASE } },
};

// --- Buttons / CTAs ---
export const buttonPop = {
  hidden: { opacity: 0, scale: shouldAnimate() ? 0.92 : 1 },
  visible: { opacity: 1, scale: 1, transition: { duration: shouldAnimate() ? 0.35 : 0.01, ease: EASE } },
};

export const buttonHover = {
  rest: { scale: 1 },
  hover: { scale: shouldAnimate() ? 1.03 : 1, transition: SPRING_SOFT },
  tap: { scale: shouldAnimate() ? 0.97 : 1, transition: SPRING_PRESS },
};

// --- Float / Hero ---
export const float = {
  animate: {
    y: shouldAnimate() ? [0, -12, 0] : 0,
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
};

// --- Shake (validation errors) ---
export const shake = {
  shake: {
    x: shouldAnimate() ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
    transition: { duration: shouldAnimate() ? 0.45 : 0.01 },
  },
};

// --- Dropdowns ---
export const dropdownEnter = {
  hidden: { opacity: 0, y: shouldAnimate() ? -8 : 0, scale: shouldAnimate() ? 0.98 : 1 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: shouldAnimate() ? 0.22 : 0.01, ease: EASE_IN_OUT },
  },
  exit: {
    opacity: 0,
    y: shouldAnimate() ? -6 : 0,
    scale: shouldAnimate() ? 0.98 : 1,
    transition: { duration: shouldAnimate() ? 0.15 : 0.01, ease: EASE_IN_OUT },
  },
};

export const dropdownItem = {
  hidden: { opacity: 0, x: shouldAnimate() ? -8 : 0 },
  visible: { opacity: 1, x: 0, transition: { duration: shouldAnimate() ? 0.2 : 0.01, ease: EASE } },
};

// --- Table rows ---
export const tableRow = {
  hidden: { opacity: 0, y: shouldAnimate() ? 8 : 0 },
  visible: { opacity: 1, y: 0, transition: { duration: shouldAnimate() ? 0.3 : 0.01, ease: EASE } },
};

// --- Nav link underline ---
export const navLinkUnderline = {
  rest: { scaleX: 0 },
  hover: { scaleX: 1, transition: { duration: shouldAnimate() ? 0.25 : 0.01, ease: EASE_IN_OUT } },
};

// --- Empty states ---
export const emptyStateEnter = {
  hidden: { opacity: 0, y: shouldAnimate() ? 16 : 0 },
  visible: { opacity: 1, y: 0, transition: { duration: shouldAnimate() ? 0.5 : 0.01, ease: EASE } },
};

// --- Progress bars ---
export const progressBar = (widthPercent = '100%') => ({
  hidden: { width: 0 },
  visible: {
    width: widthPercent,
    transition: { duration: shouldAnimate() ? 0.8 : 0.01, ease: EASE_IN_OUT },
  },
});
