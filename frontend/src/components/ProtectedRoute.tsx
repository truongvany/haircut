import { Navigate } from "react-router-dom";
import { getUser, isLoggedIn, Role } from "../store/auth";

export default function ProtectedRoute({
  children,
  allow,
}: {
  children: JSX.Element;
  allow?: Role[];
}) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  const u = getUser();
  if (allow && u && !allow.includes(u.role)) return <Navigate to="/403" replace />;
  return children;
}
