import axios from "axios";
import { getToken, clearAuth } from "../store/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  withCredentials: false,
});

api.interceptors.request.use(cfg => {
  const t = getToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    const status = err?.response?.status;
    if (status === 401) {
      clearAuth();
      location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
