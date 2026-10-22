import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, SECURITY_QUESTIONS } from 'cozynest-shared';
import { z } from 'zod';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { User, Mail, Lock, Heart, ArrowRight, HelpCircle, Key } from 'lucide-react';

type RegisterFormInputs = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, fetchMe, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      preferredCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      securityQuestion: SECURITY_QUESTIONS[0],
      securityAnswer: ''
    }
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      const user = res.data.data?.user || res.data.user;
      const token = res.data.token || res.data.data?.token;
      setAuth(user, token);
      await fetchMe();
      toast.success('Welcome to CozyNest! 🌷');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cozy-bg dark:bg-cozy-darkBg flex items-center justify-center p-4 selection:bg-cozy-lavender selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-cozy-darkCard rounded-4xl p-8 border border-purple-100 dark:border-purple-900/40 shadow-soft-lg space-y-6 text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-pink-300 to-purple-400 mx-auto flex items-center justify-center text-3xl shadow-soft-sm">
          🌷
        </div>

        <div>
          <h2 className="text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
            Join CozyNest
          </h2>
          <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted mt-1">
            Create your account to start organizing your home with joy
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <Input
            label="Full Name"
            placeholder="e.g. Sarah Jenkins"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.fullName?.message}
            {...register('fullName')}
          />

          <Input
            label="Preferred Nickname (Optional)"
            placeholder="e.g. Mom, Shrey, Dee"
            leftIcon={<Heart className="w-4 h-4" />}
            error={errors.nickname?.message}
            {...register('nickname')}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="sarah@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="Password (min 6 characters)"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          {/* Security Question Section */}
          <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/80 dark:border-purple-900/40 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cozy-lavender" />
              <span className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                Account Recovery Security Question
              </span>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-cozy-muted dark:text-cozy-darkMuted">
                Select a Question
              </label>
              <select
                {...register('securityQuestion')}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-xl px-3 py-2 text-xs text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                {SECURITY_QUESTIONS.map((q, idx) => (
                  <option key={idx} value={q}>
                    {q}
                  </option>
                ))}
              </select>
              {errors.securityQuestion && (
                <p className="text-[11px] text-red-500">{errors.securityQuestion.message}</p>
              )}
            </div>

            <Input
              label="Your Security Answer"
              placeholder="e.g. Fluffy or Mumbai"
              leftIcon={<Key className="w-3.5 h-3.5" />}
              error={errors.securityAnswer?.message}
              {...register('securityAnswer')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Preferred Currency
              </label>
              <select
                {...register('preferredCurrency')}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2.5 text-sm text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (CA$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-cozy-text dark:text-cozy-darkText">
                Timezone
              </label>
              <select
                {...register('timezone')}
                className="w-full bg-white dark:bg-cozy-darkCard border border-purple-100 dark:border-purple-900/40 rounded-2xl px-3 py-2.5 text-sm text-cozy-text dark:text-cozy-darkText outline-none focus:border-cozy-lavender"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
              </select>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" size="lg" isLoading={isLoading}>
            Create My Nest <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted">
          Already a family member?{' '}
          <Link to="/login" className="font-bold text-cozy-lavender hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};
