import styles from './components/AppHeader.module.css'; // Import CSS module
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/login";
import RegisterPage from "./pages/register";
import ServicesPage from "./pages/Services";
import SalonsPage from "./pages/Salons";
import ProtectedRoute from "./components/ProtectedRoute";
import Forbidden from "./pages/Forbidden";
import StylistsPage from "./pages/Stylists";
import BookingsPage from "./pages/Bookings";
import BookingHistoryPage from "./pages/BookingHistory";
const SalonDetailPage = lazy(() => import('./pages/SalonDetail'));
const NewBookingPage = lazy(() => import('./pages/NewBooking'));
const AccountPage = lazy(() => import('./pages/Account'));
import { getUser, clearAuth } from "./store/auth";


export default function App() {
  const u = getUser();
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className={styles.header}>
          <h1 className={styles.logo}>Haircut</h1>
          <nav>
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
                <span style={{ marginRight: 8 }}>{u.email || u.name || `ID ${u.id}`} [{u.role}]</span>
                <button className={styles.logoutButton} onClick={() => { clearAuth(); location.href = "/login"; }}>Logout</button>
              </>
            ) : (
              <>
                <Link className={styles.authLink} to="/login">Login</Link>
                <Link className={styles.authLink} to="/register">Register</Link>
              </>
            )}
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/account"
            element={
              <Suspense fallback={<div>Đang tải tài khoản...</div>}>
                <AccountPage />
              </Suspense>
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
              <ProtectedRoute allow={['admin', 'salon']}> {/* Chỉ admin và salon được vào */}
                <StylistsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute allow={['admin', 'salon', 'customer']}> {/* Allow admin, salon and customers */}
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
      </div>
    </BrowserRouter>
  );
}