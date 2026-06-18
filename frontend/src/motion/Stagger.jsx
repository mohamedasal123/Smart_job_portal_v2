import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { stagger as staggerVariants, shouldAnimate } from './variants';
import * as allVariants from './variants';

/**
 * Stagger — wraps a list so each child animates in sequence.
 * Auto-wraps children in motion.div if they aren't already motion components.
 *
 * Props
 *  - children: elements to animate
 *  - className: container CSS classes
 *  - delayChildren: delay before starting stagger (default: 0.1)
 *  - staggerChildren: delay between children animations (default: 0.08)
 *  - direction: "up" | "down" | "left" | "right" (default: "up")
 *  - whenInView: if true, waits for container to scroll into view (default: false)
 *  - viewport: intersection observer options
 *  - as: HTML tag for the container element (default: 'div')
 */
export default function Stagger({
  children,
  className,
  delayChildren = 0.1,
  staggerChildren = 0.08,
  direction = 'up',
  whenInView = false,
  viewport = { once: true, margin: '-60px' },
  as = 'div',
  ...rest
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  if (reduce || !shouldAnimate()) {
    const PlainTag = as;
    return (
      <PlainTag className={className} {...rest}>
        {children}
      </PlainTag>
    );
  }

  // Determine the direction variant for items
  const itemVariants = allVariants[
    direction === 'up' ? 'fadeUp' :
    direction === 'down' ? 'fadeDown' :
    direction === 'left' ? 'fadeLeft' :
    direction === 'right' ? 'fadeRight' : 'fadeUp'
  ] || allVariants.fadeUp;

  // Helper to determine if element is a motion component
  const isMotionComponent = (child) => {
    if (!child || !child.type) return false;
    if (typeof child.type === 'string') return false;
    
    const displayName = child.type.displayName || child.type.render?.displayName || '';
    const name = child.type.name || child.type.render?.name || '';
    
    return displayName.toLowerCase().includes('motion') || name.toLowerCase().includes('motion');
  };

  // Map and process children
  const processedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;

    if (isMotionComponent(child)) {
      return React.cloneElement(child, {
        variants: child.props.variants || itemVariants,
      });
    }

    return (
      <motion.div variants={itemVariants}>
        {child}
      </motion.div>
    );
  });

  return (
    <Tag
      className={className}
      variants={staggerVariants(delayChildren, staggerChildren)}
      initial="hidden"
      {...(whenInView
        ? { whileInView: 'visible', viewport }
        : { animate: 'visible' })}
      {...rest}
    >
      {processedChildren}
    </Tag>
  );
}

// Convenience child — kept for backward compatibility.
Stagger.Item = function StaggerItem({ children, className, as = 'div', variant = 'fadeUp', ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  if (reduce || !shouldAnimate()) {
    const PlainTag = as;
    return (
      <PlainTag className={className} {...rest}>
        {children}
      </PlainTag>
    );
  }

  const itemVariant = allVariants[variant] || allVariants.fadeUp;

  return (
    <Tag className={className} variants={itemVariant} {...rest}>
      {children}
    </Tag>
  );
};
