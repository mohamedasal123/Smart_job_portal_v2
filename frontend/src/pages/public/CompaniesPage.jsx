import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PublicNavBar from '../../components/PublicNavBar';
import PublicFooter from '../../components/PublicFooter';
import Reveal from '../../motion/Reveal';
import Stagger from '../../motion/Stagger';
import { EASE, SPRING_PRESS } from '../../motion/variants';
import { getPublicCompanies } from '../../services/publicDataService';

const searchInputClass = 'w-full rounded-2xl border border-outline-variant/80 bg-surface-container-lowest/85 py-3.5 ps-12 pe-4 text-on-surface shadow-sm outline-none transition-all duration-300 ease-out placeholder:text-on-surface-variant hover:border-secondary/40 focus:border-secondary focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/25';

export default function CompaniesPage() {
  const { t } = useTranslation();
  const reduce = useReducedMotion();
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    getPublicCompanies().then((data) => {
      setAllCompanies(data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleSearch = () => {
    setActiveSearch(searchQuery);
    setPage(1);
  };

  const filteredCompanies = allCompanies.filter(c => {
    if (!activeSearch) return true;
    const s = activeSearch.toLowerCase();
    return c.name?.toLowerCase().includes(s) || c.industry?.toLowerCase().includes(s) || c.location?.toLowerCase().includes(s);
  });
  const visibleCompanies = filteredCompanies.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const lastPage = Math.ceil(filteredCompanies.length / itemsPerPage);

  return (
    <div className="stitch-page flex min-h-screen flex-col bg-background text-on-background font-body-md text-body-md">
      <PublicNavBar />

      <main className="relative isolate flex-grow overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-160px] top-[-130px] h-[380px] w-[380px] rounded-full bg-secondary/10 blur-3xl"
          animate={reduce ? undefined : { y: [0, -16, 0], opacity: [0.65, 0.9, 0.65] }}
          transition={reduce ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[12%] left-[-180px] h-[420px] w-[420px] rounded-full bg-tertiary/10 blur-3xl"
          animate={reduce ? undefined : { y: [0, 18, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={reduce ? undefined : { duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-container flex-col gap-6 px-4 py-6 sm:px-gutter lg:px-margin-desktop lg:py-margin-desktop">
          <Reveal as="section" className="relative overflow-hidden rounded-[2rem] border border-outline-variant/70 bg-surface-container-lowest/85 p-6 shadow-ambient backdrop-blur-xl sm:p-8 lg:p-10">
            <div aria-hidden="true" className="absolute inset-px rounded-[1.95rem] bg-gradient-to-br from-white/70 via-transparent to-secondary/10 dark:from-white/5 dark:to-secondary/15" />
            <div aria-hidden="true" className="absolute end-8 top-8 h-24 w-24 rounded-full bg-secondary/10 blur-2xl" />

            <div className="relative">
              <p className="mb-stack-sm font-label-sm text-label-sm uppercase tracking-wider text-secondary">{t('companiesPage.eyebrow')}</p>
              <h1 className="mb-stack-sm max-w-4xl break-words font-display text-[clamp(2.25rem,7vw,4rem)] font-bold leading-[1.05] tracking-tight text-primary">{t('companiesPage.title')}</h1>
              <p className="max-w-3xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
                {t('companiesPage.description')}
              </p>

              <Reveal className="mt-gutter grid grid-cols-1 gap-stack-md rounded-[1.5rem] border border-outline-variant/70 bg-surface-container-low/65 p-3 shadow-sm backdrop-blur-xl md:grid-cols-[minmax(0,1fr)_auto]" delay={0.08}>
                <label className="relative min-w-0">
                  <span className="material-symbols-outlined pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                  <input
                    className={searchInputClass}
                    placeholder={t('companiesPage.searchPlaceholder')}
                    type="search"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                </label>
                <motion.button
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-secondary px-gutter py-stack-sm font-h3 text-h3 text-on-secondary shadow-sm transition-all duration-300 ease-out hover:bg-secondary-container hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30 md:w-auto"
                  onClick={handleSearch}
                  type="button"
                  whileHover={reduce ? undefined : { y: -2, transition: { duration: 0.2, ease: EASE } }}
                  whileTap={reduce ? undefined : { scale: 0.97, transition: SPRING_PRESS }}
                >
                  {t('companiesPage.searchButton')}
                </motion.button>
              </Reveal>
            </div>
          </Reveal>

          {loading ? (
            <section className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="min-h-[230px] rounded-[1.5rem] border border-outline-variant/70 bg-surface-container-lowest/85 p-stack-lg shadow-ambient backdrop-blur-xl motion-safe:animate-pulse">
                  <div className="mb-stack-md h-14 w-14 rounded-2xl bg-surface-container-high" />
                  <div className="mb-3 h-6 w-2/3 rounded-full bg-surface-container-high" />
                  <div className="mb-stack-md h-4 w-1/2 rounded-full bg-surface-container-high" />
                  <div className="mt-auto flex items-center justify-between gap-4">
                    <div className="h-4 w-24 rounded-full bg-surface-container-high" />
                    <div className="h-4 w-20 rounded-full bg-surface-container-high" />
                  </div>
                </div>
              ))}
              <span className="sr-only">{t('companiesPage.searchButton')}</span>
            </section>
          ) : filteredCompanies.length === 0 ? (
            <Reveal whenInView className="rounded-[1.5rem] border border-dashed border-outline-variant bg-surface-container-lowest/85 px-6 py-16 text-center shadow-ambient backdrop-blur-xl">
              <span className="material-symbols-outlined mb-4 text-[48px] text-outline">domain_disabled</span>
              <h3 className="font-h3 text-h3 text-primary">{t('companiesPage.emptyTitle')}</h3>
            </Reveal>
          ) : (
            <>
              <Stagger whenInView as="section" className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-3" delayChildren={0.05} staggerChildren={0.06}>
                {visibleCompanies.map((company) => (
                  <Stagger.Item key={company.id} className="h-full rounded-[1.5rem]">
                    <motion.div
                      className="h-full rounded-[1.5rem]"
                      whileHover={reduce ? undefined : { y: -6, transition: { duration: 0.24, ease: EASE } }}
                    >
                      <Link
                        className="group relative flex h-full min-h-[230px] flex-col overflow-hidden rounded-[1.5rem] border border-outline-variant/70 bg-surface-container-lowest/85 p-stack-lg shadow-ambient backdrop-blur-xl outline-none transition-all duration-300 ease-out hover:border-secondary/60 hover:shadow-hover focus-visible:border-secondary focus-visible:ring-2 focus-visible:ring-secondary/30"
                        to={`/companies/${company.id}`}
                      >
                        <span aria-hidden="true" className="pointer-events-none absolute inset-px rounded-[1.45rem] bg-gradient-to-br from-white/70 via-transparent to-secondary/10 opacity-70 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/5 dark:to-secondary/15" />
                        <span aria-hidden="true" className="pointer-events-none absolute end-6 top-6 h-20 w-20 rounded-full bg-secondary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                        <motion.div
                          className="relative mb-stack-md flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-container text-on-primary-container shadow-sm ring-1 ring-outline-variant/70 transition-all duration-300 group-hover:bg-secondary group-hover:text-on-secondary group-hover:ring-secondary/30 group-hover:shadow-hover"
                          whileHover={reduce ? undefined : { scale: 1.06, rotate: -2, transition: { duration: 0.28, ease: EASE } }}
                        >
                          {company.logo ? (
                            <img src={company.logo} alt={company.name} className="h-full w-full object-contain p-1.5 transition-transform duration-300 group-hover:scale-105" />
                          ) : (
                            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>domain</span>
                          )}
                        </motion.div>

                        <h2 className="relative mb-unit min-w-0 break-words font-h2 text-h2 text-primary">{company.name}</h2>
                        <p className="relative min-w-0 break-words font-body-md text-body-md text-on-surface-variant">{company.industry || t('companiesPage.defaultIndustry')}</p>
                        <div className="relative mt-auto flex flex-col gap-3 border-t border-outline-variant/70 pt-stack-md text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
                          <span className="inline-flex min-w-0 items-center gap-1.5 break-words">
                            <span className="material-symbols-outlined shrink-0 text-[16px] text-secondary">location_on</span>
                            {company.location || t('companiesPage.defaultLocation')}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 font-label-md text-label-md text-secondary">
                            {t('companiesPage.openJobs', { count: company.openPositions || 0 })}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  </Stagger.Item>
                ))}
              </Stagger>

              {filteredCompanies.length > itemsPerPage && (
                <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-[1.5rem] border border-outline-variant/70 bg-surface-container-lowest/85 p-4 shadow-sm backdrop-blur-xl sm:flex-row">
                  <motion.button
                    className="w-full rounded-xl border border-outline-variant px-4 py-2 text-primary transition-all duration-200 hover:border-secondary/50 hover:bg-surface-container-low hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    disabled={page <= 1}
                    onClick={() => setPage(p => p - 1)}
                    type="button"
                    whileTap={reduce || page <= 1 ? undefined : { scale: 0.98, transition: SPRING_PRESS }}
                  >
                    {t('companiesPage.pagination.previous')}
                  </motion.button>
                  <span className="font-label-md text-on-surface-variant">{t('companiesPage.pagination.page', { current: page, total: lastPage })}</span>
                  <motion.button
                    className="w-full rounded-xl border border-outline-variant px-4 py-2 text-primary transition-all duration-200 hover:border-secondary/50 hover:bg-surface-container-low hover:text-secondary disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    disabled={page * itemsPerPage >= filteredCompanies.length}
                    onClick={() => setPage(p => p + 1)}
                    type="button"
                    whileTap={reduce || page * itemsPerPage >= filteredCompanies.length ? undefined : { scale: 0.98, transition: SPRING_PRESS }}
                  >
                    {t('companiesPage.pagination.next')}
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
