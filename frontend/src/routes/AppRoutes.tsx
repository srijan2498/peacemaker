import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { AppLayout } from '../components/layout/AppLayout';
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ExpensesPage } from '../pages/ExpensesPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';
import { MoneyTrackerPage } from '../pages/MoneyTrackerPage';
import { RemindersPage } from '../pages/RemindersPage';
import { SchedulePage } from '../pages/SchedulePage';
import { NotesPage } from '../pages/NotesPage';
import { RelaxPage } from '../pages/RelaxPage';
import { HealthPage } from '../pages/HealthPage';
import { MembersPage } from '../pages/MembersPage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cozy-bg dark:bg-cozy-darkBg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-3xl bg-cozy-lavender flex items-center justify-center text-2xl animate-bounce">
            🏡
          </div>
          <p className="text-xs font-bold text-cozy-muted animate-pulse">Opening CozyNest...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Public Only Route Guard (e.g. login/register)
const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const { fetchMe, token } = useAuthStore();

  useEffect(() => {
    if (token) {
      fetchMe();
    }
  }, [fetchMe, token]);

  return (
    <Routes>
      {/* Public Pages */}
      <Route
        path="/welcome"
        element={
          <PublicOnlyRoute>
            <LandingPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Authenticated Application Layout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/money-tracker" element={<MoneyTrackerPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/relax" element={<RelaxPage />} />
        <Route path="/health" element={<HealthPage />} />
        <Route path="/members" element={<MembersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Catch All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
