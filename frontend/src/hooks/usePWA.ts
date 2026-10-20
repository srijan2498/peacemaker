import { usePWAStore, PWAPlatform } from '../stores/pwaStore';

export type { PWAPlatform };

export interface UsePWAReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  platform: PWAPlatform;
  promptInstall: () => Promise<boolean>;
  isGuideOpen: boolean;
  setIsGuideOpen: (open: boolean) => void;
}

export const usePWA = (): UsePWAReturn => {
  const isInstallable = usePWAStore(s => s.isInstallable);
  const isInstalled = usePWAStore(s => s.isInstalled);
  const platform = usePWAStore(s => s.platform);
  const promptInstall = usePWAStore(s => s.promptInstall);
  const isGuideOpen = usePWAStore(s => s.isGuideOpen);
  const setIsGuideOpen = usePWAStore(s => s.setIsGuideOpen);

  return {
    isInstallable,
    isInstalled,
    platform,
    promptInstall,
    isGuideOpen,
    setIsGuideOpen
  };
};
