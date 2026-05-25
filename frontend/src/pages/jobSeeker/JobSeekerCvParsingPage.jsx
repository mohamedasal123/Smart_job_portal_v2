import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../utils/constants';

const STEP_KEYS = ['uploading', 'extracting', 'detecting', 'building', 'generating'];

export default function JobSeekerCvParsingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const timer1 = setTimeout(() => { setProgress(35); setCurrentStep(2); }, 1500);
    const timer2 = setTimeout(() => { setProgress(65); setCurrentStep(3); }, 3000);
    const timer3 = setTimeout(() => { setProgress(90); setCurrentStep(4); }, 5000);
    const timer4 = setTimeout(() => { setProgress(100); setCurrentStep(5); }, 6500);
    const timer5 = setTimeout(() => navigate(ROUTES.SEEKER_CV_REVIEW), 7000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [navigate]);

  return (
    <div className="relative flex flex-col items-center justify-center bg-surface-bright h-[calc(100vh-80px)] overflow-y-auto px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop">
      {/* Background Skeletons (Content Area) */}
      <div className="absolute inset-0 px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-gutter opacity-30 pointer-events-none z-0">
        <div className="col-span-1 space-y-gutter">
          <div className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-sm border border-surface-container">
            <div className="h-6 w-1/3 shimmer rounded mb-stack-md bg-surface-variant/50" />
            <div className="h-24 w-full shimmer rounded-lg mb-stack-md bg-surface-variant/50" />
            <div className="space-y-stack-sm">
              <div className="h-4 w-full shimmer rounded bg-surface-variant/50" />
              <div className="h-4 w-5/6 shimmer rounded bg-surface-variant/50" />
              <div className="h-4 w-4/6 shimmer rounded bg-surface-variant/50" />
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-sm border border-surface-container">
            <div className="h-6 w-1/2 shimmer rounded mb-stack-md bg-surface-variant/50" />
            <div className="flex flex-wrap gap-stack-sm">
              <div className="h-8 w-20 shimmer rounded-full bg-surface-variant/50" />
              <div className="h-8 w-24 shimmer rounded-full bg-surface-variant/50" />
              <div className="h-8 w-16 shimmer rounded-full bg-surface-variant/50" />
              <div className="h-8 w-28 shimmer rounded-full bg-surface-variant/50" />
              <div className="h-8 w-20 shimmer rounded-full bg-surface-variant/50" />
            </div>
          </div>
        </div>
        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-sm border border-surface-container flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-stack-md">
                <div className="h-6 w-2/3 shimmer rounded bg-surface-variant/50" />
                <div className="h-10 w-10 shimmer rounded-full bg-surface-variant/50" />
              </div>
              <div className="h-4 w-1/2 shimmer rounded mb-stack-lg bg-surface-variant/50" />
              <div className="space-y-stack-sm">
                <div className="h-4 w-full shimmer rounded bg-surface-variant/50" />
                <div className="h-4 w-full shimmer rounded bg-surface-variant/50" />
              </div>
            </div>
            <div className="flex justify-between mt-stack-lg pt-stack-md border-t border-surface-container">
              <div className="h-8 w-24 shimmer rounded bg-surface-variant/50" />
              <div className="h-8 w-20 shimmer rounded bg-surface-variant/50" />
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-sm border border-surface-container flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-stack-md">
                <div className="h-6 w-3/4 shimmer rounded bg-surface-variant/50" />
                <div className="h-10 w-10 shimmer rounded-full bg-surface-variant/50" />
              </div>
              <div className="h-4 w-1/3 shimmer rounded mb-stack-lg bg-surface-variant/50" />
              <div className="space-y-stack-sm">
                <div className="h-4 w-full shimmer rounded bg-surface-variant/50" />
                <div className="h-4 w-5/6 shimmer rounded bg-surface-variant/50" />
              </div>
            </div>
            <div className="flex justify-between mt-stack-lg pt-stack-md border-t border-surface-container">
              <div className="h-8 w-20 shimmer rounded bg-surface-variant/50" />
              <div className="h-8 w-24 shimmer rounded bg-surface-variant/50" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-surface-container-lowest rounded-[16px] shadow-lg border border-outline-variant w-full max-w-2xl px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop flex flex-col items-center text-center">
        <div className="relative mb-stack-lg flex items-center justify-center">
          <svg className="absolute w-48 h-48 text-primary/10" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <circle cx={100} cy={100} r={80} stroke="currentColor" strokeDasharray="4 4" strokeWidth={1}>
            </circle>
            <circle cx={100} cy={100} r={60} stroke="currentColor" strokeDasharray="2 4" strokeWidth={1}>
            </circle>
            <path d="M100 20 L100 40 M100 160 L100 180 M20 100 L40 100 M160 100 L180 100 M45 45 L55 55 M145 145 L155 155 M155 45 L145 55 M45 155 L55 145" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
          </svg>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx={50} cy={50} fill="none" r={45} stroke="var(--tw-colors-surface-container)" strokeWidth={8} />
              <circle
                className="transition-all duration-1000 ease-out"
                cx={50} cy={50} fill="none" r={45} stroke="var(--tw-colors-secondary)"
                strokeDasharray={283}
                strokeDashoffset={283 - (283 * progress) / 100}
                strokeLinecap="round" strokeWidth={8}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="font-h2 text-h2 text-primary">{progress}%</span>
            </div>
          </div>
        </div>

        <h2 className="font-h2 text-h2 text-primary mb-stack-sm">{t('seekerCvParsing.title')}</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg mb-margin-desktop">
          {t('seekerCvParsing.subtitle')}
        </p>

        <div className="w-full max-w-md bg-surface rounded-xl p-stack-lg border border-outline-variant text-start">
          <div className="space-y-stack-md">
            {STEP_KEYS.map((stepKey, idx) => {
              const stepNum = idx + 1;
              const isPast = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div key={stepKey} className={`flex items-center gap-stack-md ${currentStep >= stepNum ? 'opacity-100' : 'opacity-50'}`}>
                  {isPast ? (
                    <div className="w-6 h-6 rounded-full bg-success-container/20 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[14px] text-success" data-weight="fill">check_circle</span>
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-full border-2 border-secondary flex items-center justify-center flex-shrink-0 relative bg-surface-container-lowest">
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-outline-variant flex items-center justify-center flex-shrink-0" />
                  )}
                  <span className={`font-body-md text-body-md ${isPast ? 'text-primary font-semibold' : isCurrent ? 'text-secondary font-bold' : 'text-on-surface-variant'}`}>
                    {t(`seekerCvParsing.steps.${stepKey}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-stack-lg flex items-center justify-center gap-stack-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">schedule</span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider">
            {progress < 100 ? t('seekerCvParsing.estimated', { seconds: Math.ceil((100 - progress) / 10) }) : t('seekerCvParsing.completed')}
          </span>
        </div>
      </div>
    </div>
  );
}
