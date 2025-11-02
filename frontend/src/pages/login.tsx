import { useState } from "react";
import api from "../api/client";
import { setAuth } from "../store/auth";
import "../components/login.css";

export default function Login() {
  const [email, setEmail] = useState("owner@haircut.test");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.post("/v1/auth/login", { email, password });
      setAuth(data.token, data.user);
      location.href = "/services";
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-glow"></div>
        
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="login-title">Welcome Back</h2>
            <p className="login-subtitle">Đăng nhập để tiếp tục</p>
          </div>

          <form onSubmit={submit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <div className="input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {err && (
              <div className="error-message">
                <p className="error-text">{err}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="login-button">
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>

          <div className="login-footer">
          <a href="#" className="forgot-link">Quên mật khẩu?</a>
          <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.875rem' }}>
           Chưa có tài khoản?{" "}
          <a href="/register" className="register-link" style={{ color: '#a8edea', textDecoration: 'none', fontWeight: '600' }}>
           Đăng ký
           </a>
           </p>
        </div>
        </div>
      </div>
    </div>
  );
}