import { motion } from 'framer-motion';
import { shouldAnimate } from '../motion/variants';

/**
 * LoadingSpinner — a flexible, animated loading indicator.
 *
 * Props:
 *  - size: "sm" | "md" | "lg" | "xl" or number (default: "md")
 *  - variant: "spinner" | "dots" | "bars" | "ring" (default: "spinner")
 *  - className: customization classes, e.g., to override colors
 */
export default function LoadingSpinner({
  size = 'md',
  variant = 'spinner',
  className = '',
}) {
  // Map size keys to pixel numbers
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 40,
    xl: 56,
  };

  const sizePx = typeof size === 'number' ? size : sizeMap[size] || sizeMap.md;

  // Derive colors
  const colorClass = className.includes('text-') ? '' : 'text-primary';

  // Fallback if reduced motion is enabled (we make animations static or very slow)
  const animMultiplier = shouldAnimate() ? 1 : 0;

  if (variant === 'dots') {
    const dotSize = Math.max(4, Math.floor(sizePx * 0.25));
    const dotTransition = {
      duration: 0.6,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    };

    return (
      <div className={`flex gap-1 items-center justify-center ${colorClass} ${className}`}>
        <motion.div
          className="rounded-full bg-current"
          style={{ width: dotSize, height: dotSize }}
          animate={animMultiplier ? { y: [0, -dotSize, 0] } : {}}
          transition={{ ...dotTransition, delay: 0 }}
        />
        <motion.div
          className="rounded-full bg-current"
          style={{ width: dotSize, height: dotSize }}
          animate={animMultiplier ? { y: [0, -dotSize, 0] } : {}}
          transition={{ ...dotTransition, delay: 0.15 }}
        />
        <motion.div
          className="rounded-full bg-current"
          style={{ width: dotSize, height: dotSize }}
          animate={animMultiplier ? { y: [0, -dotSize, 0] } : {}}
          transition={{ ...dotTransition, delay: 0.3 }}
        />
      </div>
    );
  }

  if (variant === 'bars') {
    const barWidth = Math.max(2, Math.floor(sizePx * 0.15));
    const barHeight = sizePx;
    const barTransition = {
      duration: 0.8,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    };

    return (
      <div className={`flex gap-1 items-center justify-center ${colorClass} ${className}`} style={{ height: sizePx }}>
        <motion.div
          className="bg-current rounded"
          style={{ width: barWidth, height: barHeight, transformOrigin: 'center' }}
          animate={animMultiplier ? { scaleY: [0.3, 1, 0.3] } : {}}
          transition={{ ...barTransition, delay: 0 }}
        />
        <motion.div
          className="bg-current rounded"
          style={{ width: barWidth, height: barHeight, transformOrigin: 'center' }}
          animate={animMultiplier ? { scaleY: [0.3, 1, 0.3] } : {}}
          transition={{ ...barTransition, delay: 0.2 }}
        />
        <motion.div
          className="bg-current rounded"
          style={{ width: barWidth, height: barHeight, transformOrigin: 'center' }}
          animate={animMultiplier ? { scaleY: [0.3, 1, 0.3] } : {}}
          transition={{ ...barTransition, delay: 0.4 }}
        />
      </div>
    );
  }

  if (variant === 'ring') {
    return (
      <div className={`flex justify-center items-center ${colorClass} ${className}`}>
        <div
          className={`rounded-full border-[3px] border-current border-t-transparent ${animMultiplier ? 'animate-spin' : ''}`}
          style={{ width: sizePx, height: sizePx }}
        />
      </div>
    );
  }

  // Default: variant === "spinner" (Material symbol spin or SVG spinner)
  // We'll use a premium SVG spinner because it's performant and scales perfectly
  return (
    <div className={`flex justify-center items-center ${colorClass} ${className}`}>
      <svg
        className={`animate-spin`}
        style={{ width: sizePx, height: sizePx, animationDuration: animMultiplier ? '1s' : '0s' }}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}
