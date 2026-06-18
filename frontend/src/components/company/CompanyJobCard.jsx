import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import { SPRING_SOFT } from '../../motion/variants';
import SpotlightCard from '../SpotlightCard';
import CompanySkillTag from './CompanySkillTag';
import CompanyStatusBadge from './CompanyStatusBadge';

const formatSalary = (job) => `$${Math.round(job.salaryMin / 1000)}k - $${Math.round(job.salaryMax / 1000)}k`;

export default function CompanyJobCard({ job, actions }) {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const jobType = t(`companyFlow.jobTypeOptions.${job.type}`, { defaultValue: job.type });
  const workMode = t(`companyFlow.workModes.${job.workMode}`, { defaultValue: job.workMode });

  return (
    <SpotlightCard
      as="article"
      className="bg-surface-container-lowest rounded-xl p-stack-lg border border-outline-variant"
      enableTilt={!reduce}
      enableSpotlight
    >
      <div className="flex items-start justify-between gap-stack-md">
        <div>
          <Link
            className="font-h2 text-h2 text-primary hover:text-secondary transition-colors"
            to={`/company/jobs/${job.id}`}
          >
            {job.title}
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant mt-unit">
            {job.location} · {workMode} · {jobType}
          </p>
        </div>
        <CompanyStatusBadge status={job.status} />
      </div>

      <p className="font-body-md text-body-md text-on-surface-variant mt-stack-md line-clamp-2">
        {job.description}
      </p>

      <div className="flex flex-wrap gap-unit mt-stack-md">
        {job.requiredSkills.slice(0, 4).map((skill) => (
          <CompanySkillTag key={skill}>{skill}</CompanySkillTag>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-stack-md mt-stack-md pt-stack-md border-t border-outline-variant text-center">
        <div>
          <p className="font-h3 text-h3 text-primary">{job.applicationsCount}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t('dashboardComponents.common.applicants')}</p>
        </div>
        <div>
          <p className="font-h3 text-h3 text-primary">{job.views}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t('dashboardComponents.common.views')}</p>
        </div>
        <div>
          <p className="font-h3 text-h3 text-primary">{formatSalary(job)}</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t('dashboardComponents.common.salary')}</p>
        </div>
      </div>

      {actions && <div className="flex flex-wrap gap-unit mt-stack-md">{actions}</div>}
    </SpotlightCard>
  );
}
