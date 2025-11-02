import { useState } from "react";
import api from "../api/client";
import "../components/register.css"; // ⚠️ nhớ chỉnh lại đường dẫn nếu cần

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      });
      location.href =
        "/login?registered=1&email=" + encodeURIComponent(email);
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25V9m9 0H6m9.75 0v10.5A2.25 2.25 0 0113.5 21h-3a2.25 2.25 0 01-2.25-2.25V9m9 0H6"
                />
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
                  className="form-input"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div> Đang xử lý...
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
