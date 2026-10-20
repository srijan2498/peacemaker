import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from 'cozynest-shared';
import { z } from 'zod';
import { api } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';

type LoginFormInputs = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth, fetchMe } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const user = res.data.data?.user || res.data.user;
      const token = res.data.token || res.data.data?.token;
      setAuth(user, token);
      await fetchMe();
      toast.success(res.data.message || 'Welcome back to CozyNest! ☀️');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setValue('email', 'demo@cozynest.app');
    setValue('password', 'cozy123456');
    toast.info('Filled demo credentials! Click Sign In to continue.');
  };

  return (
    <div className="min-h-screen bg-cozy-bg dark:bg-cozy-darkBg flex items-center justify-center p-4 selection:bg-cozy-lavender selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-cozy-darkCard rounded-4xl p-8 border border-purple-100 dark:border-purple-900/40 shadow-soft-lg space-y-6 text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-400 to-cozy-lavender mx-auto flex items-center justify-center text-3xl shadow-soft-sm">
          🏡
        </div>

        <div>
          <h2 className="text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
            Welcome Home
          </h2>
          <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted mt-1">
            Sign in to access your family workspace & personal sanctuary
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@cozynest.app"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-cozy-lavender hover:underline font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" size="lg" isLoading={isLoading}>
            Sign In <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        {/* Demo Shortcut Button */}
        <div className="pt-2 border-t border-purple-50 dark:border-purple-900/20">
          <button
            type="button"
            onClick={fillDemoCredentials}
            className="w-full py-2.5 px-3 rounded-2xl bg-cozy-lavender-soft/60 hover:bg-cozy-lavender-soft dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-cozy-lavender" />
            Fill Demo Family Credentials (1-Click)
          </button>
        </div>

        <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-cozy-lavender hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
