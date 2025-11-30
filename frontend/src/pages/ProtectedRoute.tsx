import type { ReactNode } from 'react';
import { Navigate } from "react-router-dom";
import { getUser, isLoggedIn } from "../store/auth";
import type { Role } from "../store/auth";

export default function ProtectedRoute({
  children,
  allow,
}: {
  children: ReactNode;
  allow?: Role[];
}) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const u = getUser();
  if (allow && u && !allow.includes(u.role)) return <Navigate to="/403" replace />;
  return children;
}
