import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';

export default function SessionExpiredPage() {
  const { t } = useTranslation();
  return (
    <div className={"stitch-page bg-surface-container-lowest text-on-surface min-h-screen flex flex-col font-sans"}>
      <div>
        {/* Main Content Area */}
        <main className="flex-grow flex items-center justify-center p-gutter">
          <div className="max-w-md w-full text-center px-gutter py-margin-desktop bg-surface-container-lowest rounded-xl">
            <div className="w-20 h-20 mx-auto bg-surface-container rounded-full flex items-center justify-center mb-stack-lg shadow-[0px_4px_20px_rgba(15,23,42,0.05)]">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant" style={{fontVariationSettings: '"FILL" 0'}}>
                lock_clock
              </span>
            </div>
            <h1 className="font-h1 text-h1 text-on-surface mb-stack-sm">{t('auth.sessionExpired.title')}</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg px-4">
              {t('auth.sessionExpired.description')}
            </p>
            <div className="flex flex-col items-center gap-stack-md">
              <Link to={ROUTES.LOGIN} className="w-full sm:w-auto px-margin-desktop py-3 bg-secondary text-on-secondary font-body-md font-bold rounded-lg hover:opacity-80 transition-opacity duration-200 shadow-sm flex items-center justify-center gap-2">
                <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 0'}}>login</span>
                {t('auth.sessionExpired.loginAgain')}
              </Link>
              <Link className="font-body-md text-body-md text-secondary hover:text-on-surface-variant transition-colors duration-200 underline" to={ROUTES.HOME}>
                {t('auth.sessionExpired.returnHome')}
              </Link>
            </div>
          </div>
        </main>
        {/* Footer Component */}
        <footer className="bg-surface-container-lowest border-t border-outline-variant w-full">
          <div className="w-full py-stack-lg px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-width mx-auto gap-stack-md">
            <div className="flex items-center gap-stack-sm">
              <span className="font-h3 text-h3 font-bold text-primary">{t('app.productName')}</span>
              <span className="font-body-md text-body-md text-on-surface-variant">
                {t('footer.copyrightLong')}
              </span>
            </div>
            <nav className="flex flex-wrap justify-center gap-gutter">
              <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" to={ROUTES.PRIVACY}>{t('footer.privacy')}</Link>
              <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" to={ROUTES.TERMS}>{t('footer.terms')}</Link>
              <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" to={ROUTES.HOME}>{t('footer.security')}</Link>
              <Link className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors" to={ROUTES.CONTACT}>{t('footer.help')}</Link>
            </nav>
          </div>
        </footer>
      </div>

    </div>
  );
}
