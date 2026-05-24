import { Link } from 'react-router-dom';
import SeekerStatusBadge from './SeekerStatusBadge';
import MatchScoreBadge from './MatchScoreBadge';

export default function SeekerApplicationCard({ application }) {
  const { job } = application;
  const matchScore = Number(application.matchScore || 0);

  return (
    <div className="bg-surface-container-lowest rounded-xl p-stack-lg border border-outline-variant shadow-ambient hover:shadow-hover transition-all">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-lg bg-surface-variant flex items-center justify-center text-on-surface-variant font-bold text-xl">
            {job?.companyLogo ? (
              <img src={job.companyLogo} alt={job?.company} className="w-full h-full object-cover rounded-lg" />
            ) : (
              job?.company?.charAt(0) || 'C'
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-h3 text-h3 text-primary truncate" title={job?.title}>{job?.title || 'Unknown Job'}</h3>
            <p className="font-body-md text-body-md text-secondary truncate" title={job?.company}>{job?.company || 'Unknown Company'}</p>
          </div>
        </div>
        <div className="shrink-0">
          <SeekerStatusBadge status={application.status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-outline-variant">
        <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            Applied {new Date(application.appliedAt).toLocaleDateString()}
          </span>
          {matchScore > 0 && (
            <MatchScoreBadge score={matchScore} size="sm" showLabel={true} />
          )}
        </div>

        <Link
          to={`/seeker/applications/${application.id}`}
          className="group inline-flex items-center gap-unit text-secondary font-label-md text-label-md hover:text-primary transition-colors whitespace-nowrap"
        >
          <span className="group-hover:underline">View Details</span>
          <span className="material-symbols-outlined text-[18px] no-underline">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
