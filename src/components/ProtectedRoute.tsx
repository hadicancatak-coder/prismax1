import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

// Phase 4: Route-based MFA enforcement
const MFA_EXEMPT_ROUTES = [
  '/',
  '/dashboard',
  '/profile',
  '/notifications',
  '/tasks',
  '/backlog',
  '/calendar',
  '/projects',
  '/team',
  '/reports',
  '/about'
];

const MFA_REQUIRED_ROUTES = [
  '/admin',
  '/security',
  '/mfa-setup',
  '/team/users-management'
];

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
      const checkMfaStatus = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('mfa_enabled')
          .eq('user_id', user.id)
          .single();
        
        setMfaEnabled(data?.mfa_enabled || false);
        setCheckingMfa(false);
      };
      
      checkMfaStatus();
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Skip MFA check for MFA pages themselves
    if (location.pathname === '/mfa-setup' || location.pathname === '/mfa-verify') {
      return;
    }

    // Phase 4: Skip MFA re-validation for exempt routes
    const isExemptRoute = MFA_EXEMPT_ROUTES.some(route => 
      location.pathname === route || location.pathname.startsWith(route + '/')
    );
    
    const isRequiredRoute = MFA_REQUIRED_ROUTES.some(route => 
      location.pathname === route || location.pathname.startsWith(route + '/')
    );

    if (!checkingMfa && user && mfaEnabled) {
      // Always require MFA for sensitive routes
      if (isRequiredRoute && !mfaVerified) {
        console.log('🔒 MFA required route, redirecting to verification');
        navigate("/mfa-verify");
        return;
      }
      
      // For exempt routes, allow access even without MFA verification
      if (isExemptRoute) {
        console.log('✅ MFA exempt route, allowing access');
        return;
      }
      
      // For other routes, require MFA if enabled
      if (!mfaVerified) {
        console.log('🔒 MFA enabled but not verified, redirecting');
        navigate("/mfa-verify");
      }
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
