export type Role = "admin" | "salon" | "customer";
export type User = { id: number; role: Role; email?: string; name?: string };

const TOKEN_KEY = "hc_token";
const USER_KEY = "hc_user";

export const getToken = () => localStorage.getItem(TOKEN_KEY) || "";
export const getUser = (): User | null => {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
};

export function setAuth(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export const isLoggedIn = () => !!getToken();
