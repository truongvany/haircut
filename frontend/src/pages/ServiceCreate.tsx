import { useState } from "react";
import { api } from "../lib/api";

export default function ServiceCreate() {
  const [name, setName] = useState("Gội đầu VIP");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();               // CHẶN reload
    setMsg("Đang gửi...");
    const token = localStorage.getItem("token") || "";

    try {
      const res = await api.post(
        "/salons/1/services",
        { name, category: "goi", duration_min: 25, base_price: 90000 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg(res.data?.message || "OK");
    } catch (err: any) {
      const status = err?.response?.status;
      const text = err?.response?.data?.error || "Có lỗi xảy ra";
      if (status === 409) setMsg("Tên dịch vụ đã tồn tại. Đổi tên khác nhé.");
      else if (status === 401) setMsg("Hết phiên đăng nhập. Vui lòng login lại.");
      else setMsg(text);
      console.error("ServiceCreate error:", err); // để còn thấy trong console
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Tạo service</h3>
      <form onSubmit={onSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button type="submit">Gửi</button>
      </form>
      <div style={{ marginTop: 8 }}>{msg}</div>
    </div>
  );
}
