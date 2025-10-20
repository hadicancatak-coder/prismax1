import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, requiresPasswordReset, requiresMfaEnrollment, userRole, mfaTempBypassActive } = useAuth();
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

    // Force MFA enrollment for ALL users (universal enforcement)
    if (requiresMfaEnrollment) {
      navigate("/setup-mfa?reason=mandatory");
      return;
    }

    // Check for temporary bypass - restrict to security routes only
    if (mfaTempBypassActive) {
      const allowedPathsDuringBypass = ['/profile', '/setup-mfa'];
      if (!allowedPathsDuringBypass.some(path => location.pathname.startsWith(path))) {
        navigate("/setup-mfa?reason=bypass-expired");
        return;
      }
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
