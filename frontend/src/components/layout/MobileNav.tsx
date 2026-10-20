import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Receipt,
  HandCoins,
  CalendarCheck,
  MoreHorizontal,
  PieChart,
  BellRing,
  NotebookPen,
  Headphones,
  HeartPulse,
  Users,
  Settings,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MobileNav: React.FC = () => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const mainTabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Tracker', path: '/money-tracker', icon: HandCoins },
    { name: 'Schedule', path: '/schedule', icon: CalendarCheck }
  ];

  const moreItems = [
    { name: 'Health & Wellness', path: '/health', icon: HeartPulse },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
    { name: 'Reminders', path: '/reminders', icon: BellRing },
    { name: 'Notes', path: '/notes', icon: NotebookPen },
    { name: 'Relax & Unwind', path: '/relax', icon: Headphones },
    { name: 'Family Members', path: '/members', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings }
  ];

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-cozy-darkCard/95 backdrop-blur-md border-t border-purple-100 dark:border-purple-900/40 px-3 py-2 flex items-center justify-around shadow-soft-lg">
        {mainTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 p-1.5 rounded-2xl transition-all ${
                  isActive
                    ? 'text-cozy-lavender font-bold'
                    : 'text-cozy-muted dark:text-cozy-darkMuted hover:text-cozy-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      isActive ? 'bg-cozy-lavender-soft text-cozy-lavender' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] tracking-tight">{tab.name}</span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className="flex flex-col items-center gap-1 p-1.5 rounded-2xl text-cozy-muted hover:text-cozy-text transition-colors"
        >
          <div className="p-1.5 rounded-xl">
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px]">More</span>
        </button>
      </nav>

      {/* Slide-Up Drawer for More Items */}
      <AnimatePresence>
        {isMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full bg-white dark:bg-cozy-darkCard rounded-t-3xl p-6 border-t border-purple-100 dark:border-purple-900/40 z-10 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-2 border-b border-purple-50 dark:border-purple-900/20">
                <h4 className="text-sm font-bold text-cozy-text dark:text-cozy-darkText">All Features</h4>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="p-1 rounded-full text-cozy-muted hover:text-cozy-text"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {moreItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMoreOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                          isActive
                            ? 'bg-cozy-lavender-soft border-purple-300 text-cozy-lavender font-bold'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-purple-50 dark:border-purple-900/20 text-cozy-text dark:text-cozy-darkText'
                        }`
                      }
                    >
                      <div className="p-2 rounded-xl bg-white dark:bg-cozy-darkCard shadow-xs text-cozy-lavender">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
