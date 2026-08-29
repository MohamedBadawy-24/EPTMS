import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center bg-white rounded-lg border border-rose-200 shadow-card max-w-lg mx-auto mt-12 gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-scb-dark">Access Restricted (Admin Only)</h2>
          <p className="text-xs text-scb-dark-muted">
            Your current account role does not have administrative privileges to view this section or perform sensitive audit operations.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
