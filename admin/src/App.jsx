import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import LeadList from './pages/Leads/LeadList';
import ClientList from './pages/Clients/ClientList';
import ProjectList from './pages/Projects/ProjectList';
import QuotationList from './pages/Quotations/QuotationList';
import PaymentList from './pages/Payments/PaymentList';
import MaterialList from './pages/Materials/MaterialList';
import DocumentList from './pages/Documents/DocumentList';
import WarrantyList from './pages/Warranty/WarrantyList';
import CommissionList from './pages/Commissions/CommissionList';
import ReportsPage from './pages/Reports/ReportsPage';
import UserList from './pages/Users/UserList';

const ProtectedRoute = ({ children, perm }) => {
  const { isAuthenticated, loading, hasPermission, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (perm && !isAdmin && !hasPermission(perm)) {
    return (
      <div className="p-8 text-center text-slate-600">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500">
          Your account does not have permission to access the requested module.
        </p>
      </div>
    );
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected Main CRM System */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route
              path="leads"
              element={
                <ProtectedRoute perm="leads">
                  <LeadList />
                </ProtectedRoute>
              }
            />
            <Route
              path="clients"
              element={
                <ProtectedRoute perm="clients">
                  <ClientList />
                </ProtectedRoute>
              }
            />
            <Route
              path="projects"
              element={
                <ProtectedRoute perm="projects">
                  <ProjectList />
                </ProtectedRoute>
              }
            />
            <Route
              path="quotations"
              element={
                <ProtectedRoute perm="quotations">
                  <QuotationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="payments"
              element={
                <ProtectedRoute perm="payments">
                  <PaymentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="materials"
              element={
                <ProtectedRoute perm="materials">
                  <MaterialList />
                </ProtectedRoute>
              }
            />
            <Route
              path="documents"
              element={
                <ProtectedRoute perm="documents">
                  <DocumentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="warranty"
              element={
                <ProtectedRoute perm="warranty">
                  <WarrantyList />
                </ProtectedRoute>
              }
            />
            <Route
              path="commissions"
              element={
                <ProtectedRoute perm="commissions">
                  <CommissionList />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute perm="reports">
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute perm="users">
                  <UserList />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
