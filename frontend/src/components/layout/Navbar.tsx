import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { NotificationDrawer } from './NotificationDrawer';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { usePWA } from '../../hooks/usePWA';

interface NavbarProps {
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const { promptInstall, isInstalled } = usePWA();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Poll notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data;
    },
    refetchInterval: 30000
  });

  const unreadCount = notifData?.unreadCount || 0;

  // Title mapper
  const titles: Record<string, { title: string; subtitle: string }> = {
    '/': { title: 'Family Dashboard', subtitle: 'Household finances and everyday life' },
    '/expenses': { title: 'Family Expenses', subtitle: 'Collaborative household transactions' },
    '/analytics': { title: 'Financial Analytics', subtitle: 'Visual insights, trends & comparisons' },
    '/money-tracker': { title: 'Money Tracker', subtitle: 'Private lent and borrowed records' },
    '/reminders': { title: 'Payment Reminders', subtitle: 'Bills, rent, subscriptions & obligations' },
    '/schedule': { title: 'My Daily Schedule', subtitle: 'Private daily routine and activities' },
    '/notes': { title: 'My Little Notebook', subtitle: 'Private thoughts, lists and memories' },
    '/relax': { title: 'Relax & Unwind', subtitle: 'Calming ambient soundscapes and sleep timer' },
    '/health': { title: 'Health, Wellness & Bill Vault', subtitle: 'Track vitals, medications, household stock & receipts' },
    '/members': { title: 'Family Members', subtitle: 'Collaborators and invitations' },
    '/settings': { title: 'Personal Settings', subtitle: 'Appearance, currency & profile' }
  };

  const current = titles[location.pathname] || { title: 'CozyNest', subtitle: 'A little space for everything' };

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/70 dark:bg-cozy-darkCard/70 backdrop-blur-md border-b border-purple-100/80 dark:border-purple-900/30 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        {/* Mobile Hamburger & Page Titles */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-2xl bg-cozy-lavender-soft/60 text-cozy-text dark:text-cozy-darkText"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div>
            <h2 className="text-base sm:text-lg font-bold text-cozy-text dark:text-cozy-darkText tracking-tight">
              {current.title}
            </h2>
            <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted hidden sm:block">
              {current.subtitle}
            </p>
          </div>
        </div>

        {/* Right Action Icons: Install App, Notification bell, Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              id="pwa-install-nav-btn"
              onClick={promptInstall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all shadow-soft-xs text-xs font-bold"
              title="Install CozyNest as Desktop or Mobile App"
            >
              <DownloadOutlinedIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* Notification Bell */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2.5 rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 text-cozy-text dark:text-cozy-darkText hover:bg-cozy-lavender-soft transition-colors shadow-soft-sm"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-cozy-text dark:text-cozy-darkText" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center px-1 shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 text-cozy-text dark:text-cozy-darkText hover:bg-cozy-lavender-soft transition-colors shadow-soft-sm"
            aria-label="Toggle theme"
            title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-purple-600" />
            )}
          </button>

          {/* User Profile Avatar Link to Settings */}
          {user && (
            <Link
              to="/settings"
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 hover:border-purple-300 dark:hover:border-purple-700 shadow-soft-sm transition-all group shrink-0"
              title="Go to Settings & Profile"
            >
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.fullName || 'Cozy')}`}
                alt={user.fullName}
                className="w-7 h-7 rounded-xl object-cover bg-slate-50 border border-purple-100 dark:border-purple-800 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.fullName || 'Cozy')}`;
                }}
              />
              <span className="hidden md:inline text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate max-w-[85px]">
                {user.nickname || user.fullName.split(' ')[0]}
              </span>
            </Link>
          )}
        </div>
      </header>

      {/* Notification Drawer Modal */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </>
  );
};
