import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { getSeekerDashboardData } from '../../services/jobSeekerDataService';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import SeekerStatsCard from '../../components/jobSeeker/SeekerStatsCard';
import SeekerJobCard from '../../components/jobSeeker/SeekerJobCard';
import SeekerApplicationCard from '../../components/jobSeeker/SeekerApplicationCard';
import Stagger from '../../motion/Stagger';
import Reveal from '../../motion/Reveal';
import { SkeletonCard } from '../../components/Skeleton';

export default function JobSeekerDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getSeekerDashboardData();
        setData(dashboardData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop space-y-gutter pb-stack-lg max-w-7xl mx-auto" aria-busy="true" aria-live="polite">
        <div className="h-10 w-72 rounded-md bg-surface-container-low animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-surface-container-low via-surface-container-high to-surface-container-low" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-gutter">
            <SkeletonCard /><SkeletonCard />
          </div>
          <div className="space-y-gutter">
            <SkeletonCard />
          </div>
        </div>
        <span className="sr-only">Loading dashboard…</span>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop space-y-gutter pb-stack-lg max-w-7xl mx-auto">
      <SeekerPageHeader
        title="Welcome back!"
        subtitle={`Your profile is ${data.profileCompletion}% complete. Let's find your next opportunity.`}
        icon="waving_hand"
      />

      {/* CV Upload / Status Card */}
      <section className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-ambient border border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4">
        {data.profile.cvFile ? (
          <>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">task</span>
              </div>
              <div>
                <h3 className="font-h3 text-h3 text-primary mb-1">CV Uploaded Successfully</h3>
                <p className="font-body-sm text-on-surface-variant flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">description</span> {data.profile.cvFile.name} &bull; Uploaded on {new Date(data.profile.cvFile.uploadedAt).toLocaleDateString()}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-success-container/30 text-success px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Parsed</span>
                  <span className="text-on-surface-variant text-xs">Extracted {data.skillsCount} skills</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link to="/seeker/cv-upload" className="w-full sm:w-auto inline-flex items-center justify-center gap-unit border border-outline-variant text-primary px-stack-md py-stack-sm rounded-lg font-h3 text-h3 hover:bg-surface-container-low transition-colors">
                Re-upload CV
              </Link>
              <Link to="/seeker/cv-review" className="w-full sm:w-auto inline-flex items-center justify-center gap-unit bg-secondary text-on-secondary px-stack-md py-stack-sm rounded-lg font-h3 text-h3 shadow-sm hover:opacity-90 transition-opacity">
                Review Extracted Data
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-error-container/20 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">upload_file</span>
              </div>
              <div>
                <h3 className="font-h3 text-h3 text-primary mb-1">Upload your CV</h3>
                <p className="font-body-sm text-on-surface-variant">
                  Upload your CV to unlock AI matching and personalized job recommendations.
                </p>
              </div>
            </div>
            <div className="w-full md:w-auto">
              <Link to="/seeker/cv-upload" className="w-full sm:w-auto inline-flex items-center justify-center gap-unit bg-secondary text-on-secondary px-stack-md py-stack-sm rounded-lg font-h3 text-h3 shadow-sm hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">upload</span> Upload CV
              </Link>
            </div>
          </>
        )}
      </section>

      <Stagger as="section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter" delayChildren={0.05} staggerChildren={0.07}>
        <Stagger.Item>
          <SeekerStatsCard
            title="Applied"
            value={data.stats.totalApplications}
            icon="send"
            onClick={() => navigate(`${ROUTES.SEEKER_PROFILE}#applications`)}
          />
        </Stagger.Item>
        <Stagger.Item>
          <SeekerStatsCard
            title="Under Review"
            value={data.stats.underReviewCount}
            icon="visibility"
            onClick={() => navigate(`${ROUTES.SEEKER_PROFILE}#applications`)}
          />
        </Stagger.Item>
        <Stagger.Item>
          <SeekerStatsCard
            title="Shortlisted"
            value={data.stats.shortlistedCount}
            icon="stars"
            onClick={() => navigate(`${ROUTES.SEEKER_PROFILE}#applications`)}
          />
        </Stagger.Item>
        <Stagger.Item>
          <SeekerStatsCard
            title="Profile Skills"
            value={data.skillsCount}
            icon="psychology"
            onClick={() => navigate(`${ROUTES.SEEKER_PROFILE}#skills`)}
          />
        </Stagger.Item>
      </Stagger>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <section className="lg:col-span-2 space-y-stack-md min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h2 className="font-h2 text-h2 text-primary truncate">Top Matches for You</h2>
            <Link className="font-label-sm text-label-sm text-secondary hover:underline whitespace-nowrap" to={ROUTES.SEEKER_RECOMMENDED_JOBS}>
              View all
            </Link>
          </div>

          <Stagger className="grid grid-cols-1 md:grid-cols-2 gap-gutter" delayChildren={0.05} staggerChildren={0.06}>
            {data.topRecommendedJobs.map((rec) => (
              <Stagger.Item key={rec.jobId}>
                <SeekerJobCard job={{ ...rec.job, recommendation: rec }} />
              </Stagger.Item>
            ))}
            {data.topRecommendedJobs.length === 0 && (
              <Reveal className="col-span-1 md:col-span-2 p-8 text-center bg-surface-container-lowest border border-outline-variant rounded-xl border-dashed">
                <p className="text-on-surface-variant mb-4">No recommended jobs found. Try adding more skills.</p>
                <Link to={ROUTES.SEEKER_SKILLS} className="text-secondary hover:underline">Update Skills</Link>
              </Reveal>
            )}
          </Stagger>
        </section>

        <section className="space-y-stack-md min-w-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h2 className="font-h2 text-h2 text-primary truncate">Recent Applications</h2>
            <Link className="font-label-sm text-label-sm text-secondary hover:underline whitespace-nowrap" to={`${ROUTES.SEEKER_PROFILE}#applications`}>
              View all
            </Link>
          </div>

          <Stagger className="flex flex-col gap-gutter" delayChildren={0.05} staggerChildren={0.06}>
            {data.recentApplications.map((app) => (
              <Stagger.Item key={app.id}>
                <SeekerApplicationCard application={app} />
              </Stagger.Item>
            ))}
            {data.recentApplications.length === 0 && (
              <Reveal className="p-8 text-center bg-surface-container-lowest border border-outline-variant rounded-xl border-dashed">
                <p className="text-on-surface-variant mb-4">You haven't applied to any jobs yet.</p>
                <Link to={ROUTES.SEEKER_JOBS} className="text-secondary hover:underline">Browse Jobs</Link>
              </Reveal>
            )}
          </Stagger>

        </section>
      </div>
    </div>
  );
}
