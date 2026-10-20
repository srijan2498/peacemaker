import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Heart, Sparkles, ShieldCheck, Smile, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cozy-bg dark:bg-cozy-darkBg text-cozy-text dark:text-cozy-darkText selection:bg-cozy-lavender selection:text-white">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-3xl bg-gradient-to-tr from-purple-400 to-cozy-lavender flex items-center justify-center text-2xl shadow-soft-sm">
            🏡
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-purple-700 to-indigo-600 dark:from-purple-300 dark:to-indigo-300 bg-clip-text text-transparent">
              CozyNest
            </h1>
            <p className="text-xs text-cozy-muted font-medium">A little space for everything that matters</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cozy-lavender-soft/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold mb-6 border border-purple-200/50">
          <Sparkles className="w-3.5 h-3.5 text-cozy-lavender animate-spin duration-1000" />
          <span>Warm, gentle, and family-friendly lifestyle management</span>
        </div>

        <h2 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl mx-auto leading-tight">
          Your Family,{' '}
          <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 bg-clip-text text-transparent">
            Beautifully Organized.
          </span>
        </h2>

        <p className="mt-5 text-base sm:text-lg text-cozy-muted dark:text-cozy-darkMuted max-w-2xl mx-auto leading-relaxed">
          Collaboratively manage household finances with your loved ones while keeping your personal
          schedules, private notes, and calming relaxation spaces completely peaceful.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto shadow-soft-md"
          >
            Create Your Family Nest <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <Button
            size="lg"
            variant="secondary"
            onClick={() => {
              // Direct Demo preview access shortcut
              navigate('/login');
            }}
            className="w-full sm:w-auto"
          >
            Explore Live Demo 🌷
          </Button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-7 rounded-3xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 shadow-soft-sm cozy-card">
            <div className="w-12 h-12 rounded-2xl bg-cozy-mint flex items-center justify-center text-2xl mb-4">
              🧾
            </div>
            <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
              Shared Family Finances
            </h3>
            <p className="mt-2 text-xs text-cozy-muted dark:text-cozy-darkMuted leading-relaxed">
              Track grocery bills, utilities, and dining with minor-unit financial precision. See visual
              category breakdowns and member contributions effortlessly.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 shadow-soft-sm cozy-card">
            <div className="w-12 h-12 rounded-2xl bg-cozy-peach flex items-center justify-center text-2xl mb-4">
              🛡️
            </div>
            <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
              Strict Personal Privacy
            </h3>
            <p className="mt-2 text-xs text-cozy-muted dark:text-cozy-darkMuted leading-relaxed">
              Your daily schedule, personal notes, and lent money tracker belong solely to you. Even family
              administrators cannot view your private spaces.
            </p>
          </div>

          <div className="p-7 rounded-3xl bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 shadow-soft-sm cozy-card">
            <div className="w-12 h-12 rounded-2xl bg-cozy-pink flex items-center justify-center text-2xl mb-4">
              🎧
            </div>
            <h3 className="text-base font-bold text-cozy-text dark:text-cozy-darkText">
              Relax & Ambient Sanctuary
            </h3>
            <p className="mt-2 text-xs text-cozy-muted dark:text-cozy-darkMuted leading-relaxed">
              Unwind with procedurally synthesized gentle rain, ocean waves, white noise, and soothing
              chimes with customizable sleep timers.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
