import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { PageShell } from '@/components/layout/PageShell';

// Pages
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectsListPage } from '@/pages/ProjectsListPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { ProcurementPage } from '@/pages/ProcurementPage';
import { ContractorsPage } from '@/pages/ContractorsPage';
import { AuditLogPage } from '@/pages/AuditLogPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Application Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <PageShell />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardPage />} />
                  <Route path="projects" element={<ProjectsListPage />} />
                  <Route path="projects/:id" element={<ProjectDetailPage />} />
                  <Route path="procurement" element={<ProcurementPage />} />
                  <Route path="contractors" element={<ContractorsPage />} />

                  {/* Admin-Only Route */}
                  <Route
                    path="audit"
                    element={
                      <AdminRoute>
                        <AuditLogPage />
                      </AdminRoute>
                    }
                  />
                </Route>

                {/* 404 Catch-All */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
