import React, { useState, useEffect } from 'react';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';
import LaptopMacOutlinedIcon from '@mui/icons-material/LaptopMacOutlined';
import DevicesOutlinedIcon from '@mui/icons-material/DevicesOutlined';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import WifiOffOutlinedIcon from '@mui/icons-material/WifiOffOutlined';
import { usePWA, PWAPlatform } from '../../hooks/usePWA';
import { usePWAStore } from '../../stores/pwaStore';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface PWAInstallModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  platform?: PWAPlatform;
  isInstallable?: boolean;
  onInstall?: () => Promise<boolean>;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = (props) => {
  const pwa = usePWA();
  const isOpen = props.isOpen !== undefined ? props.isOpen : pwa.isGuideOpen;
  const onClose = props.onClose || (() => pwa.setIsGuideOpen(false));
  const platform = props.platform || pwa.platform;
  const isInstallable = props.isInstallable !== undefined ? props.isInstallable : pwa.isInstallable;

  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>(() => {
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
    return 'desktop';
  });
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      const { deferredPrompt } = usePWAStore.getState();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          usePWAStore.setState({ isInstalled: true, deferredPrompt: null, isGuideOpen: false });
          toast.success('CozyNest installed successfully!');
        }
      } else {
        toast.info('Follow the on-screen steps above to add CozyNest to your device!');
      }
    } catch (err) {
      console.warn('Install trigger error:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div
      id="pwa-install-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-cozy-darkCard p-4 sm:p-6 border border-purple-100 dark:border-purple-900/40 shadow-soft-xl space-y-5 max-h-[calc(100dvh-1.5rem)] overflow-y-auto my-auto flex flex-col">
        {/* Header with App Brand */}
        <div className="flex items-center justify-between pb-3 border-b border-purple-100/60 dark:border-purple-900/30">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192.png"
              alt="CozyNest App"
              className="w-12 h-12 rounded-2xl shadow-soft-md object-cover border border-purple-200 dark:border-purple-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-cozy-text dark:text-cozy-darkText tracking-tight">
                  Install CozyNest
                </h3>
                <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-cozy-muted">
                Install as a native application for offline access & speed
              </p>
            </div>
          </div>

          <button
            id="pwa-modal-close-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-xl text-cozy-muted hover:text-cozy-text dark:hover:text-cozy-darkText hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <CloseOutlinedIcon className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {/* Feature Highlights Pills */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex items-center gap-2">
            <WifiOffOutlinedIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold text-cozy-text dark:text-cozy-darkText text-[11px]">
              100% Offline Capable
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/30 flex items-center gap-2">
            <CheckCircleOutlineOutlinedIcon className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="font-semibold text-cozy-text dark:text-cozy-darkText text-[11px]">
              No App Store Needed
            </span>
          </div>
        </div>

        {/* Device Tabs */}
        <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-purple-100/50 dark:border-purple-900/20">
          <button
            id="pwa-tab-desktop"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('desktop');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'desktop'
                ? 'bg-white dark:bg-cozy-darkCard text-indigo-600 dark:text-indigo-400 shadow-soft-sm'
                : 'text-cozy-muted hover:text-cozy-text'
            }`}
          >
            <LaptopMacOutlinedIcon className="w-4 h-4 pointer-events-none" />
            <span className="pointer-events-none">Desktop</span>
          </button>

          <button
            id="pwa-tab-ios"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('ios');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-cozy-darkCard text-indigo-600 dark:text-indigo-400 shadow-soft-sm'
                : 'text-cozy-muted hover:text-cozy-text'
            }`}
          >
            <PhoneIphoneOutlinedIcon className="w-4 h-4 pointer-events-none" />
            <span className="pointer-events-none">iPhone / iPad</span>
          </button>

          <button
            id="pwa-tab-android"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('android');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'android'
                ? 'bg-white dark:bg-cozy-darkCard text-indigo-600 dark:text-indigo-400 shadow-soft-sm'
                : 'text-cozy-muted hover:text-cozy-text'
            }`}
          >
            <DevicesOutlinedIcon className="w-4 h-4 pointer-events-none" />
            <span className="pointer-events-none">Android</span>
          </button>
        </div>

        {/* Tab 1: Desktop Instructions */}
        {activeTab === 'desktop' && (
          <div className="space-y-3 animate-fade-in text-xs text-cozy-text dark:text-cozy-darkText">
            <p className="text-cozy-muted text-xs">
              Install CozyNest on your Mac, Windows PC, or Chromebook for quick dock access, full-screen mode, and offline performance.
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-black text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <span className="font-bold">Instant 1-Click Installation:</span>
                  <p className="text-cozy-muted text-[11px] mt-0.5">
                    Click the <strong>"Install on Desktop"</strong> button below to open the native browser install prompt.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-black text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <span className="font-bold">Via Browser Address Bar:</span>
                  <p className="text-cozy-muted text-[11px] mt-0.5">
                    Alternatively, click the <strong>Install CozyNest icon</strong> on the right side of your Chrome, Edge, or Brave address bar. On macOS Safari, choose <strong>File → Add to Dock</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-2xl shadow-soft-sm flex items-center justify-center gap-2"
              >
                <DownloadOutlinedIcon className="w-4 h-4" />
                <span>{isInstalling ? 'Installing...' : 'Install on Desktop'}</span>
              </Button>
            </div>
          </div>
        )}

        {/* Tab 2: iPhone / iPad Instructions */}
        {activeTab === 'ios' && (
          <div className="space-y-3 animate-fade-in text-xs text-cozy-text dark:text-cozy-darkText">
            <p className="text-cozy-muted text-xs">
              Follow these simple steps in <strong>Safari</strong> on your iPhone or iPad to install CozyNest directly to your Home Screen:
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <IosShareOutlinedIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold">Step 1: Tap Share</span>
                  <p className="text-cozy-muted text-[11px] mt-0.5">
                    In Safari, tap the <strong>Share</strong> button located at the bottom of the screen.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <AddBoxOutlinedIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold">Step 2: Add to Home Screen</span>
                  <p className="text-cozy-muted text-[11px] mt-0.5">
                    Scroll down through the share options and tap <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircleOutlineOutlinedIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold">Step 3: Tap Add</span>
                  <p className="text-cozy-muted text-[11px] mt-0.5">
                    Tap <strong>Add</strong> in the top-right corner. CozyNest will appear on your home screen with its app icon!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 rounded-2xl py-2.5"
              >
                Got It • Close Guide
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Android Instructions */}
        {activeTab === 'android' && (
          <div className="space-y-3 animate-fade-in text-xs text-cozy-text dark:text-cozy-darkText">
            <p className="text-cozy-muted text-xs">
              Install CozyNest on your Android device via Chrome, Edge, or Samsung Internet:
            </p>

            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-black text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <span className="font-bold">Tap Install App:</span>
                  <p className="text-cozy-muted text-[11px] mt-0.5">
                    Tap the button below to prompt Android to install the application.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-black text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <span className="font-bold">Or Via Browser Menu:</span>
                  <p className="text-cozy-muted text-[11px] mt-0.5">
                    Tap the three dots (⋮) in the top-right corner of Chrome, then select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-2xl shadow-soft-sm flex items-center justify-center gap-2"
              >
                <DownloadOutlinedIcon className="w-4 h-4" />
                <span>{isInstalling ? 'Installing...' : 'Install on Android'}</span>
              </Button>
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-end border-t border-purple-100/40 dark:border-purple-900/20">
          <button
            id="pwa-modal-bottom-close-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-cozy-muted hover:text-cozy-text dark:hover:text-cozy-darkText hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
