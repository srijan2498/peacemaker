import React, { useState, useEffect } from 'react';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { usePWA } from '../../hooks/usePWA';

export const PWAInstallBanner: React.FC = () => {
  const { isInstalled, promptInstall } = usePWA();
  const [isDismissed, setIsDismissed] = useState<boolean>(true);

  useEffect(() => {
    try {
      const dismissedUntil = localStorage.getItem('cozynest_pwa_banner_dismissed');
      if (dismissedUntil && parseInt(dismissedUntil, 10) > Date.now()) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      // Dismiss for 3 days
      localStorage.setItem('cozynest_pwa_banner_dismissed', (Date.now() + 3 * 86400000).toString());
    } catch {}
  };

  // If already running as installed standalone PWA or user dismissed it, don't show the banner
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 max-w-sm sm:max-w-md animate-fade-in">
        <div className="p-4 rounded-3xl bg-white/95 dark:bg-cozy-darkCard/95 backdrop-blur-md border border-indigo-200 dark:border-indigo-900/60 shadow-soft-xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/icons/icon-192.png"
                alt="CozyNest"
                className="w-10 h-10 rounded-2xl shadow-soft-sm object-cover border border-purple-200 dark:border-purple-800 shrink-0"
              />
              <div>
                <h4 className="text-xs font-extrabold text-cozy-text dark:text-cozy-darkText tracking-tight">
                  Install CozyNest App
                </h4>
                <p className="text-[11px] text-cozy-muted">
                  Add to home screen or desktop for 100% offline access & faster speed.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-cozy-muted hover:text-cozy-text dark:hover:text-cozy-darkText p-1 shrink-0"
              title="Dismiss"
            >
              <CloseOutlinedIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-cozy-muted hover:text-cozy-text dark:hover:text-cozy-darkText hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
            >
              Not Now
            </button>
            <button
              id="pwa-install-banner-btn"
              type="button"
              onClick={promptInstall}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-soft-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <DownloadOutlinedIcon className="w-4 h-4" />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
