import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Dashboard } from './pages/Dashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import UnderwriterDashboard from './pages/UnderwriterDashboard';
import { Login } from './pages/Login';
import { CaseDetail } from './pages/CaseDetail';
import AdvisorCaseDetail from './components/advisor/AdvisorCaseDetail';
import UnderwriterCaseDetail from './components/underwriter/UnderwriterCaseDetail';
import RemoteSignature from './pages/RemoteSignature';
import { AuthProvider, useAuth } from './store/AuthContext';

const NotFound = () => <div className="p-10"><h1>404 Not Found</h1></div>;

const RoleProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;

  // If role is not allowed, redirect to their home dashboard
  if (role && !allowedRoles.includes(role)) {
    if (role === 'PRODUCER') return <Navigate to="/advisor" replace />;
    if (role === 'UW') return <Navigate to="/underwriter" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Redirect to role-specific dashboard
const RoleBasedRedirect = () => {
  const { role } = useAuth();

  if (role === 'PRODUCER') return <Navigate to="/advisor" replace />;
  if (role === 'UW') return <Navigate to="/underwriter" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes - No Auth Required */}
          <Route path="/login" element={<Login />} />
          <Route path="/signature/:token" element={<RemoteSignature />} />

          {/* Root Redirect */}
          <Route path="/" element={
            <RoleProtectedRoute allowedRoles={['PRODUCER', 'UW', 'USER']}>
              <RoleBasedRedirect />
            </RoleProtectedRoute>
          } />

          {/* CST Dashboard (Access for everyone? Or just CST? Assuming CST/Admins) */}
          <Route path="/dashboard" element={
            <RoleProtectedRoute allowedRoles={['CST', 'ADMIN']}>
              <Dashboard />
            </RoleProtectedRoute>
          } />

          {/* Advisor Routes - Strictly PRODUCER */}
          <Route path="/advisor" element={
            <RoleProtectedRoute allowedRoles={['PRODUCER']}>
              <AdvisorDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/advisor/cases/:id" element={
            <RoleProtectedRoute allowedRoles={['PRODUCER']}>
              <AdvisorCaseDetail />
            </RoleProtectedRoute>
          } />

          {/* Underwriter Routes - Strictly UW */}
          <Route path="/underwriter" element={
            <RoleProtectedRoute allowedRoles={['UW']}>
              <UnderwriterDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/underwriter/cases/:id" element={
            <RoleProtectedRoute allowedRoles={['UW']}>
              <UnderwriterCaseDetail />
            </RoleProtectedRoute>
          } />

          {/* Generic Case Detail - CST Only */}
          <Route path="/cases/:id" element={
            <RoleProtectedRoute allowedRoles={['CST', 'ADMIN']}>
              <CaseDetail />
            </RoleProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
