import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from 'next-themes';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here
import AdminRoute from '@/components/AdminRoute';
const Home = lazy(() => import('@/pages/Home'));
const NewOrder = lazy(() => import('@/pages/NewOrder'));
const OrderTracking = lazy(() => import('@/pages/OrderTracking'));
const MyOrders = lazy(() => import('@/pages/MyOrders'));
const DriverDashboard = lazy(() => import('@/pages/DriverDashboard'));
const DriverWallet = lazy(() => import('@/pages/DriverWallet'));
const BecomeDriver = lazy(() => import('@/pages/BecomeDriver'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminDrivers = lazy(() => import('@/pages/AdminDrivers'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminOrders = lazy(() => import('@/pages/AdminOrders'));
const AdminWithdrawals = lazy(() => import('@/pages/AdminWithdrawals'));
import ChatNotificationListener from '@/components/ChatNotificationListener';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Render the main app
  return (
    <AnimatePresence mode="wait">
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
    <ChatNotificationListener />
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    }>
    <Routes location={location}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<Home />} />
        <Route path="/pesan" element={<NewOrder />} />
        <Route path="/pesanan-saya" element={<MyOrders />} />
        <Route path="/pesanan/:id" element={<OrderTracking />} />
        <Route path="/driver" element={<DriverDashboard />} />
        <Route path="/driver/dompet" element={<DriverWallet />} />
        <Route path="/jadi-driver" element={<BecomeDriver />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/driver" element={<AdminDrivers />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/penarikan" element={<AdminWithdrawals />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    </motion.div>
    </AnimatePresence>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App