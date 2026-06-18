import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import * as allVariants from './variants';

/**
 * Reveal — wraps a block in a fade/slide/scale on mount or when scrolled into view.
 *
 * Props
 *  - children: react nodes to wrap
 *  - variant: maps to variants.js keys (default: "fadeUp")
 *  - delay: seconds added to the underlying transition delay (default: 0)
 *  - duration: transition duration in seconds (default: 0.5)
 *  - threshold: intersection threshold (default: 0.15)
 *  - once: triggers animation only once (default: true)
 *  - whenInView: if true, waits for the element to scroll into view (default: false)
 *  - className: css class name
 *  - as: HTML element to render (default: 'div')
 *  - layout: standard motion layout prop (default: true)
 */
export default function Reveal({
  children,
  variant = 'fadeUp',
  delay = 0,
  duration = 0.5,
  threshold = 0.15,
  once = true,
  whenInView = false,
  className,
  as = 'div',
  layout = true,
  ...rest
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount: threshold });

  const MotionTag = motion[as] || motion.div;
  const baseVariant = allVariants[variant] || allVariants.fadeUp;

  // Merge custom duration and delay props into the variant structure
  const motionVariants = {
    hidden: baseVariant.hidden,
    visible: {
      ...baseVariant.visible,
      transition: {
        ...baseVariant.visible?.transition,
        duration: allVariants.shouldAnimate() ? duration : 0.01,
        delay: allVariants.shouldAnimate() ? delay : 0,
      },
    },
  };

  const animateState = whenInView ? (isInView ? 'visible' : 'hidden') : 'visible';

  return (
    <MotionTag
      ref={ref}
      className={className}
      variants={motionVariants}
      initial="hidden"
      animate={animateState}
      layout={layout}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
