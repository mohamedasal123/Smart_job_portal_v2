import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from './Button';
import Reveal from '../motion/Reveal';
import { shouldAnimate } from '../motion/variants';

const FLOATING_SHAPES = [
  { className: 'top-[12%] left-[8%] w-16 h-16 rounded-full bg-secondary/10', delay: 0 },
  { className: 'top-[20%] right-[10%] w-10 h-10 rounded-lg bg-tertiary/15 rotate-12', delay: 0.5 },
  { className: 'bottom-[18%] left-[14%] w-12 h-12 rounded-full bg-error/10', delay: 1 },
  { className: 'bottom-[22%] right-[12%] w-14 h-14 rounded-xl bg-secondary/8 -rotate-6', delay: 1.5 },
];

/**
 * Shared animated shell for 404 / 401 / 403 / 500 pages.
 */
export default function ErrorPageShell({
  code,
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  children,
}) {
  const reduce = useReducedMotion();
  const animate = shouldAnimate() && !reduce;

  return (
    <div className="stitch-page bg-background text-on-background min-h-screen flex flex-col font-body-md relative overflow-hidden">
      {animate &&
        FLOATING_SHAPES.map((shape, i) => (
          <motion.div
            key={i}
            aria-hidden="true"
            className={`absolute pointer-events-none ${shape.className}`}
            animate={{ y: [0, i % 2 === 0 ? -14 : 12, 0] }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: shape.delay,
            }}
          />
        ))}

      <main className="flex-grow flex items-center justify-center p-gutter relative z-10">
        <Reveal variant="fadeUp" duration={0.45} className="max-w-2xl w-full text-center flex flex-col items-center">
          <motion.div
            animate={animate ? { y: [0, -10, 0] } : undefined}
            transition={animate ? { duration: 5, repeat: Infinity, ease: 'easeInOut' } : undefined}
            className="w-48 h-48 mb-stack-lg rounded-full bg-surface-container-high flex items-center justify-center relative overflow-hidden shadow-ambient"
          >
            <span
              className="material-symbols-outlined text-[100px] text-outline-variant"
              style={{ fontVariationSettings: '"FILL" 0' }}
              aria-hidden="true"
            >
              {icon}
            </span>
          </motion.div>

          {code && (
            <p className="font-ai-score text-ai-score text-secondary mb-unit">{code}</p>
          )}

          <h1 className="font-h1 text-h1 text-primary mb-stack-sm">{title}</h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mx-auto mb-stack-lg">
            {description}
          </p>

          {children}

          <div className="flex flex-col sm:flex-row gap-stack-md justify-center w-full max-w-md mt-stack-md">
            {primaryAction && (
              primaryAction.to ? (
                <Link
                  to={primaryAction.to}
                  className="inline-flex items-center justify-center px-gutter py-stack-sm rounded-lg bg-secondary text-on-secondary font-body-lg font-bold hover:opacity-90 transition-opacity w-full sm:w-auto shadow-ambient btn-shine"
                >
                  {primaryAction.icon && (
                    <span className="material-symbols-outlined mr-unit text-[20px]">{primaryAction.icon}</span>
                  )}
                  {primaryAction.label}
                </Link>
              ) : (
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={primaryAction.onClick}
                >
                  {primaryAction.icon && (
                    <span className="material-symbols-outlined text-[20px]">{primaryAction.icon}</span>
                  )}
                  {primaryAction.label}
                </Button>
              )
            )}
            {secondaryAction && (
              <Link
                className="inline-flex items-center justify-center px-gutter py-stack-sm rounded-lg border border-outline-variant text-on-surface font-body-lg font-bold hover:bg-surface-container-low transition-colors w-full sm:w-auto bg-transparent"
                to={secondaryAction.to}
              >
                {secondaryAction.icon && (
                  <span className="material-symbols-outlined mr-unit text-[20px]">{secondaryAction.icon}</span>
                )}
                {secondaryAction.label}
              </Link>
            )}
          </div>
        </Reveal>
      </main>
    </div>
  );
}
