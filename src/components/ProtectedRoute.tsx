import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, securityLoaded, requiresPasswordReset, requiresMfaEnrollment } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for both auth and security data to load
    if (loading || !securityLoaded) return;

    // Not authenticated - redirect to login
    if (!user) {
      navigate("/auth", { replace: true, state: { from: location.pathname } });
      return;
    }

    // Allow access to security-related routes
    const allowedSecurityPaths = ['/auth', '/reset-password', '/setup-mfa', '/profile'];
    const onSecurityPath = allowedSecurityPaths.some(path => location.pathname.startsWith(path));

    // Force password reset before any other action (highest priority)
    if (requiresPasswordReset && !location.pathname.startsWith('/reset-password')) {
      navigate("/reset-password?reason=security-upgrade", { replace: true });
      return;
    }

    // Force MFA enrollment for ALL users who need it
    if (requiresMfaEnrollment && !onSecurityPath && !location.pathname.startsWith('/setup-mfa')) {
      navigate("/setup-mfa?reason=mandatory", { replace: true });
      return;
    }
  }, [user, loading, securityLoaded, requiresPasswordReset, requiresMfaEnrollment, location.pathname, navigate]);

  if (loading || !securityLoaded) {
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
