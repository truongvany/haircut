import axios from "axios";
import { getToken, clearAuth } from "../store/auth";

const api = axios.create({
  // Default to the Apache/backend path used by this project when VITE_API_URL is not set
  baseURL: import.meta.env.VITE_API_URL || "http://localhost/haircut/backend/public/api",
  withCredentials: false,
});

api.interceptors.request.use(cfg => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  console.log(`🚀 API Request: ${cfg.method?.toUpperCase()} ${cfg.baseURL}${cfg.url}`);
  return cfg;
});

api.interceptors.response.use(
  r => {
    console.log(`✅ API Response: ${r.status} ${r.config.url}`, r.data);
    return r;
  },
  err => {
    const status = err?.response?.status;
    console.error(`❌ API Error: ${status} ${err?.config?.url}`, err?.response?.data);
    if (status === 401) {
      clearAuth();
      location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
