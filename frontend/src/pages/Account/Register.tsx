import { useState } from "react";
import api from "../../api/client";
import "../../components/register.css";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [roleId, setRoleId] = useState(3);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setErr("");

    if (!fullName || !email || !password) {
      setErr("Vui lòng điền đủ thông tin");
      return;
    }
    if (password !== confirm) {
      setErr("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      await api.post("/v1/auth/register", {
        full_name: fullName,
        email,
        password,
        role_id: roleId,
      });
      location.href = "/login?registered=1&email=" + encodeURIComponent(email);
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-glow"></div>

        <div className="register-card">
          <div className="register-header">
            <div className="register-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h2 className="register-title">Đăng ký tài khoản</h2>
            <p className="register-subtitle">Tạo tài khoản để bắt đầu trải nghiệm</p>
          </div>

          <form onSubmit={submit} className="register-form">
            <div className="form-group">
              <label className="form-label">Họ và tên</label>
              <div className="input-wrapper">
                <input
                  className="form-input"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="form-input"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Loại tài khoản</label>
              <div className="input-wrapper">
                <select
                  className="form-input"
                  value={roleId}
                  onChange={(e) => setRoleId(Number(e.target.value))}
                >
                  <option value={3}>👤 Khách hàng (Customer)</option>
                  <option value={2}>🏪 Chủ Salon (Salon Owner)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mật khẩu</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  className="form-input"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Xác nhận mật khẩu</label>
              <div className="input-wrapper">
                <input
                  type="password"
                  className="form-input"
                  placeholder="Nhập lại mật khẩu"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>

            {err && (
              <div className="error-message">
                <p className="error-text">{err}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="register-button">
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Đang xử lý...
                </>
              ) : (
                "Đăng ký"
              )}
            </button>
          </form>

          <div className="register-footer">
            <a href="/login" className="login-link">
              Đã có tài khoản? Đăng nhập
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}