import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema } from '@scb/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shield, Lock, Mail, AlertCircle, KeyRound } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoggingIn, loginError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Client-side validation using @scb/shared Zod schema
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setValidationErrors(fieldErrors);
      return;
    }

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      // Handled via context loginError
    }
  };

  const handleDemoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setValidationErrors({});
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-scb-offwhite">
      {/* Left Branding Side (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0E1B38] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Accent Gradients */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-scb-blue/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />

        {/* Top Logo & Title */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-scb-blue flex items-center justify-center font-black text-white text-xl tracking-wider shadow-lg border border-blue-400/30">
              SCB
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">Suez Canal Bank</h1>
              <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold">Engineering Department</p>
            </div>
          </div>
        </div>

        {/* Center Presentation Text */}
        <div className="relative z-10 space-y-4 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-semibold text-blue-300">
            <Shield className="w-3.5 h-3.5" />
            <span>Bank-Grade Project Governance</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
            Projects Tracking & Management System
          </h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            Data-dense portfolio intelligence, automated RAG health evaluation, procurement monitoring, and 3-layer immutable milestone baselining.
          </p>
        </div>

        {/* Bottom Security Note */}
        <div className="relative z-10 text-xs text-gray-400 flex items-center gap-2 border-t border-white/10 pt-4">
          <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>Internal authorized personnel only. All access attempts are audit-logged.</span>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-3 pb-2 border-b border-scb-warm">
            <div className="w-10 h-10 rounded-lg bg-scb-blue flex items-center justify-center font-black text-white text-base shadow-md">
              SCB
            </div>
            <div>
              <h2 className="text-base font-bold text-scb-dark">Suez Canal Bank</h2>
              <p className="text-[11px] text-scb-dark-muted font-medium">EPCMS Portal</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-scb-dark">Sign In to EPCMS</h2>
            <p className="text-xs text-scb-dark-muted">
              Enter your corporate credentials to access the Project Control Dashboard.
            </p>
          </div>

          {/* Login Error Banner */}
          {loginError && (
            <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Authentication Error</span>
                <span>{loginError}</span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-scb-warm shadow-card">
            <Input
              label="Corporate Email"
              type="email"
              placeholder="user@scb.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={validationErrors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={validationErrors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-semibold shadow-md"
              isLoading={isLoggingIn}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Access Helpers */}
          <div className="bg-scb-warm/20 rounded-lg p-4 border border-scb-warm/60 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-scb-dark">
              <KeyRound className="w-3.5 h-3.5 text-scb-blue" />
              <span>Demo Accounts (Instant Fill):</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@scb.com', 'Admin@1234')}
                className="text-left p-2 rounded-md bg-white border border-scb-warm/80 hover:border-scb-blue transition-colors text-xs space-y-0.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-scb-dark group-hover:text-scb-blue">Admin Role</span>
                  <span className="text-[9px] px-1 bg-indigo-50 text-indigo-700 rounded font-semibold border border-indigo-200">CRUD</span>
                </div>
                <p className="text-[10px] text-scb-dark-muted font-mono truncate">admin@scb.com</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('viewer@scb.com', 'Viewer@1234')}
                className="text-left p-2 rounded-md bg-white border border-scb-warm/80 hover:border-scb-blue transition-colors text-xs space-y-0.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-scb-dark group-hover:text-scb-blue">Viewer Role</span>
                  <span className="text-[9px] px-1 bg-slate-100 text-slate-700 rounded font-semibold border border-slate-200">Read</span>
                </div>
                <p className="text-[10px] text-scb-dark-muted font-mono truncate">viewer@scb.com</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
