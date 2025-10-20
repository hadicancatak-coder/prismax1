import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, securityLoaded, factorsLoaded, requiresPasswordReset, requiresMfaEnrollment } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Wait for both auth, security data, and MFA factors to load
    if (loading || !securityLoaded || !factorsLoaded) return;

    // Not authenticated - redirect to login
    if (!user) {
      navigate("/auth", { replace: true, state: { from: location.pathname } });
      return;
    }

    // Only force password reset (MFA is now optional)
    if (requiresPasswordReset && !location.pathname.startsWith('/reset-password')) {
      navigate("/reset-password?reason=security-upgrade", { replace: true });
      return;
    }
  }, [user, loading, securityLoaded, factorsLoaded, requiresPasswordReset, location.pathname, navigate]);

  if (loading || !securityLoaded || !factorsLoaded) {
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
