import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes/AppRoutes';
import { PWAInstallBanner } from './components/pwa/PWAInstallBanner';
import { PWAInstallModal } from './components/pwa/PWAInstallModal';
import { usePWAStore } from './stores/pwaStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60 * 1000 // 1 minute
    }
  }
});

export const App: React.FC = () => {
  useEffect(() => {
    const cleanup = usePWAStore.getState().initPWA();
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <PWAInstallBanner />
        <PWAInstallModal />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              borderRadius: '20px',
              fontFamily: '"Plus Jakarta Sans", Nunito, sans-serif'
            }
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
