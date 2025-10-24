import { useState } from "react";
import api from "../api/client";
import { setAuth } from "../store/auth";

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
      // giả định BE trả { token, user: { uid, role, email } }
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
    <div style={{ maxWidth: 360 }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 8 }}>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%" }} />
        </div>
        {err && <div style={{ color: "crimson", marginBottom: 8 }}>{err}</div>}
        <button disabled={loading}>{loading ? "..." : "Login"}</button>
      </form>
    </div>
  );
}
