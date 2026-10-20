import { create } from 'zustand';

export type PWAPlatform = 'ios' | 'android' | 'desktop-mac' | 'desktop-windows' | 'desktop-other';

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  platform: PWAPlatform;
  deferredPrompt: any;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
  promptInstall: () => Promise<boolean>;
  initPWA: () => () => void;
}

const getPlatform = (): PWAPlatform => {
  if (typeof navigator === 'undefined') return 'desktop-other';
  const ua = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|mac os x/.test(ua)) return 'desktop-mac';
  if (/windows/.test(ua)) return 'desktop-windows';
  return 'desktop-other';
};

const checkStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
};

export const usePWAStore = create<PWAState>((set, get) => ({
  isInstalled: checkStandalone(),
  isInstallable: true,
  platform: getPlatform(),
  deferredPrompt: null,
  isGuideOpen: false,

  setIsGuideOpen: (open: boolean) => set({ isGuideOpen: open }),

  promptInstall: async (): Promise<boolean> => {
    const { deferredPrompt } = get();

    // Immediately open the visual PWA modal for guidance on all devices
    set({ isGuideOpen: true });

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult?.outcome === 'accepted') {
          set({ isInstalled: true, deferredPrompt: null, isGuideOpen: false });
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Native prompt failed or dismissed:', err);
        return false;
      }
    }
    return false;
  },

  initPWA: () => {
    if (typeof window === 'undefined') return () => {};

    const updateStandalone = () => {
      const standalone = checkStandalone();
      set({ isInstalled: standalone });
    };

    updateStandalone();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = () => updateStandalone();
    mediaQuery.addEventListener('change', handleMediaChange);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      set({ deferredPrompt: e, isInstallable: true });
    };

    const handleAppInstalled = () => {
      set({ isInstalled: true, deferredPrompt: null, isGuideOpen: false });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }
}));

if (typeof window !== 'undefined') {
  (window as any).__pwaStore = usePWAStore;
}
