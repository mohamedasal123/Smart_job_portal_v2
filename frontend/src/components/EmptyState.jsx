import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Reveal from '../motion/Reveal';
import { Button } from './Button';
import { SPRING_SOFT } from '../motion/variants';

// Icon-to-color/gradient mapping for visual richness
const ICON_THEMES = {
  inbox: { bg: 'bg-secondary/10', color: 'text-secondary', glow: 'rgba(37,99,235,0.15)' },
  work: { bg: 'bg-secondary/10', color: 'text-secondary', glow: 'rgba(37,99,235,0.15)' },
  search: { bg: 'bg-tertiary/10', color: 'text-tertiary', glow: 'rgba(20,184,166,0.15)' },
  people: { bg: 'bg-secondary/10', color: 'text-secondary', glow: 'rgba(37,99,235,0.15)' },
  notifications: { bg: 'bg-warning/10', color: 'text-warning', glow: 'rgba(245,158,11,0.15)' },
  error: { bg: 'bg-error-container', color: 'text-error', glow: 'rgba(239,68,68,0.15)' },
  bookmark: { bg: 'bg-tertiary/10', color: 'text-tertiary', glow: 'rgba(20,184,166,0.15)' },
};

/**
 * EmptyState — premium animated empty state with:
 * - Floating icon with glow
 * - Orbit decorative dots
 * - Fade-up text reveal
 * - CTA button with shine
 *
 * Props:
 *  - icon: material symbol name
 *  - title: heading text
 *  - message: description text
 *  - action: onClick handler for button
 *  - actionLabel: button text
 *  - actionTo: Link route (alternative to action)
 *  - className: wrapper classes
 */
export default function EmptyState({
  icon = 'inbox',
  title,
  message,
  action,
  actionLabel,
  actionTo,
  className = '',
}) {
  const reduce = useReducedMotion();
  const theme = ICON_THEMES[icon] || ICON_THEMES.inbox;

  return (
    <Reveal variant="fadeUp" duration={0.45} whenInView className={className}>
      <div className="relative py-16 px-8 text-center max-w-md mx-auto">

        {/* Floating icon container */}
        <div className="relative inline-flex items-center justify-center mb-8">
          {/* Glow behind icon */}
          <div
            className="absolute inset-0 rounded-full blur-2xl scale-150 opacity-60"
            style={{ background: theme.glow }}
            aria-hidden="true"
          />

          {/* Orbiting dots */}
          {!reduce && (
            <>
              <motion.div
                className="absolute w-2 h-2 rounded-full bg-secondary/40"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '40px 0', top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
                aria-hidden="true"
              />
              <motion.div
                className="absolute w-1.5 h-1.5 rounded-full bg-tertiary/40"
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '55px 0', top: '50%', left: '50%', marginTop: -3, marginLeft: -3 }}
                aria-hidden="true"
              />
            </>
          )}

          {/* Main icon */}
          <motion.div
            className={`relative w-24 h-24 rounded-3xl ${theme.bg} flex items-center justify-center shadow-md border border-outline-variant/30`}
            animate={reduce ? undefined : { y: [0, -8, 0] }}
            transition={reduce ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span
              className={`material-symbols-outlined text-[48px] ${theme.color}`}
              style={{ fontVariationSettings: '"FILL" 1' }}
              aria-hidden="true"
            >
              {icon}
            </span>
          </motion.div>
        </div>

        {/* Text content */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduce ? undefined : { delay: 0.15, ...SPRING_SOFT }}
        >
          <h3 className="font-h2 text-h2 text-primary mb-2">{title}</h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs mx-auto leading-relaxed">
            {message}
          </p>
        </motion.div>

        {/* CTA */}
        {(action || actionTo) && (
          <motion.div
            className="mt-6"
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={reduce ? undefined : { delay: 0.25, ...SPRING_SOFT }}
          >
            {actionTo ? (
              <Link
                to={actionTo}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-secondary text-on-secondary font-semibold shadow-sm hover:shadow-md hover:scale-105 transition-all btn-cta-shine"
              >
                {actionLabel}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            ) : (
              <Button variant="primary" onClick={action} shine>
                {actionLabel}
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </Reveal>
  );
}
