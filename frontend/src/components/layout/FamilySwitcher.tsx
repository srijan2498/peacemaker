import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import CottageOutlinedIcon from '@mui/icons-material/CottageOutlined';
import { ChevronDown, Plus, Users, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FamilySwitcher: React.FC = () => {
  const { families, activeFamily, setActiveFamily } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-cozy-lavender-soft/60 dark:bg-purple-900/20 hover:bg-cozy-lavender-soft dark:hover:bg-purple-900/40 border border-purple-100 dark:border-purple-800/30 transition-all text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white dark:bg-cozy-darkCard shadow-xs flex items-center justify-center shrink-0">
            {activeFamily?.avatar && !['🏡', '🏠'].includes(activeFamily.avatar) ? (
              <span className="text-sm font-bold text-cozy-lavender">{activeFamily.avatar}</span>
            ) : (
              <CottageOutlinedIcon className="w-4 h-4 text-cozy-lavender" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText truncate group-hover:text-cozy-lavender transition-colors">
              {activeFamily?.name || 'My Family'}
            </h4>
            <span className="text-[10px] text-cozy-muted dark:text-cozy-darkMuted uppercase tracking-wider font-semibold">
              {activeFamily?.role === 'admin' ? 'Family Admin' : 'Member'}
            </span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-cozy-muted group-hover:text-cozy-lavender transition-transform duration-200" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 p-1.5 bg-white dark:bg-cozy-darkCard rounded-2xl shadow-soft-lg border border-purple-100 dark:border-purple-800/40 z-50 animate-in fade-in zoom-in-95 duration-150">
          <p className="px-2.5 py-1 text-[10px] font-bold text-cozy-muted uppercase tracking-wider">
            Your Families
          </p>

          <div className="space-y-0.5 max-h-48 overflow-y-auto my-1">
            {families.map(fam => {
              const isSelected = activeFamily?._id === fam._id;
              return (
                <button
                  key={fam._id}
                  onClick={() => {
                    setActiveFamily(fam);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-cozy-lavender-soft text-purple-800 dark:bg-purple-900/40 dark:text-purple-200'
                      : 'text-cozy-text dark:text-cozy-darkText hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {fam.avatar && !['🏡', '🏠'].includes(fam.avatar) ? (
                      <span className="text-xs font-bold">{fam.avatar}</span>
                    ) : (
                      <CottageOutlinedIcon className="w-4 h-4 text-cozy-lavender" />
                    )}
                    <span className="truncate">{fam.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cozy-lavender shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="pt-1.5 border-t border-purple-100/80 dark:border-purple-900/40 space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/onboarding');
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-cozy-lavender hover:bg-cozy-lavender-soft/60 dark:hover:bg-purple-900/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Create New Family
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/onboarding');
              }}
              className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-cozy-text dark:text-cozy-darkText hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-cozy-muted" />
              Join with Invite Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
