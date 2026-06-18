import { motion, useReducedMotion } from 'framer-motion';
import AnimatedCounter from '../../motion/AnimatedCounter';
import SpotlightCard from '../SpotlightCard';
import { SPRING_PRESS, SPRING_SOFT } from '../../motion/variants';

export default function SeekerStatsCard({ title, value, icon, description, onClick }) {
  const reduce = useReducedMotion();
  const isInteractive = Boolean(onClick);
  const numericValue = Number(value);
  const renderValue = Number.isFinite(numericValue)
    ? <AnimatedCounter value={numericValue} />
    : value;

  return (
    <SpotlightCard
      as={isInteractive ? 'button' : 'div'}
      onClick={onClick}
      type={isInteractive ? 'button' : undefined}
      className={`w-full bg-surface-container-lowest rounded-xl p-stack-lg border border-outline-variant text-left ${
        isInteractive
          ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary hover:border-secondary/50'
          : ''
      }`}
      enableTilt={!reduce && isInteractive}
      enableSpotlight
      hover={isInteractive}
      whileTap={reduce || !isInteractive ? undefined : { scale: 0.98, transition: SPRING_PRESS }}
    >
      <div className="flex items-center justify-between">
        <motion.span
          className="material-symbols-outlined text-secondary"
          aria-hidden="true"
          whileHover={reduce ? undefined : { rotate: -8, scale: 1.12 }}
          transition={reduce ? undefined : SPRING_SOFT}
          style={{ fontVariationSettings: '"FILL" 0' }}
        >
          {icon}
        </motion.span>
        <span className="font-display text-[34px] leading-none text-primary">{renderValue}</span>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant mt-stack-md">{title}</p>
      {description && <p className="font-body-sm text-body-sm text-on-surface-variant mt-unit">{description}</p>}
    </SpotlightCard>
  );
}
