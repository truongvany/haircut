export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api/v1";

function getToken() {
  return localStorage.getItem("token") || "";
}
function headers(extra: Record<string, string> = {}) {
  const h: Record<string, string> = { "Content-Type": "application/json", ...extra };
  const t = getToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

export async function http<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers: headers(opts.headers as any) });
  if (res.status === 401) {
    // session hết hạn, cho về login
    localStorage.removeItem("token");
    location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const err = await safeJson(res);
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.status === 204 ? (undefined as any) : (await res.json());
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return null; }
}
