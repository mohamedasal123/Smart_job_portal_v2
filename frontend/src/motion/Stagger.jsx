import { motion, useReducedMotion } from 'framer-motion';
import { stagger as staggerVariants, fadeUp } from './variants';

/**
 * Stagger — wraps a list so each child fades up in sequence.
 * Children that should animate must be `motion.*` elements or use Stagger.Item.
 *
 * Honors prefers-reduced-motion by rendering plain children with no transitions.
 */
export default function Stagger({
  children,
  className,
  delayChildren = 0.05,
  staggerChildren = 0.06,
  whenInView = false,
  viewport = { once: true, margin: '-60px' },
  as = 'div',
  ...rest
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  if (reduce) {
    const PlainTag = as;
    return (
      <PlainTag className={className} {...rest}>
        {children}
      </PlainTag>
    );
  }

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
      {children}
    </Tag>
  );
}

// Convenience child — drop `<Stagger.Item>` around list rows that aren't
// already `motion.*` elements. Forwards all props through.
Stagger.Item = function StaggerItem({ children, className, as = 'div', ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as] || motion.div;

  if (reduce) {
    const PlainTag = as;
    return (
      <PlainTag className={className} {...rest}>
        {children}
      </PlainTag>
    );
  }

  return (
    <Tag className={className} variants={fadeUp} {...rest}>
      {children}
    </Tag>
  );
};
