import { useState } from "react";
import api from "../lib/api";

export default function Login() {
  const [email, setEmail] = useState("owner@haircut.test");
  const [password, setPassword] = useState("123456");
  const [msg, setMsg] = useState("");

  async function handleLogin() {
    setMsg("Đang đăng nhập...");
    try {
         const res = await api.post("/auth/login", { email, password });
         localStorage.setItem("token", res.data.token);
         setMsg("Đăng nhập OK");
    } catch (err: any) {
      setMsg(err?.response?.data?.error || "Lỗi đăng nhập");
    }
  }

  return (
    <div>
      <h3>Login</h3>
      <input value={email} onChange={e=>setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button type="button" onClick={handleLogin}>Login</button>
      <div style={{marginTop:8}}>{msg}</div>
    </div>
  );
}
