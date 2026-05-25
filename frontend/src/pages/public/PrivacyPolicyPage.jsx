import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';
import PublicNavBar from '../../components/PublicNavBar';
import PublicFooter from '../../components/PublicFooter';

const NAV_KEYS = ['collection', 'usage', 'sharing', 'security', 'rights', 'cookies'];
const LIST_SECTIONS = ['collection', 'usage', 'sharing', 'rights'];

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('collection');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (let i = NAV_KEYS.length - 1; i >= 0; i--) {
        const element = document.getElementById(NAV_KEYS[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(NAV_KEYS[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getLinkClass = (sectionId) => {
    const isActive = activeSection === sectionId;
    return `flex items-center justify-between px-3 py-2 font-body-md rounded-lg transition-colors border-s-4 ${
      isActive
        ? 'bg-surface-container-low text-primary font-semibold border-[#2563EB]'
        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary border-transparent'
    }`;
  };

  return (
    <div className={"stitch-page bg-background text-on-background font-body-md flex flex-col min-h-screen"}>
      <div>
        <PublicNavBar />
        <main className="flex-grow flex flex-col items-center w-full">
          {/* Hero Section */}
          <section className="w-full bg-surface-container-lowest py-[80px] px-margin-desktop flex flex-col items-center justify-center border-b border-surface-container-high relative overflow-hidden">
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, #131b2e 1px, transparent 0)', backgroundSize: '32px 32px'}}>
            </div>
            <div className="max-w-[800px] w-full text-center relative z-10">
              <h1 className="font-h1 text-h1 text-primary mb-stack-md">{t('privacy.title')}</h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg max-w-[600px] mx-auto">
                {t('privacy.intro')}
              </p>
            </div>
          </section>
          {/* Main Content */}
          <section className="w-full max-w-container-max-width mx-auto px-margin-desktop py-[64px] flex flex-col md:flex-row gap-gutter">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-[280px] shrink-0">
              <div className="sticky top-[100px] bg-surface-container-lowest rounded-xl p-stack-md shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-surface-container-high">
                <h3 className="font-label-sm text-label-sm text-on-surface-variant mb-stack-sm px-3 tracking-widest uppercase">
                  {t('privacy.sectionsHeader')}</h3>
                <nav className="flex flex-col gap-1">
                  {NAV_KEYS.map((key) => (
                    <a key={key} className={getLinkClass(key)} href={`#${key}`} onClick={() => setActiveSection(key)}>
                      {t(`privacy.nav.${key}`)}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
            {/* Privacy Policy Content */}
            <div className="flex-grow max-w-[800px]">
              {NAV_KEYS.map((key) => {
                const isList = LIST_SECTIONS.includes(key);
                const items = isList ? t(`privacy.sections.${key}.items`, { returnObjects: true }) : null;
                const note = key === 'sharing' ? t('privacy.sections.sharing.note') : null;
                return (
                  <div key={key} className="mb-12 scroll-mt-[100px]" id={key}>
                    <h2 className="font-h2 text-h2 text-primary mb-stack-md border-b border-surface-container-high pb-2">
                      {t(`privacy.sections.${key}.heading`)}</h2>
                    <div className="bg-surface-container-lowest rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-surface-container-high p-stack-lg">
                      {isList ? (
                        <>
                          <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                            {t(`privacy.sections.${key}.intro`)}
                          </p>
                          <ul className="list-disc ps-6 space-y-2 text-on-surface-variant font-body-md">
                            {Array.isArray(items) && items.map((item, i) => (
                              <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                            ))}
                          </ul>
                          {note && (
                            <div className="bg-surface-container-low p-4 rounded-lg flex items-start gap-3 mt-4">
                              <span className="material-symbols-outlined text-[#3B82F6] mt-0.5">info</span>
                              <p className="font-body-md text-body-md text-on-surface text-sm">{note}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="font-body-md text-body-md text-on-surface-variant">
                          {t(`privacy.sections.${key}.paragraph`)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          {/* CTA Section */}
          <section className="w-full bg-surface-container-low py-[64px] px-margin-desktop flex flex-col items-center justify-center mt-auto border-t border-surface-container-high">
            <div className="max-w-[600px] text-center bg-surface-container-lowest p-stack-lg rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)] border border-outline-variant relative overflow-hidden">
              <div className="absolute -top-10 -end-10 text-surface-container-high opacity-20 transform rotate-12">
                <span className="material-symbols-outlined text-[120px]">security</span>
              </div>
              <h2 className="font-h2 text-h2 text-primary mb-2 relative z-10">{t('privacy.ctaTitle')}</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-6 relative z-10">{t('privacy.ctaDescription')}</p>
              <Link className="px-6 py-3 bg-transparent border border-outline text-primary font-body-md font-bold rounded-lg hover:bg-surface-container transition-colors relative z-10 flex items-center gap-2 mx-auto w-fit" to={ROUTES.CONTACT}>
                <span className="material-symbols-outlined text-[20px]">mail</span> {t('privacy.ctaButton')}
              </Link>
            </div>
          </section>
        </main>
        <PublicFooter />
      </div>
    </div>
  );
}
