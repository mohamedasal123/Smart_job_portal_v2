import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import AnimatedCounter from '../../motion/AnimatedCounter';
import SpotlightCard from '../SpotlightCard';
import { SPRING_SOFT } from '../../motion/variants';

export default function CompanyStatsCard({ icon, label, value, to }) {
  const reduce = useReducedMotion();
  const numericValue = Number(value);
  const renderValue = Number.isFinite(numericValue)
    ? <AnimatedCounter value={numericValue} />
    : value;

  const cardContent = (
    <SpotlightCard
      as="div"
      className="bg-surface-container-lowest rounded-xl p-stack-lg border border-outline-variant"
      enableTilt={!reduce}
      enableSpotlight
    >
      <div className="flex items-center justify-between">
        <motion.span
          className="material-symbols-outlined text-secondary text-[28px]"
          whileHover={reduce ? undefined : { rotate: -8, scale: 1.1 }}
          transition={reduce ? undefined : SPRING_SOFT}
          style={{ fontVariationSettings: '"FILL" 0' }}
        >
          {icon}
        </motion.span>
        <span className="font-display text-[34px] leading-none text-primary">{renderValue}</span>
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant mt-stack-md">{label}</p>
    </SpotlightCard>
  );

  return to ? <Link to={to} className="block no-underline">{cardContent}</Link> : cardContent;
}
