import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Dashboard } from './pages/Dashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import UnderwriterDashboard from './pages/UnderwriterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { CaseDetail } from './pages/CaseDetail';
import AdvisorCaseDetail from './components/advisor/AdvisorCaseDetail';
import UnderwriterCaseDetail from './components/underwriter/UnderwriterCaseDetail';
import AdminCaseDetail from './pages/AdminCaseDetail';
import RemoteSignature from './pages/RemoteSignature';
import { AuthProvider, useAuth } from './store/AuthContext';
import { CopilotWidget } from './components/common/CopilotWidget';

const NotFound = () => <div className="p-10"><h1>404 Not Found</h1></div>;

const RoleProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles: string[] }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" />;

  // If role is not allowed, redirect to their home dashboard
  if (role && !allowedRoles.includes(role)) {
    if (role === 'PRODUCER') return <Navigate to="/advisor" replace />;
    if (role === 'UW') return <Navigate to="/underwriter" replace />;
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Redirect to role-specific dashboard
const RoleBasedRedirect = () => {
  const { role } = useAuth();

  if (role === 'PRODUCER') return <Navigate to="/advisor" replace />;
  if (role === 'UW') return <Navigate to="/underwriter" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin" replace />;
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
            <RoleProtectedRoute allowedRoles={['PRODUCER', 'UW', 'USER', 'ADMIN', 'CST']}>
              <RoleBasedRedirect />
            </RoleProtectedRoute>
          } />

          {/* CST Dashboard (Access for everyone? Or just CST? Assuming CST/Admins) */}
          <Route path="/dashboard" element={
            <RoleProtectedRoute allowedRoles={['CST']}>
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

          {/* Admin Routes - Strictly ADMIN */}
          <Route path="/admin" element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/cases/:id" element={
            <RoleProtectedRoute allowedRoles={['ADMIN']}>
              <AdminCaseDetail />
            </RoleProtectedRoute>
          } />

          {/* Generic Case Detail - CST Only - Keeping ADMIN access here too just in case, but they have their own view now */}
          <Route path="/cases/:id" element={
            <RoleProtectedRoute allowedRoles={['CST', 'ADMIN']}>
              <CaseDetail />
            </RoleProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
        <CopilotWidget />
      </Router>
    </AuthProvider>
  );
}

export default App;
