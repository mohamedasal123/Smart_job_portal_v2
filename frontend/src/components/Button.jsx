import { useRef } from 'react';
import { motion } from 'framer-motion';
import { shouldAnimate } from '../motion/variants';

/**
 * Button — premium interactive button with:
 *  - Ripple effect on click
 *  - Shine sweep on hover
 *  - Scale up on hover, compress on tap
 *  - Loading state morphs button into spinner
 *
 * Props:
 *  - variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 *  - loading: boolean — shows spinner, disables interaction
 *  - className: additional classes
 *  - shine: boolean — enables CTA shine (default: true for primary)
 *  - ...props: passed to the button element
 */
export function Button({
  children,
  className = '',
  variant = 'primary',
  loading = false,
  shine,
  ...props
}) {
  const btnRef = useRef(null);
  const animate = shouldAnimate();

  const handleClick = (e) => {
    if (loading || props.disabled) return;
    props.onClick?.(e);

    if (!animate || !btnRef.current) return;

    const btn = btnRef.current;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const wave = document.createElement('span');
    wave.className = 'btn-ripple-wave';
    wave.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
    `;
    btn.appendChild(wave);
    setTimeout(() => wave.remove(), 600);
  };

  const enableShine = shine !== undefined ? shine : variant === 'primary';
  const shineClass = enableShine ? 'btn-cta-shine' : '';

  return (
    <motion.button
      ref={btnRef}
      className={`btn btn-${variant} btn-ripple ${shineClass} ${className}`.trim()}
      whileHover={animate && !loading && !props.disabled ? { scale: 1.02 } : undefined}
      whileTap={animate && !loading && !props.disabled ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      {...props}
      disabled={loading || props.disabled}
      onClick={handleClick}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin"
            style={{ width: 16, height: 16 }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{typeof children === 'string' ? children : 'Loading...'}</span>
        </span>
      ) : children}
    </motion.button>
  );
}
