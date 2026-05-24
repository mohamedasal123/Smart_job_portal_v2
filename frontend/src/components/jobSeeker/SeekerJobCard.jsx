import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { isJobSaved, toggleSavedJob } from '../../services/jobSeekerDataService';
import { useToast } from '../useToast';
import MatchScoreBadge from './MatchScoreBadge';
import { EASE, SPRING_PRESS } from '../../motion/variants';

export default function SeekerJobCard({ job, onSavedStateChange, detailsPath: detailsPathOverride, saveEnabled = true, onSaveUnavailable, showSaveButton = true }) {
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    if (!showSaveButton || !saveEnabled) {
      setIsSaved(false);
      return;
    }

    const checkSaved = async () => {
      const saved = await isJobSaved(job.id);
      setIsSaved(saved);
    };
    checkSaved();
  }, [job.id, saveEnabled, showSaveButton]);

  const handleToggleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaving) return;

    if (!saveEnabled) {
      onSaveUnavailable?.(job);
      return;
    }

    setIsSaving(true);
    try {
      const result = await toggleSavedJob(job.id);
      setIsSaved(result.isSaved);
      addToast({
        title: result.isSaved ? 'Job Saved' : 'Job Removed',
        message: result.isSaved ? 'Added to your saved jobs wishlist.' : 'Removed from your saved jobs wishlist.',
        type: 'success',
      });
      if (onSavedStateChange) {
        onSavedStateChange(job.id, result.isSaved);
      }
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not update saved status.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (currency) => {
    if (!currency || String(currency).toUpperCase() === 'USD') return '$';
    return currency;
  };

  const formatSalaryValue = (value, currency) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return `${Math.round(amount / 1000)}K ${formatCurrency(currency)}`;
  };

  const formatSalary = (min, max, currency) => {
    const minLabel = formatSalaryValue(min, currency);
    const maxLabel = formatSalaryValue(max, currency);

    if (minLabel && maxLabel && minLabel !== maxLabel) return `${minLabel} - ${maxLabel}`;
    return minLabel || maxLabel;
  };

  const detailsPath = detailsPathOverride || `/seeker/jobs/${job.id}`;
  const openDetails = () => navigate(detailsPath);
  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetails();
    }
  };

  const matchScore = Number(job.recommendation?.matchScore ?? job.matchScore ?? 0);
  const salaryText = formatSalary(job.salaryMin, job.salaryMax, job.currency);

  return (
    <motion.div
      onClick={openDetails}
      onKeyDown={handleCardKeyDown}
      role="link"
      tabIndex={0}
      whileHover={reduce ? undefined : { y: -4, boxShadow: '0px 14px 40px rgba(15,23,42,0.12)', transition: { duration: 0.25, ease: EASE } }}
      className="bg-surface-container-lowest rounded-xl p-stack-lg border border-outline-variant shadow-ambient hover:shadow-hover transition-all flex flex-col h-full relative group overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
    >
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant font-bold text-xl">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover rounded-lg" />
            ) : (
              job.company.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-h3 text-h3 text-primary truncate pr-2" title={job.title}>{job.title}</h3>
            <p className="font-body-md text-body-md text-secondary truncate">{job.company}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {matchScore > 0 && (
            <MatchScoreBadge score={matchScore} size="sm" showLabel={false} />
          )}
          {showSaveButton && (
            <motion.button
              type="button"
              onClick={handleToggleSave}
              disabled={isSaving}
              whileTap={reduce || isSaving ? undefined : { scale: 0.85, transition: SPRING_PRESS }}
              animate={reduce ? undefined : { scale: isSaved ? [1, 1.18, 1] : 1 }}
              transition={reduce ? undefined : { duration: 0.32, ease: EASE }}
              aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title} to your saved jobs`}
              aria-pressed={isSaved}
              className={`w-8 h-8 inline-flex items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${isSaved ? 'text-secondary hover:bg-secondary/10' : 'text-on-surface-variant hover:text-secondary hover:bg-surface-container-low'}`}
              title={isSaved ? 'Remove from saved jobs' : 'Save this job'}
            >
              <span className={`material-symbols-outlined text-[22px] ${isSaved ? 'fill-current' : ''}`} style={{ fontVariationSettings: isSaved ? '"FILL" 1' : '"FILL" 0' }} aria-hidden="true">
                bookmark
              </span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 mt-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-medium border border-outline-variant">
          <span className="material-symbols-outlined text-[14px]">location_on</span>
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-medium border border-outline-variant">
          <span className="material-symbols-outlined text-[14px]">work</span>
          {job.type === 'full_time' ? 'Full Time' : job.type}
        </span>
        {salaryText && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-medium border border-outline-variant">
            <span className="material-symbols-outlined text-[14px]">payments</span>
            {salaryText}
          </span>
        )}
      </div>

      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-6 flex-1">
        {job.description}
      </p>

      <div className="mt-auto pt-4 border-t border-outline-variant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span className="font-body-sm text-xs text-on-surface-variant">
          Posted {new Date(job.postedAt).toLocaleDateString()}
        </span>
        <motion.div whileTap={reduce ? undefined : { scale: 0.97, transition: SPRING_PRESS }} className="w-full sm:w-auto">
          <Link
            to={detailsPath}
            onClick={(event) => event.stopPropagation()}
            className="group inline-flex items-center gap-unit text-secondary font-label-md text-label-md hover:text-primary transition-colors whitespace-nowrap"
          >
            <span className="group-hover:underline">View Details</span>
            <span className="material-symbols-outlined text-[18px] no-underline">arrow_forward</span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
