import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import Login from "./pages/Login";
import ServicesPage from "./pages/Services";
import ProtectedRoute from "./components/ProtectedRoute";
import Forbidden from "./pages/Forbidden";
import { getUser, clearAuth } from "./store/auth";

export default function App() {
  const u = getUser();
  return (
    <BrowserRouter>
      <div style={{ padding: 24 }}>
        <header style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 16 }}>
          <h1 style={{ margin: 0 }}>Haircut FE (dev)</h1>
          <Link to="/services">Services</Link>
          <div style={{ marginLeft: "auto" }}>
            {u ? (
              <>
                <span style={{ marginRight: 8 }}>{u.email || `UID ${u.uid}`} [{u.role}]</span>
                <button onClick={() => { clearAuth(); location.href = "/login"; }}>Logout</button>
              </>
            ) : null}
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/services"
            element={
              <ProtectedRoute>
                <ServicesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/403" element={<Forbidden />} />
          <Route path="*" element={<div>404</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
