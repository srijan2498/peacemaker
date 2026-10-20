import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from 'sonner';
import { Mail, KeyRound, Lock, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.securityQuestion) {
        setSecurityQuestion(res.data.securityQuestion);
        setResetToken(res.data.resetToken || null);
        toast.success('Please answer your security question to set a new password.');
      } else if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
        toast.success('Reset key generated! You can now choose a new password.');
      } else {
        toast.info(res.data.message);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to request reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      const payload: any = { newPassword };
      if (securityQuestion && securityAnswer) {
        payload.email = email;
        payload.securityAnswer = securityAnswer.trim();
      } else if (resetToken) {
        payload.resetToken = resetToken;
      }

      const res = await api.post('/auth/reset-password', payload);
      toast.success(res.data.message || 'Password reset successfully!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  const isStep2 = !!(resetToken || securityQuestion);

  return (
    <div className="min-h-screen bg-cozy-bg dark:bg-cozy-darkBg flex items-center justify-center p-4 selection:bg-cozy-lavender selection:text-white">
      <div className="w-full max-w-md bg-white dark:bg-cozy-darkCard rounded-4xl p-8 border border-purple-100 dark:border-purple-900/40 shadow-soft-lg space-y-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-cozy-lavender-soft mx-auto flex items-center justify-center text-3xl shadow-soft-sm">
          🔑
        </div>

        <div>
          <h2 className="text-2xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
            Password Recovery
          </h2>
          <p className="text-xs text-cozy-muted dark:text-cozy-darkMuted mt-1">
            {isStep2
              ? securityQuestion
                ? 'Answer your security question to set a new password'
                : 'Enter your new password below'
              : 'Enter your registered email address to recover access'}
          </p>
        </div>

        {!isStep2 ? (
          <form onSubmit={handleRequestToken} className="space-y-4 text-left">
            <Input
              label="Account Email"
              type="email"
              placeholder="you@cozynest.app"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={isLoading}>
              Continue Recovery
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-left">
            {securityQuestion && (
              <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2">
                <p className="text-xs font-bold text-cozy-text dark:text-cozy-darkText">
                  Your Security Question:
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 italic">
                  "{securityQuestion}"
                </p>
                <Input
                  label="Your Security Answer"
                  type="text"
                  placeholder="Enter your answer"
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  required
                />
              </div>
            )}

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              hint="Minimum 6 characters"
            />
            <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={isLoading}>
              Save New Password
            </Button>
          </form>
        )}

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cozy-lavender hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
