import React from 'react';
import { Card } from '@/components/ui/Card';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-scb-offwhite flex items-center justify-center p-6">
      <Card className="p-8 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-scb-warm/40 text-scb-dark flex items-center justify-center mx-auto">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-scb-dark">Page Not Found</h2>
          <p className="text-xs text-scb-dark-muted mt-1">
            The requested EPCMS portal route does not exist or has been moved.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => navigate('/')}>
          Return to Dashboard
        </Button>
      </Card>
    </div>
  );
};
