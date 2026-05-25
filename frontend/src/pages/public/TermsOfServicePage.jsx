import { useTranslation } from 'react-i18next';
import PublicNavBar from '../../components/PublicNavBar';
import PublicFooter from '../../components/PublicFooter';

const SECTIONS = [
  { key: 'account', kind: 'paragraphs', count: 2 },
  { key: 'seeker', kind: 'list', count: 3 },
  { key: 'company', kind: 'paragraphs', count: 2 },
  { key: 'postings', kind: 'list', count: 3 },
  { key: 'limitations', kind: 'paragraphs', count: 2 },
  { key: 'termination', kind: 'paragraphs', count: 2 },
];

export default function TermsOfServicePage() {
  const { t } = useTranslation();
  return (
    <div className={"stitch-page bg-background text-on-surface font-body-lg text-body-lg antialiased flex flex-col min-h-screen"}>
      <div>
        <PublicNavBar />
        <main className="max-w-4xl mx-auto px-gutter py-margin-desktop bg-surface-container-lowest mt-stack-lg mb-stack-lg rounded-xl shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
          <header className="mb-margin-desktop border-b border-outline-variant pb-stack-lg">
            <h1 className="font-h1 text-h1 text-primary mb-stack-sm">{t('terms.title')}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('terms.lastUpdated')}</p>
          </header>
          <section className="space-y-stack-lg font-body-lg text-body-lg text-on-surface-variant">
            {SECTIONS.map((section) => (
              <div key={section.key}>
                <h2 className="font-h2 text-h2 text-primary mb-stack-md">{t(`terms.sections.${section.key}.title`)}</h2>
                {section.kind === 'paragraphs' ? (
                  <>
                    <p className="mb-stack-sm">{t(`terms.sections.${section.key}.p1`)}</p>
                    <p>{t(`terms.sections.${section.key}.p2`)}</p>
                  </>
                ) : (
                  <>
                    <p className="mb-stack-sm">{t(`terms.sections.${section.key}.p1`)}</p>
                    <ul className="list-disc ps-gutter space-y-unit mt-stack-sm text-on-surface-variant">
                      {Array.from({ length: section.count }, (_, i) => (
                        <li key={i}>{t(`terms.sections.${section.key}.bullet${i + 1}`)}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </section>
        </main>
        <PublicFooter />
      </div>

    </div>
  );
}
