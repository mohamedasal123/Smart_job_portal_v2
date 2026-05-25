import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PublicNavBar from '../../components/PublicNavBar';
import PublicFooter from '../../components/PublicFooter';
import { getPublicCompanies } from '../../services/publicDataService';

export default function CompaniesPage() {
  const { t } = useTranslation();
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
  return (
    <div className="stitch-page bg-background text-on-background font-body-md text-body-md min-h-screen">
      <PublicNavBar />

      <main className="max-w-container mx-auto px-gutter py-margin-desktop space-y-gutter">
        <section className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-ambient border border-outline-variant">
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary mb-stack-sm">{t('companiesPage.eyebrow')}</p>
          <h1 className="font-display text-display text-primary mb-stack-sm">{t('companiesPage.title')}</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl">
            {t('companiesPage.description')}
          </p>
          <div className="mt-gutter grid grid-cols-1 md:grid-cols-[1fr_auto] gap-stack-md">
            <label className="relative">
              <span className="material-symbols-outlined absolute start-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg ps-12 pe-4 py-3 focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                placeholder={t('companiesPage.searchPlaceholder')}
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </label>
            <button
              className="bg-secondary text-on-secondary font-h3 text-h3 px-gutter py-stack-sm rounded-lg shadow-sm hover:opacity-90 transition-opacity"
              onClick={handleSearch}
            >
              {t('companiesPage.searchButton')}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <span className="material-symbols-outlined animate-spin text-[48px] text-secondary">progress_activity</span>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-outline text-[48px] mb-4">domain_disabled</span>
            <h3 className="font-h3 text-h3 text-primary mb-2">{t('companiesPage.emptyTitle')}</h3>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              {filteredCompanies.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((company) => (
                <Link
                  className="bg-surface-container-lowest rounded-xl p-stack-lg border border-outline-variant shadow-ambient hover:shadow-hover hover:-translate-y-1 transition-all"
                  key={company.id}
                  to={`/companies/${company.id}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center mb-stack-md overflow-hidden">
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>domain</span>
                    )}
                  </div>
                  <h2 className="font-h2 text-h2 text-primary mb-unit">{company.name}</h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">{company.industry || t('companiesPage.defaultIndustry')}</p>
                  <div className="mt-stack-md flex items-center justify-between text-on-surface-variant">
                    <span>{company.location || t('companiesPage.defaultLocation')}</span>
                    <span className="font-label-md text-label-md text-secondary">{t('companiesPage.openJobs', { count: company.openPositions || 0 })}</span>
                  </div>
                </Link>
              ))}
            </section>

            {filteredCompanies.length > itemsPerPage && (
              <div className="flex justify-between items-center p-4 bg-surface-container-lowest rounded-xl border border-outline-variant mt-4">
                <button className="px-4 py-2 border border-outline-variant rounded-lg text-primary disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t('companiesPage.pagination.previous')}</button>
                <span className="text-on-surface-variant font-label-md">{t('companiesPage.pagination.page', { current: page, total: Math.ceil(filteredCompanies.length / itemsPerPage) })}</span>
                <button className="px-4 py-2 border border-outline-variant rounded-lg text-primary disabled:opacity-50" disabled={page * itemsPerPage >= filteredCompanies.length} onClick={() => setPage(p => p + 1)}>{t('companiesPage.pagination.next')}</button>
              </div>
            )}
          </>
        )}

      </main>
      <PublicFooter />
    </div>
  );
}
