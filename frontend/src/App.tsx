import styles from './components/AppHeader.module.css';
import { Suspense, lazy, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/login";
import RegisterPage from "./pages/register";
import ServicesPage from "./pages/Services";
import SalonsPage from "./pages/Salons";
import ProtectedRoute from "./components/ProtectedRoute";
import Forbidden from "./pages/Forbidden";
import StylistsPage from "./pages/Stylists";
import BookingsPage from "./pages/Bookings";
import BookingHistoryPage from "./pages/BookingHistory";
import AppFooter from './pages/AppFooter';

// Lazy load các trang
const SalonDetailPage = lazy(() => import('./pages/SalonDetail'));
const NewBookingPage = lazy(() => import('./pages/NewBooking'));
const AccountPage = lazy(() => import('./pages/Account'));
const NewsPage = lazy(() => import('./pages/NewsPage'));

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
        .catch(err => {
          console.error("Failed to fetch user profile:", err);
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
            <Link className={styles.navLink} to="/">Trang Chủ</Link>
            <Link className={styles.navLink} to="/services">Services</Link>
            <Link className={styles.navLink} to="/salons">Salons</Link>
            <Link className={styles.navLink} to="/stylists">Stylists</Link>
            <Link className={styles.navLink} to="/bookings">Bookings</Link>
            <Link className={styles.navLink} to="/new-booking">Đặt lịch mới</Link>
            <Link className={styles.navLink} to="/my-bookings">Lịch sử</Link>
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

        {/* THÊM DIV NÀY ĐỂ TẠO KHOẢNG CÁCH CHO HEADER CỐ ĐỊNH */}
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
                <ProtectedRoute>
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
              path="/my-bookings"
              element={
                <ProtectedRoute allow={['customer','admin','salon']}>
                  <BookingHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-booking"
              element={
                <ProtectedRoute allow={['admin', 'salon', 'customer']}>
                  <Suspense fallback={<div>Đang tải trang đặt lịch...</div>}>
                    <NewBookingPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route path="/403" element={<Forbidden />} />
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
            <Route path="*" element={<div>404</div>} />
          </Routes>
        </main>
         <AppFooter />
      </div>
    </BrowserRouter>
  );
}