import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import Reveal from '../../motion/Reveal';
import Stagger from '../../motion/Stagger';
import AnimatedCounter from '../../motion/AnimatedCounter';
import PublicNavBar from '../../components/PublicNavBar';
import PublicFooter from '../../components/PublicFooter';
import { EASE, SPRING_PRESS } from '../../motion/variants';
import { getPublicJobs, getPublicCompanies } from '../../services/publicDataService';

const HOW_IT_WORKS = [
  { step: '01', icon: 'upload_file', key: 'upload' },
  { step: '02', icon: 'auto_awesome', key: 'match' },
  { step: '03', icon: 'handshake', key: 'apply' },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [jobQuery, setJobQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showJobSuggestions, setShowJobSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  const jobInputRef = useRef(null);
  const locationInputRef = useRef(null);

  useEffect(() => {
    Promise.all([
      getPublicJobs(),
      getPublicCompanies()
    ]).then(([jobsData, companiesData]) => {
      setJobs(jobsData || []);
      setCompaniesCount((companiesData || []).length);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const { uniqueTitles, uniqueLocations, popularSearches } = useMemo(() => {
    const titleCounts = {};
    const locSet = new Set();
    
    jobs.forEach(job => {
      const title = job.title?.trim();
      if (title) {
        titleCounts[title] = (titleCounts[title] || 0) + 1;
      }

      if (job.location && job.location !== 'Remote') {
        locSet.add(job.location.trim());
      }
    });

    const sortedTitles = Object.entries(titleCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);

    return {
      uniqueTitles: sortedTitles,
      uniqueLocations: Array.from(locSet).sort(),
      popularSearches: sortedTitles.length > 0 
        ? sortedTitles.slice(0, 4)
        : []
    };
  }, [jobs]);

  const dynamicStats = useMemo(() => {
    return [
      { value: jobs.length || 0, suffix: '', label: t('home.stats.activeJobs'), icon: 'work' },
      { value: companiesCount || 0, suffix: '', label: t('home.stats.topCompanies'), icon: 'apartment' },
      { value: uniqueLocations.length || 0, suffix: '', label: t('home.stats.availableLocations'), icon: 'location_on' },
    ];
  }, [jobs.length, companiesCount, uniqueLocations.length, t]);

  const dynamicCategories = useMemo(() => {
    if (loading) return [];

    const categoryCounts = {};
    jobs.forEach(job => {
      const cat = job.category || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const iconMap = {
      'Engineering': 'code',
      'Design': 'palette',
      'Marketing': 'campaign',
      'Data Science': 'analytics',
      'Finance': 'account_balance',
      'Customer Success': 'support_agent',
      'Operations': 'inventory_2',
      'Human Resources': 'groups',
      'Other': 'category',
    };

    const sortedCats = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({
        icon: iconMap[label] || 'work',
        label,
        count: t('home.categories.jobCount', { count }),
      }));

    return sortedCats.slice(0, 8); // Top 8
  }, [jobs, loading, t]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (jobInputRef.current && !jobInputRef.current.contains(e.target)) {
        setShowJobSuggestions(false);
      }
      if (locationInputRef.current && !locationInputRef.current.contains(e.target)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredJobs = useMemo(() => {
    if (!jobQuery) return [];
    const q = jobQuery.toLowerCase();
    return uniqueTitles.filter(t => t.toLowerCase().includes(q)).slice(0, 6);
  }, [jobQuery, uniqueTitles]);

  const filteredLocations = useMemo(() => {
    if (!locationQuery) return [];
    const q = locationQuery.toLowerCase();
    return uniqueLocations.filter(l => l.toLowerCase().includes(q)).slice(0, 6);
  }, [locationQuery, uniqueLocations]);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (jobQuery) params.append('search', jobQuery);
    if (locationQuery) params.append('location', locationQuery);
    navigate({ pathname: ROUTES.JOBS, search: params.toString() });
  };

  return (
    <div className="stitch-page bg-background text-on-background font-body-md flex flex-col min-h-screen">
      <div>
        <PublicNavBar />

        <main className="flex-grow flex flex-col items-center w-full">
          {/* Hero Section */}
          <section className="w-full bg-surface-container-lowest py-[100px] px-margin-desktop flex flex-col items-center justify-center border-b border-surface-container-high relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #131b2e 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            {/* Decorative gradient blobs — gently float so the hero feels alive. */}
            <motion.div
              aria-hidden="true"
              className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
              style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }}
              animate={reduce ? undefined : { y: [0, -18, 0] }}
              transition={reduce ? undefined : { duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] rounded-full opacity-[0.04] pointer-events-none"
              style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
              animate={reduce ? undefined : { y: [0, 14, 0] }}
              transition={reduce ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            />

            <Stagger className="max-w-[860px] w-full text-center relative z-10" delayChildren={0.05} staggerChildren={0.08}>
                <Stagger.Item>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 text-secondary dark:text-secondary-fixed rounded-full font-label-sm text-label-sm uppercase tracking-wider mb-6 border border-secondary/20">
                    <span className="material-symbols-outlined text-[16px]" data-weight="fill" aria-hidden="true">auto_awesome</span>
                    {t('home.heroBadge')}
                  </div>
                </Stagger.Item>

              <Stagger.Item as="h1">
                <span className="block font-h1 text-[clamp(2.5rem,7vw,4.5rem)] font-bold text-primary mb-stack-md leading-[1.05] tracking-tight">
                  {t('home.heroTitleLine1')}<br />{t('home.heroTitleLine2')}
                </span>
              </Stagger.Item>

              <Stagger.Item as="p">
                <span className="block font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-[640px] mx-auto leading-relaxed">
                  {t('home.heroDescription')}
                </span>
              </Stagger.Item>

              <Stagger.Item>
                <form onSubmit={handleSearch} className="w-full max-w-[760px] mx-auto bg-surface-container-lowest border border-outline-variant rounded-2xl md:rounded-full shadow-md flex flex-col md:flex-row items-stretch p-2 focus-within:border-secondary transition-all gap-2 md:gap-0">
                  <div className="flex-1 flex items-center gap-2 px-4 relative bg-surface-container-lowest md:bg-transparent rounded-xl md:rounded-none py-2 md:py-0" ref={jobInputRef}>
                    <span className="material-symbols-outlined text-outline text-[20px]" aria-hidden="true">search</span>
                    <input
                      className="w-full bg-transparent border-0 outline-none font-body-lg text-body-lg text-on-surface placeholder-on-surface-variant py-2 md:py-3"
                      placeholder={t('home.searchJobPlaceholder')}
                      type="text"
                      value={jobQuery}
                      onChange={(e) => {
                        setJobQuery(e.target.value);
                        setShowJobSuggestions(true);
                      }}
                      onFocus={() => setShowJobSuggestions(true)}
                    />
                    {showJobSuggestions && filteredJobs.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-hover overflow-hidden z-50 py-2">
                        {filteredJobs.map(suggestion => (
                          <li 
                            key={suggestion} 
                            className="px-4 py-2 hover:bg-surface-container-low cursor-pointer text-on-surface transition-colors flex items-center gap-3"
                            onClick={() => {
                              setJobQuery(suggestion);
                              setShowJobSuggestions(false);
                            }}
                          >
                            <span className="material-symbols-outlined text-outline-variant text-[18px]">search</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="w-full md:w-px h-px md:h-8 bg-outline-variant hidden md:block"></div>
                  <div className="flex-1 items-center gap-2 px-4 flex relative bg-surface-container-lowest md:bg-transparent rounded-xl md:rounded-none py-2 md:py-0" ref={locationInputRef}>
                    <span className="material-symbols-outlined text-outline text-[20px]" aria-hidden="true">location_on</span>
                    <input
                      className="w-full bg-transparent border-0 outline-none font-body-lg text-body-lg text-on-surface placeholder-on-surface-variant py-2 md:py-3"
                      placeholder={t('home.searchLocationPlaceholder')}
                      type="text"
                      value={locationQuery}
                      onChange={(e) => {
                        setLocationQuery(e.target.value);
                        setShowLocationSuggestions(true);
                      }}
                      onFocus={() => setShowLocationSuggestions(true)}
                    />
                    {showLocationSuggestions && filteredLocations.length > 0 && (
                      <ul className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-hover overflow-hidden z-50 py-2">
                        {filteredLocations.map(suggestion => (
                          <li 
                            key={suggestion} 
                            className="px-4 py-2 hover:bg-surface-container-low cursor-pointer text-on-surface transition-colors flex items-center gap-3"
                            onClick={() => {
                              setLocationQuery(suggestion);
                              setShowLocationSuggestions(false);
                            }}
                          >
                            <span className="material-symbols-outlined text-outline-variant text-[18px]">location_on</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <motion.button
                    type="submit"
                    whileTap={reduce ? undefined : { scale: 0.96, transition: SPRING_PRESS }}
                    className="w-full md:w-auto px-8 py-3 bg-secondary text-on-secondary font-body-md font-bold rounded-xl md:rounded-full hover:bg-secondary-container transition-colors whitespace-nowrap mt-2 md:mt-0"
                  >
                    {t('home.searchSubmit')}
                  </motion.button>
                </form>
              </Stagger.Item>

              <Stagger.Item>
                <div className="mt-6 flex items-center justify-center gap-2 flex-wrap text-on-surface-variant font-body-md">
                  <span className="text-outline dark:text-white">{t('home.popular')}</span>
                  {popularSearches.map((term) => (
                    <Link key={term} to={`${ROUTES.JOBS}?search=${encodeURIComponent(term)}`} className="px-3 py-1 rounded-full border border-outline-variant hover:border-secondary hover:text-secondary dark:hover:text-secondary-fixed dark:hover:border-secondary-fixed transition-colors text-sm">
                      {term}
                    </Link>
                  ))}
                </div>
              </Stagger.Item>
            </Stagger>
          </section>

          {/* Stats Section */}
          <section className="w-full max-w-container-max-width mx-auto px-margin-desktop py-[48px]">
            <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-[720px] mx-auto" delayChildren={0.05} staggerChildren={0.1}>
              {dynamicStats.map((stat) => (
                <Stagger.Item
                  key={stat.label}
                  className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-xl border border-surface-container-high shadow-ambient transition-shadow"
                  whileHover={reduce ? undefined : { y: -4, boxShadow: '0px 14px 40px rgba(15,23,42,0.12)', transition: { duration: 0.25, ease: EASE } }}
                >
                  <span className="material-symbols-outlined text-secondary text-[28px] mb-2" aria-hidden="true">{stat.icon}</span>
                  <p className="font-h1 text-h1 text-primary">
                    {loading ? (
                      <span className="animate-pulse text-outline-variant">...</span>
                    ) : (
                      <>
                        <AnimatedCounter value={stat.value} />
                        <span aria-hidden="true">{stat.suffix}</span>
                      </>
                    )}
                  </p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">{stat.label}</p>
                </Stagger.Item>
              ))}
            </Stagger>
          </section>

          {/* How It Works Section */}
          <section className="w-full bg-surface-container-low py-[80px] px-margin-desktop border-t border-b border-surface-container-high">
            <div className="max-w-container-max-width mx-auto">
              <Reveal whenInView className="text-center mb-12">
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary mb-2">{t('home.howItWorks.eyebrow')}</p>
                <h2 className="font-h1 text-h1 text-primary mb-stack-sm">{t('home.howItWorks.title')}</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[560px] mx-auto">{t('home.howItWorks.description')}</p>
              </Reveal>
              <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1000px] mx-auto" delayChildren={0.1} staggerChildren={0.1}>
                {HOW_IT_WORKS.map((item) => (
                  <Stagger.Item
                    key={item.step}
                    className="relative bg-surface-container-lowest rounded-xl p-8 border border-surface-container-high shadow-ambient transition-all group"
                    whileHover={reduce ? undefined : { y: -6, boxShadow: '0px 14px 40px rgba(15,23,42,0.12)', transition: { duration: 0.25, ease: EASE } }}
                  >
                    <div className="absolute -top-4 start-8 px-3 py-1 bg-secondary text-on-secondary font-label-sm text-label-sm rounded-full">
                      {t('home.howItWorks.stepLabel')} {item.step}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mb-5 mt-2 group-hover:bg-secondary transition-colors">
                      <span className="material-symbols-outlined text-secondary text-[28px] group-hover:text-on-secondary transition-colors" aria-hidden="true">{item.icon}</span>
                    </div>
                    <h3 className="font-h3 text-h3 text-primary mb-2">{t(`home.howItWorks.steps.${item.key}.title`)}</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">{t(`home.howItWorks.steps.${item.key}.description`)}</p>
                  </Stagger.Item>
                ))}
              </Stagger>
            </div>
          </section>

          {/* Featured Categories Section */}
          <section className="w-full py-[80px] px-margin-desktop">
            <div className="max-w-container-max-width mx-auto">
              <Reveal whenInView className="text-center mb-12">
                <p className="font-label-sm text-label-sm uppercase tracking-widest text-secondary mb-2">{t('home.categories.eyebrow')}</p>
                <h2 className="font-h1 text-h1 text-primary mb-stack-sm">{t('home.categories.title')}</h2>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[560px] mx-auto">{t('home.categories.description')}</p>
              </Reveal>
              <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-[1000px] mx-auto" delayChildren={0.05} staggerChildren={0.05}>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-surface-container-lowest rounded-xl h-40 border border-surface-container-high shadow-sm animate-pulse flex flex-col items-center justify-center p-6">
                      <div className="w-12 h-12 rounded-full bg-surface-container-high mb-3"></div>
                      <div className="h-4 bg-surface-container-high rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-surface-container-high rounded w-1/2"></div>
                    </div>
                  ))
                ) : dynamicCategories.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-on-surface-variant">
                    {t('home.categories.empty')}
                  </div>
                ) : (
                  dynamicCategories.map((cat) => (
                    <Stagger.Item key={cat.label}>
                      <motion.div whileHover={reduce ? undefined : { y: -4, transition: { duration: 0.2, ease: EASE } }}>
                        <Link to={`${ROUTES.JOBS}?category=${encodeURIComponent(cat.label)}`} className="flex flex-col items-center justify-center p-6 bg-surface-container-lowest rounded-xl border border-surface-container-high hover:border-secondary hover:shadow-hover transition-all group cursor-pointer">
                        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary transition-colors">
                          <span className="material-symbols-outlined text-secondary text-[24px] group-hover:text-on-secondary transition-colors" aria-hidden="true">{cat.icon}</span>
                        </div>
                          <h3 className="font-h3 text-h3 text-primary mb-1 text-center">{cat.label}</h3>
                          <p className="font-label-sm text-label-sm text-on-surface-variant">{cat.count}</p>
                        </Link>
                      </motion.div>
                    </Stagger.Item>
                  ))
                )}
              </Stagger>
            </div>
          </section>

          {/* CTA Section */}
          <Reveal whenInView as="section" className="w-full bg-primary-container py-[80px] px-margin-desktop">
            <div className="max-w-[680px] mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-on-primary-fixed-variant/30 font-label-sm text-label-sm text-on-primary-container uppercase tracking-wider mb-6">
                <span className="material-symbols-outlined text-[16px]" aria-hidden="true">rocket_launch</span>
                {t('home.cta.badge')}
              </div>
              <h2 className="font-h1 text-h1 text-on-secondary-container mb-stack-md">
                {t('home.cta.title')}
              </h2>
              <p className="font-body-lg text-body-lg text-secondary-fixed mb-8 max-w-[520px] mx-auto">
                {t('home.cta.description')}
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <motion.div whileTap={reduce ? undefined : { scale: 0.96, transition: SPRING_PRESS }}>
                  <Link to={ROUTES.REGISTER} className="inline-block px-8 py-3.5 bg-secondary text-on-secondary font-h3 text-h3 rounded-lg hover:bg-secondary-container transition-colors shadow-sm">
                    {t('home.cta.createAccount')}
                  </Link>
                </motion.div>
                <motion.div whileTap={reduce ? undefined : { scale: 0.96, transition: SPRING_PRESS }}>
                  <Link to={ROUTES.JOBS} className="inline-block px-8 py-3.5 bg-transparent border border-on-primary-fixed-variant/30 text-on-secondary-container font-h3 text-h3 rounded-lg hover:bg-on-primary-fixed-variant/10 transition-colors">
                    {t('home.cta.browseJobs')}
                  </Link>
                </motion.div>
              </div>
            </div>
          </Reveal>
        </main>
        <PublicFooter />
      </div>
    </div>
  );
}
