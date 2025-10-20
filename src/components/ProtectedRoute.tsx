import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, requiresPasswordReset, requiresMfaEnrollment, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    // Not authenticated - redirect to login
    if (!user) {
      navigate("/auth", { state: { from: location.pathname } });
      return;
    }

    // Allow access to security-related routes
    const allowedPaths = ['/reset-password', '/setup-mfa', '/profile'];
    if (allowedPaths.some(path => location.pathname.startsWith(path))) {
      return;
    }

    // Force password reset before any other action
    if (requiresPasswordReset) {
      navigate("/reset-password?reason=security-upgrade");
      return;
    }

    // Force MFA enrollment for admins (block admin routes only)
    const adminRoutes = ['/admin-panel', '/team'];
    if (requiresMfaEnrollment && adminRoutes.some(route => location.pathname.startsWith(route))) {
      navigate("/setup-mfa?reason=admin-required");
      return;
    }
  }, [user, loading, requiresPasswordReset, requiresMfaEnrollment, userRole, location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};
