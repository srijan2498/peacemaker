import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { Home, Users, Sparkles, ArrowRight, Check } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, fetchMe, setActiveFamily } = useAuthStore();

  const [selectedOption, setSelectedOption] = useState<'create' | 'join' | 'personal'>('create');
  const [isLoading, setIsLoading] = useState(false);

  // Create Family Form State
  const [familyName, setFamilyName] = useState('The Happy Home');
  const [familyAvatar, setFamilyAvatar] = useState('🏡');
  const [familyBudget, setFamilyBudget] = useState('50000');
  const [familyCurrency, setFamilyCurrency] = useState(user?.preferredCurrency || 'INR');

  // Join Family Form State
  const [inviteCode, setInviteCode] = useState('');

  const emojiList = ['🏡', '🌿', '🌸', '🌻', '☕', '🍞', '🌈', '🐾', '🎈', '⭐'];

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyName.trim()) {
      toast.error('Please enter a family name.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/families', {
        name: familyName.trim(),
        avatar: familyAvatar,
        monthlyBudget: parseFloat(familyBudget) || 0,
        defaultCurrency: familyCurrency
      });
      await fetchMe();
      toast.success(res.data.message || 'Family workspace created! 🏡');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create family.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
      toast.error('Please enter an invitation code.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/families/join', {
        inviteCode: inviteCode.trim()
      });
      await fetchMe();
      toast.success(res.data.message || 'Successfully joined family! 🏡');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Invalid or expired invitation code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePersonalOnly = () => {
    toast.info('Welcome to your personal space! 🌷 You can join or create a family at any time.');
    navigate('/schedule');
  };

  return (
    <div className="min-h-screen bg-cozy-bg dark:bg-cozy-darkBg flex items-center justify-center p-4 selection:bg-cozy-lavender selection:text-white">
      <div className="w-full max-w-2xl bg-white dark:bg-cozy-darkCard rounded-4xl p-6 sm:p-10 border border-purple-100 dark:border-purple-900/40 shadow-soft-lg space-y-8 text-center">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cozy-lavender-soft text-purple-700 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cozy-lavender" />
            Step 1 of 1: Welcome to CozyNest
          </div>
          <h2 className="text-3xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
            How would you like to begin, {user?.nickname || user?.fullName?.split(' ')[0]}?
          </h2>
          <p className="text-sm text-cozy-muted dark:text-cozy-darkMuted mt-1">
            Choose your preferred workspace mode. You can always change this later.
          </p>
        </div>

        {/* 3 Option Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
          <button
            type="button"
            onClick={() => setSelectedOption('create')}
            className={`p-4 rounded-3xl border text-left transition-all relative ${
              selectedOption === 'create'
                ? 'bg-cozy-lavender-soft/60 border-cozy-lavender ring-2 ring-cozy-lavender/30 shadow-soft-sm'
                : 'bg-slate-50/60 dark:bg-slate-800/40 border-purple-50 dark:border-purple-900/20 hover:border-purple-200'
            }`}
          >
            <div className="text-2xl mb-2">🏡</div>
            <h4 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">Option A</h4>
            <p className="text-xs font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
              Create a Family
            </p>
            <p className="text-[11px] text-cozy-muted dark:text-cozy-darkMuted mt-1 leading-snug">
              Start a new shared household workspace as Admin.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOption('join')}
            className={`p-4 rounded-3xl border text-left transition-all relative ${
              selectedOption === 'join'
                ? 'bg-cozy-lavender-soft/60 border-cozy-lavender ring-2 ring-cozy-lavender/30 shadow-soft-sm'
                : 'bg-slate-50/60 dark:bg-slate-800/40 border-purple-50 dark:border-purple-900/20 hover:border-purple-200'
            }`}
          >
            <div className="text-2xl mb-2">🤝</div>
            <h4 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">Option B</h4>
            <p className="text-xs font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
              Join a Family
            </p>
            <p className="text-[11px] text-cozy-muted dark:text-cozy-darkMuted mt-1 leading-snug">
              Enter an invite code provided by a family member.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOption('personal')}
            className={`p-4 rounded-3xl border text-left transition-all relative ${
              selectedOption === 'personal'
                ? 'bg-cozy-lavender-soft/60 border-cozy-lavender ring-2 ring-cozy-lavender/30 shadow-soft-sm'
                : 'bg-slate-50/60 dark:bg-slate-800/40 border-purple-50 dark:border-purple-900/20 hover:border-purple-200'
            }`}
          >
            <div className="text-2xl mb-2">🌷</div>
            <h4 className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">Option C</h4>
            <p className="text-xs font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
              Personal Space
            </p>
            <p className="text-[11px] text-cozy-muted dark:text-cozy-darkMuted mt-1 leading-snug">
              Start with private schedules, notes, and ambient audio.
            </p>
          </button>
        </div>

        {/* Selected Option Content */}
        <div className="pt-2 text-left">
          {selectedOption === 'create' && (
            <form onSubmit={handleCreateFamily} className="space-y-4 max-w-md mx-auto">
              <Input
                label="Family Workspace Name"
                placeholder="e.g. The Happy Home"
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                  Family Mascot Icon
                </label>
                <div className="flex flex-wrap gap-2">
                  {emojiList.map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setFamilyAvatar(emoji)}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg transition-transform ${
                        familyAvatar === emoji
                          ? 'bg-cozy-lavender text-white scale-110 shadow-soft-sm'
                          : 'bg-slate-100 dark:bg-slate-800 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Monthly Budget Target"
                  type="number"
                  placeholder="50000"
                  value={familyBudget}
                  onChange={e => setFamilyBudget(e.target.value)}
                />
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                    Currency
                  </label>
                  <select
                    value={familyCurrency}
                    onChange={e => setFamilyCurrency(e.target.value)}
                    className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2.5 text-sm text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
                Create Family Workspace <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          )}

          {selectedOption === 'join' && (
            <form onSubmit={handleJoinFamily} className="space-y-4 max-w-md mx-auto">
              <Input
                label="Invitation Code"
                placeholder="e.g. NEST-A4B92C"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value.toUpperCase())}
                hint="Ask your family admin for their shareable invitation code."
                required
              />
              <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading}>
                Join Family <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          )}

          {selectedOption === 'personal' && (
            <div className="space-y-4 max-w-md mx-auto text-center py-4">
              <p className="text-sm text-cozy-muted dark:text-cozy-darkMuted leading-relaxed">
                Enjoy complete peace of mind. Your personal schedules, daily routines, notes, and calming
                audio player are ready to use immediately!
              </p>
              <Button variant="primary" size="lg" className="w-full" onClick={handlePersonalOnly}>
                Enter My Personal Space <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
