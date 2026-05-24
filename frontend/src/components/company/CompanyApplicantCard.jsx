import { Link } from 'react-router-dom';
import ApplicantMatchScore from './ApplicantMatchScore';
import CompanySkillTag from './CompanySkillTag';
import CompanyStatusBadge from './CompanyStatusBadge';
import ApplicantStatusActions from './ApplicantStatusActions';

export default function CompanyApplicantCard({ applicant, onShortlist, onReject, onApprove }) {
  return (
    <article className="bg-surface-container-lowest rounded-xl p-stack-lg border border-outline-variant shadow-ambient">
      <div className="flex items-start gap-stack-md">
        <img alt={applicant.name} className="w-14 h-14 rounded-full object-cover" src={applicant.avatar || undefined} />
        <div className="flex-1">
          <Link className="font-h2 text-h2 text-primary hover:text-secondary" to={`/company/applicants/${applicant.id}`}>{applicant.name}</Link>
          <p className="font-body-md text-body-md text-on-surface-variant">{applicant.title} · {applicant.yearsExperience} years</p>
        </div>
        <ApplicantMatchScore score={applicant.matchScore} />
      </div>
      <div className="mt-stack-md flex items-center justify-between gap-stack-md">
        <CompanyStatusBadge status={applicant.status} />
        <span className="font-body-sm text-body-sm text-on-surface-variant">Applied {applicant.appliedAt}</span>
      </div>
      <div className="flex flex-wrap gap-unit mt-stack-md">
        {applicant.matchedSkills.slice(0, 4).map((skill) => <CompanySkillTag tone="matched" key={skill}>{skill}</CompanySkillTag>)}
      </div>
      <ApplicantStatusActions applicant={applicant} onReject={onReject} onShortlist={onShortlist} onApprove={onApprove} />
    </article>
  );
}
