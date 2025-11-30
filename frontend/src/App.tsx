import styles from './components/AppHeader.module.css';
import { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Account/login";
import RegisterPage from "./pages/Account/Register";
import ServicesPage from "./pages/Services/Services";
import SalonsPage from "./pages/Salon/Salons";
import ProtectedRoute from "./pages/ProtectedRoute";
import Forbidden from "./pages/Forbidden";
import StylistsPage from "./pages/Stylists/Stylists";
import BookingsPage from "./pages/Booking/Bookings";
import BookingHistoryPage from "./pages/History/History";
import AppFooter from './pages/Footer/AppFooter';

// Lazy load các trang
const SalonDetailPage = lazy(() => import('./pages/Salon/SalonDetail'));
const EditSalonPage = lazy(() => import('./pages/Salon/EditSalon'));
const NewBookingPage = lazy(() => import('./pages/Booking/NewBooking'));
const AccountPage = lazy(() => import('./pages/Account/Account'));
const NewsPage = lazy(() => import('./pages/New/NewsPage'));
const PaymentPage = lazy(() => import('./pages/Payment/PaymentPage'));
const SupportChatPage = lazy(() => import('./pages/Support/SupportChat'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminSalons = lazy(() => import('./pages/Admin/AdminSalons'));
const AdminBookings = lazy(() => import('./pages/Admin/AdminBookings'));
const AdminBookingDetail = lazy(() => import('./pages/Admin/AdminBookingDetail'));
const AdminPayments = lazy(() => import('./pages/Admin/AdminPayments'));
const AdminPaymentDetail = lazy(() => import('./pages/Admin/AdminPaymentDetail'));
const AdminUsers = lazy(() => import('./pages/Admin/AdminUsers'));
const AdminNews = lazy(() => import('./pages/Admin/AdminNews'));

import { isLoggedIn, clearAuth } from "./store/auth";
import { getMe } from "./api/user";

export default function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (isLoggedIn()) {
      getMe()
        .then(userProfile => {
          setCurrentUser(userProfile);
        })
        .catch(() => {
          clearAuth();
        })
        .finally(() => {
          setLoadingProfile(false);
        });
    } else {
      setLoadingProfile(false);
    }
  }, []);

  if (loadingProfile) {
    return <div>Loading application...</div>;
  }

  const u = currentUser;

  return (
    <BrowserRouter>
      <div className="app-container">
        <header className={styles.header}>
          <Link to="/" className={styles.logo}>Haircut</Link>
          <nav>
            <Link className={styles.navLink} to="/">Trang Chủ</Link>
            <Link className={styles.navLink} to="/salons">Salons</Link>
            {u?.role === 'salon' && <Link className={styles.navLink} to="/services">Services</Link>}
            {u?.role === 'salon' && <Link className={styles.navLink} to="/stylists">Stylists</Link>}
            {u?.role === 'salon' && <Link className={styles.navLink} to="/bookings">Bookings</Link>}
            {u?.role === 'customer' && <Link className={styles.navLink} to="/new-booking">Đặt lịch mới</Link>}
            {u?.role !== 'admin' && <Link className={styles.navLink} to="/payments">Thanh toán</Link>}
            {u?.role !== 'admin' && <Link className={styles.navLink} to="/History">Lịch sử</Link>}
            <Link className={styles.navLink} to="/support">Hỗ trợ</Link>
            {u?.role === 'admin' && <Link className={styles.navLink} to="/admin">Quản Lý</Link>}
            <Link className={styles.navLink} to="/account">Tài khoản</Link>
          </nav>

          <div className={styles.userInfo}>
          {u ? (
          <>
            <img 
              src={u.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name?.charAt(0) || 'U') + '&size=40&background=667eea&color=fff'} 
              alt={u.name || 'Avatar'} 
              className={styles.avatarImage}
              onError={(e) => {
               e.currentTarget.src = 'https://ui-avatars.com/api/?name=U&size=40&background=667eea&color=fff';
              }}
            />
            <button className={styles.logoutButton} onClick={() => { 
               clearAuth(); 
                setCurrentUser(null); 
                location.href = "/login"; 
             }}>Logout</button>
            </>
         ) : (
           <>
             <Link className={styles.authLink} to="/login">Login</Link>
             <Link className={styles.authLink} to="/register">Register</Link>
           </>
         )}
        </div>
        </header>
        <main className={styles.pageContent}>
          <Routes>
            <Route
              path="/"
              element={
                <Suspense fallback={<div>Đang tải trang...</div>}>
                  <NewsPage />
                </Suspense>
              }
            />
            <Route
              path="/news"
              element={
                <Suspense fallback={<div>Đang tải trang...</div>}>
                  <NewsPage />
                </Suspense>
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div>Đang tải tài khoản...</div>}>
                    <AccountPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/services"
              element={
                <ProtectedRoute allow={['admin', 'salon']}>
                  <ServicesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/salons"
              element={
                <ProtectedRoute>
                  <SalonsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stylists"
              element={
                <ProtectedRoute allow={['admin', 'salon']}>
                  <StylistsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute allow={['admin', 'salon']}>
                  <BookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/History"
              element={
                <ProtectedRoute allow={['customer','admin','salon']}>
                  <BookingHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-booking"
              element={
                <ProtectedRoute allow={['admin', 'customer']}>
                  <Suspense fallback={<div>Đang tải trang đặt lịch...</div>}>
                    <NewBookingPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute allow={['customer','admin','salon']}>
                  <Suspense fallback={<div>Đang tải trang thanh toán...</div>}>
                    <PaymentPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute allow={['customer','admin','salon']}>
                  <Suspense fallback={<div>Đang tải trang hỗ trợ...</div>}>
                    <SupportChatPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="/403" element={<Forbidden />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Suspense fallback={<div>Đang tải dashboard...</div>}>
                    <AdminDashboard />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/salons"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Suspense fallback={<div>Đang tải...</div>}>
                    <AdminSalons />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Suspense fallback={<div>Đang tải...</div>}>
                    <AdminBookings />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Suspense fallback={<div>Đang tải...</div>}>
                    <AdminPayments />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments/:id"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Suspense fallback={<div>Đang tải...</div>}>
                    <AdminPaymentDetail />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Suspense fallback={<div>Đang tải...</div>}>
                    <AdminUsers />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/news"
              element={
                <ProtectedRoute allow={['admin']}>
                  <Suspense fallback={<div>Đang tải...</div>}>
                    <AdminNews />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/:id"
              element={
                <ProtectedRoute allow={['admin', 'salon']}>
                  <Suspense fallback={<div>Đang tải...</div>}>
                    <AdminBookingDetail />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/salons/:id"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<div>Đang tải salon...</div>}>
                    <SalonDetailPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/salons/:id/edit"
              element={
                <ProtectedRoute allow={['salon', 'admin']}>
                  <Suspense fallback={<div>Đang tải...</div>}>
                    <EditSalonPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<div>404</div>} />
          </Routes>
        </main>
         <AppFooter />
      </div>
    </BrowserRouter>
  );
}