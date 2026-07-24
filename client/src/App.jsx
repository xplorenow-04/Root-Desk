import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/layout/AppLayout';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

// Lazy loaded pages for performance code-splitting
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ProjectsPage = lazy(() => import('@/features/projects/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/features/projects/pages/ProjectDetailPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const FavoritesPage = lazy(() => import('@/features/favorites/pages/FavoritesPage'));
const RecentPage = lazy(() => import('@/features/recent/pages/RecentPage'));
const TrashPage = lazy(() => import('@/features/trash/pages/TrashPage'));
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'));
const FlowListPage = lazy(() => import('@/features/automation/pages/FlowListPage'));
const FlowEditorPage = lazy(() => import('@/features/automation/pages/FlowEditorPage'));
const FlowTemplatesPage = lazy(() => import('@/features/automation/pages/FlowTemplatesPage'));
const FlowExecutionDetailPage = lazy(() => import('@/features/automation/pages/FlowExecutionDetailPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
                <Suspense fallback={<LoadingSpinner message="Loading workspace components..." />}>
                  <Routes>
                    {/* Public Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected App Routes */}
                    <Route
                      element={
                        <ProtectedRoute>
                          <AppLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/projects" element={<ProjectsPage />} />
                      <Route path="/projects/:id" element={<ProjectDetailPage />} />
                      <Route path="/favorites" element={<FavoritesPage />} />
                      <Route path="/recent" element={<RecentPage />} />
                      <Route path="/trash" element={<TrashPage />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/automation/flows" element={<FlowListPage />} />
                      <Route path="/automation/flows/:id" element={<FlowEditorPage />} />
                      <Route path="/automation/templates" element={<FlowTemplatesPage />} />
                      <Route path="/automation/executions/:executionId" element={<FlowExecutionDetailPage />} />
                    </Route>

                    {/* Catch-all Redirect */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Suspense>
              </div>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
