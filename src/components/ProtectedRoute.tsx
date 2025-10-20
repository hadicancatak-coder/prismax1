import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, mfaVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [checkingMfa, setCheckingMfa] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user && !loading) {
      // Check if user has MFA enabled
      supabase
        .from('profiles')
        .select('mfa_enabled')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => {
          setMfaEnabled(data?.mfa_enabled || false);
          setCheckingMfa(false);
        });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Skip MFA check for MFA pages themselves
    if (location.pathname === '/mfa-setup' || location.pathname === '/mfa-verify') {
      return;
    }

    if (!checkingMfa && user && mfaEnabled && !mfaVerified) {
      // User has MFA enabled but hasn't verified yet - redirect to verification
      navigate("/mfa-verify");
    }
  }, [user, mfaEnabled, mfaVerified, checkingMfa, navigate, location]);

  if (loading || checkingMfa) {
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
