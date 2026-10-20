import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { FamilySwitcher } from './FamilySwitcher';
import {
  Home,
  Receipt,
  PieChart,
  HandCoins,
  BellRing,
  CalendarCheck,
  NotebookPen,
  Headphones,
  HeartPulse,
  Users,
  Settings,
  LogOut,
  Sparkles,
  Baby
} from 'lucide-react';
import clsx from 'clsx';
import CottageOutlinedIcon from '@mui/icons-material/CottageOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { usePWA } from '../../hooks/usePWA';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { user, logout, childMode } = useAuthStore();
  const { promptInstall, isInstalled } = usePWA();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Expenses & Cashflow', path: '/expenses', icon: Receipt },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
    { name: 'Health & Wellness', path: '/health', icon: HeartPulse },
    { name: 'Money Tracker', path: '/money-tracker', icon: HandCoins, private: true },
    { name: 'Payment Reminders', path: '/reminders', icon: BellRing },
    { name: 'My Schedule', path: '/schedule', icon: CalendarCheck, private: true },
    { name: 'My Notes', path: '/notes', icon: NotebookPen, private: true },
    { name: 'Relax & Unwind', path: '/relax', icon: Headphones },
    { name: 'Family Members', path: '/members', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  // In child mode, simplify/filter items
  const filteredNavItems = childMode
    ? navItems.filter(item => ['Home', 'Health & Wellness', 'My Schedule', 'My Notes', 'Relax & Unwind', 'Settings'].includes(item.name))
    : navItems;

  return (
    <aside
      className={clsx(
        'hidden md:flex flex-col border-r border-purple-100 dark:border-purple-900/30 bg-white/80 dark:bg-cozy-darkCard/90 backdrop-blur-md transition-all duration-300 z-30 select-none h-screen sticky top-0',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand & Logo */}
      <div className="p-5 pb-4 flex items-center justify-between border-b border-purple-50 dark:border-purple-900/20">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shadow-soft-sm group-hover:scale-105 transition-transform">
            <CottageOutlinedIcon className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
                CozyNest
              </h1>
              <p className="text-[10px] text-cozy-muted dark:text-cozy-darkMuted font-medium leading-none">
                Family Lifestyle
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Child Mode Indicator */}
      {childMode && !isCollapsed && (
        <div className="mx-4 mt-3 p-2 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800/40 rounded-2xl flex items-center gap-2">
          <Baby className="w-4 h-4 text-pink-500 shrink-0" />
          <span className="text-[11px] font-bold text-pink-700 dark:text-pink-300">
            Kid-Friendly Mode Active
          </span>
        </div>
      )}

      {/* Family Switcher */}
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-2">
          <FamilySwitcher />
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {filteredNavItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group relative',
                  isActive
                    ? 'bg-cozy-lavender text-white shadow-soft-sm'
                    : 'text-cozy-text dark:text-cozy-darkText hover:bg-cozy-lavender-soft/70 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={clsx(
                      'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                      isActive ? 'text-white' : 'text-cozy-muted dark:text-cozy-darkMuted group-hover:text-purple-600'
                    )}
                  />
                  {!isCollapsed && (
                    <span className="truncate flex-1 flex items-center justify-between">
                      <span>{item.name}</span>
                      {item.private && !isActive && (
                        <span className="text-[9px] font-bold text-cozy-muted/70 bg-purple-100/50 dark:bg-purple-900/40 px-1.5 py-0.5 rounded-md">
                          Private
                        </span>
                      )}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* PWA Install Button in Sidebar */}
      {!isInstalled && (
        <div className="px-3 pb-2">
          <button
            id="pwa-install-sidebar-btn"
            onClick={promptInstall}
            className={clsx(
              "w-full flex items-center gap-2.5 p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all text-xs font-bold shadow-soft-xs",
              isCollapsed && "justify-center px-0"
            )}
            title="Install CozyNest App"
          >
            <DownloadOutlinedIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            {!isCollapsed && <span className="truncate">Install CozyNest</span>}
          </button>
        </div>
      )}

      {/* User Profile & Logout Bottom Section */}
      <div className="p-3 border-t border-purple-50 dark:border-purple-900/20 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center justify-between p-2 rounded-2xl">
          <div
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.fullName || 'Cozy')}`}
              alt={user?.fullName}
              className="w-8 h-8 rounded-full border-2 border-purple-200 dark:border-purple-700 bg-white object-cover group-hover:scale-105 transition-transform shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user?.fullName || 'Cozy')}`;
              }}
            />
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate group-hover:text-cozy-lavender transition-colors">
                  {user?.nickname || user?.fullName}
                </p>
                <p className="text-[10px] text-cozy-muted truncate">{user?.email}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => logout().then(() => navigate('/login'))}
            className="p-1.5 rounded-xl text-cozy-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
