import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import './App.css';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import PendingApproval from './pages/PendingApproval';

// Retailer Pages
import RetailerDashboard from './pages/retailer/Dashboard';
import CardCatalog from './pages/retailer/CardCatalog';
import OrderForm from './pages/retailer/OrderForm';
import MyOrders from './pages/retailer/MyOrders';
import OrderDetails from './pages/retailer/OrderDetails';
import Profile from './pages/retailer/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import UserApproval from './pages/admin/UserApproval';
import CardManagement from './pages/admin/CardManagement';
import OrderManagement from './pages/admin/OrderManagement';
import AdminOrderDetails from './pages/admin/OrderDetails';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false, requireApproved = true }) => {
  const { user, loading, isAuthenticated, isAdmin, isPending } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireApproved && isPending && !isAdmin) {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
};

// Public Route - redirect if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, isPending, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (isPending) {
      return <Navigate to="/pending-approval" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Router with session_id detection
const AppRouter = () => {
  const location = useLocation();

  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Pending Approval - accessible to pending users */}
      <Route path="/pending-approval" element={
        <ProtectedRoute requireApproved={false}>
          <PendingApproval />
        </ProtectedRoute>
      } />

      {/* Retailer Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <RetailerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/catalog" element={
        <ProtectedRoute>
          <CardCatalog />
        </ProtectedRoute>
      } />
      <Route path="/order/:cardId" element={
        <ProtectedRoute>
          <OrderForm />
        </ProtectedRoute>
      } />
      <Route path="/orders" element={
        <ProtectedRoute>
          <MyOrders />
        </ProtectedRoute>
      } />
      <Route path="/orders/:orderId" element={
        <ProtectedRoute>
          <OrderDetails />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute requireAdmin>
          <UserApproval />
        </ProtectedRoute>
      } />
      <Route path="/admin/cards" element={
        <ProtectedRoute requireAdmin>
          <CardManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute requireAdmin>
          <OrderManagement />
        </ProtectedRoute>
      } />
      <Route path="/admin/orders/:orderId" element={
        <ProtectedRoute requireAdmin>
          <AdminOrderDetails />
        </ProtectedRoute>
      } />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
