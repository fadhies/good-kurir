import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from 'next-themes';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from "@/components/ui/use-toast";
import TabKeepAlive from '@/components/TabKeepAlive';
import AppBottomNav from '@/components/AppBottomNav';
import { exitApp } from '@/lib/exitApp';
import { popBackHandler } from '@/hooks/useBackHandler';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
// Add page imports here
import AdminRoute from '@/components/AdminRoute';
const OrderTracking = lazy(() => import('@/pages/OrderTracking'));
const BecomeDriver = lazy(() => import('@/pages/BecomeDriver'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminDrivers = lazy(() => import('@/pages/AdminDrivers'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminOrders = lazy(() => import('@/pages/AdminOrders'));
const AdminWithdrawals = lazy(() => import('@/pages/AdminWithdrawals'));
const AdminTariffs = lazy(() => import('@/pages/AdminTariffs'));
const AdminRemittance = lazy(() => import('@/pages/AdminRemittance'));
import ChatNotificationListener from '@/components/ChatNotificationListener';

const TAB_PATHS = new Set(["/", "/pesan", "/pesanan-saya", "/driver", "/driver/dompet"]);

// Directional page transitions: push slides left, pop slides right.
const pageVariants = {
  enter: (dir) => ({ x: dir >= 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir >= 0 ? -40 : 40, opacity: 0 }),
};

function BackHandlerManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;
  const lastBackRef = useRef(0);
  useEffect(() => {
    const onBack = (e) => {
      // Dismiss the topmost open modal/dropdown first, otherwise navigate back / exit.
      if (popBackHandler()) {
        try { e && e.preventDefault && e.preventDefault(); } catch (_) {}
        return;
      }
      const path = pathRef.current;
      if (path && path !== "/") {
        navigate(-1);
        return;
      }
      // On the root tab, require a second back press within 2s before exiting.
      const now = Date.now();
      if (now - lastBackRef.current < 2000) {
        lastBackRef.current = 0;
        exitApp();
      } else {
        lastBackRef.current = now;
        toast({ title: "Tekan kembali sekali lagi untuk keluar", duration: 2000 });
      }
    };
    // Capacitor fires 'backbutton' on document when a listener is registered.
    document.addEventListener("backbutton", onBack, false);
    return () => document.removeEventListener("backbutton", onBack, false);
  }, [navigate, toast]);
  return null;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const location = useLocation();
  const [direction, setDirection] = useState(0);
  const idxRef = useRef(null);

  // Detect push vs pop from the history stack index for directional transitions.
  useEffect(() => {
    const idx = window.history.state?.idx ?? 0;
    if (idxRef.current == null) {
      idxRef.current = idx;
      return;
    }
    if (idx !== idxRef.current) {
      setDirection(idx > idxRef.current ? 1 : -1);
      idxRef.current = idx;
    }
  }, [location.pathname]);

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

  // Tab routes share a stable key so they stay mounted while switching bottom tabs.
  const pageKey = TAB_PATHS.has(location.pathname) ? "tab-shell" : location.pathname;

  // Render the main app
  return (
    <>
    <ChatNotificationListener />
    <BackHandlerManager />
    <div className="overflow-hidden">
    <AnimatePresence mode="wait" custom={direction}>
    <motion.div
      key={pageKey}
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.25, ease: "easeOut" }}
      id="app-scroll"
      className="h-[100dvh] overflow-y-auto overflow-x-hidden overscroll-y-none scrollbar-hide"
    >
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    }>
    <Routes location={location}>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<TabKeepAlive active="home" />} />
        <Route path="/pesan" element={<TabKeepAlive active="pesan" />} />
        <Route path="/pesanan-saya" element={<TabKeepAlive active="pesanan-saya" />} />
        <Route path="/pesanan/:id" element={<OrderTracking />} />
        <Route path="/driver" element={<TabKeepAlive active="driver" />} />
        <Route path="/driver/dompet" element={<TabKeepAlive active="driver-dompet" />} />
        <Route path="/jadi-driver" element={<BecomeDriver />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/driver" element={<AdminDrivers />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/penarikan" element={<AdminWithdrawals />} />
          <Route path="/admin/tarif" element={<AdminTariffs />} />
          <Route path="/admin/setoran" element={<AdminRemittance />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
    </motion.div>
    </AnimatePresence>
    </div>
    <AppBottomNav />
    </>
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