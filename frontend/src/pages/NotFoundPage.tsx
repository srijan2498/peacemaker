import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cozy-bg dark:bg-cozy-darkBg flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="text-6xl mb-2 animate-bounce">🏡</div>
        <h2 className="text-3xl font-black text-cozy-text dark:text-cozy-darkText tracking-tight">
          Page Not Found
        </h2>
        <p className="text-xs sm:text-sm text-cozy-muted dark:text-cozy-darkMuted leading-relaxed">
          Looks like this cozy corner doesn't exist. Let's guide you back to the warmth of your family
          home!
        </p>
        <div className="pt-2">
          <Button variant="primary" size="lg" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" /> Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
