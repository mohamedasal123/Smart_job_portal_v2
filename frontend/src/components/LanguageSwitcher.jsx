import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', labelKey: 'language.english', short: 'EN' },
  { code: 'ar', labelKey: 'language.arabic', short: 'AR' },
];

export default function LanguageSwitcher({ compact = false, className = '' }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const current = LANGUAGES.find((language) => language.code === i18n.language) || LANGUAGES[0];

  const handleSelect = (code) => {
    if (code !== i18n.language) {
      i18n.changeLanguage(code);
    }
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.label')}
        title={t('language.label')}
        className={[
          'relative inline-flex items-center justify-center gap-1 rounded-full',
          'text-on-surface-variant hover:text-secondary hover:bg-surface-container-low',
          'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
          compact ? 'h-9 px-2' : 'h-10 px-3',
        ].join(' ')}
      >
        <span className="material-symbols-outlined" style={{ fontSize: compact ? 20 : 22 }}>language</span>
        <span className="font-label-sm text-label-sm font-semibold">{current.short}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute end-0 mt-2 w-40 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-md overflow-hidden z-50"
        >
          {LANGUAGES.map((language) => {
            const isCurrent = language.code === current.code;
            return (
              <li key={language.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  onClick={() => handleSelect(language.code)}
                  className={[
                    'w-full flex items-center justify-between gap-2 px-3 py-2 text-start',
                    'font-body-md text-body-md transition-colors',
                    isCurrent
                      ? 'bg-surface-container-low text-secondary font-semibold'
                      : 'text-on-surface hover:bg-surface-container-low',
                  ].join(' ')}
                >
                  <span>{t(language.labelKey)}</span>
                  {isCurrent && (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
