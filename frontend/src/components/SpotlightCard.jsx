import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { cardHover } from '../motion/variants';

/**
 * SpotlightCard — a premium card with mouse-following radial spotlight,
 * subtle 3D tilt, and shadow expansion on hover.
 *
 * Props:
 *  - children: card content
 *  - className: additional classes
 *  - as: HTML element (default: 'div')
 *  - enableTilt: enable 3D tilt effect (default: true)
 *  - enableSpotlight: enable spotlight (default: true)
 *  - hover: use cardHover variant (default: true)
 *  - ...rest: passed to motion element
 */
export default function SpotlightCard({
  children,
  className = '',
  as = 'div',
  enableTilt = true,
  enableSpotlight = true,
  hover = true,
  ...rest
}) {
  const cardRef = useRef(null);
  const reduce = useReducedMotion();

  const MotionTag = motion[as] || motion.div;

  const handleMouseMove = (e) => {
    if (!cardRef.current || reduce) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update CSS vars for spotlight
    if (enableSpotlight) {
      cardRef.current.style.setProperty('--mouse-x', `${x}px`);
      cardRef.current.style.setProperty('--mouse-y', `${y}px`);
    }

    // 3D tilt
    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5; // max 5deg
      const rotateY = ((x - centerX) / centerX) * 5;
      cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
    }
  };

  const handleMouseLeave = () => {
    if (!cardRef.current || reduce) return;
    cardRef.current.style.transform = '';
  };

  return (
    <MotionTag
      ref={cardRef}
      className={`spotlight-card ${className}`}
      variants={hover && !reduce ? cardHover : undefined}
      initial={hover && !reduce ? 'rest' : undefined}
      whileHover={hover && !reduce ? 'hover' : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        willChange: 'transform',
      }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
}
