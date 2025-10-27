import { useState } from "react";
import api from "../api/client";

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
      await api.post('/v1/auth/register', { full_name: fullName, email, password });
      // Don't auto-login: redirect to login page and let user sign in
      location.href = '/login?registered=1&email=' + encodeURIComponent(email);
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2>Đăng ký tài khoản</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 8 }}>
          <label>Họ và tên</label>
          <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Mật khẩu</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Xác nhận mật khẩu</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} style={{ width: '100%' }} />
        </div>
        {err && <div style={{ color: 'crimson', marginBottom: 8 }}>{err}</div>}
        <button disabled={loading}>{loading ? 'Đang xử lý...' : 'Đăng ký'}</button>
      </form>
    </div>
  );
}
