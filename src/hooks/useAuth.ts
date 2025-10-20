import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [requiresPasswordReset, setRequiresPasswordReset] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaRequiredFlag, setMfaRequiredFlag] = useState(false);
  const [mfaTempBypassActive, setMfaTempBypassActive] = useState(false);
  const [securityLoaded, setSecurityLoaded] = useState(false);
  const [factorsLoaded, setFactorsLoaded] = useState(false);
  const [hasTotpFactor, setHasTotpFactor] = useState(false);
  const navigate = useNavigate();
  const roleCache = useRef<Map<string, "admin" | "member">>(new Map());

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRoleLoading(true);
        await Promise.all([
          fetchUserRole(session.user.id),
          fetchSecurityStatus(session.user.id),
          fetchMfaFactors()
        ]);
      } else {
        setSecurityLoaded(true);
        setFactorsLoaded(true);
      }
      
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setRoleLoading(true);
          await Promise.all([
            fetchUserRole(session.user.id),
            fetchSecurityStatus(session.user.id),
            fetchMfaFactors()
          ]);
        } else {
          setUserRole(null);
          setRoleLoading(false);
          setRequiresPasswordReset(false);
          setMfaEnrolled(false);
          setMfaRequiredFlag(false);
          setSecurityLoaded(true);
          setFactorsLoaded(true);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    if (roleCache.current.has(userId)) {
      setUserRole(roleCache.current.get(userId) || null);
      setRoleLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (data) {
      const role = data.role as "admin" | "member";
      setUserRole(role);
      roleCache.current.set(userId, role);
    } else {
      setUserRole(null);
    }
    
    setRoleLoading(false);
  };

  const fetchSecurityStatus = async (userId: string) => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("force_password_reset, mfa_enrolled, mfa_enrollment_required, mfa_temp_bypass_until")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (profile) {
      setRequiresPasswordReset(!!profile.force_password_reset);
      setMfaEnrolled(!!profile.mfa_enrolled);
      setMfaRequiredFlag(!!profile.mfa_enrollment_required);
      
      // Check if temporary bypass is active
      const bypassUntil = profile.mfa_temp_bypass_until;
      const bypassActive = bypassUntil && new Date(bypassUntil) > new Date();
      setMfaTempBypassActive(bypassActive || false);
    } else {
      setRequiresPasswordReset(false);
      setMfaEnrolled(false);
      setMfaRequiredFlag(false);
      setMfaTempBypassActive(false);
    }
    
    setSecurityLoaded(true);
  };

  const fetchMfaFactors = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFactorsLoaded(true);
        return;
      }
      
      const { data: factors } = await supabase.auth.mfa.listFactors();
      setHasTotpFactor(!!(factors?.totp && factors.totp.length > 0));
    } catch (error) {
      console.error("Error fetching MFA factors:", error);
    } finally {
      setFactorsLoaded(true);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Derive requiresMfaEnrollment from the three flags
  const requiresMfaEnrollment = mfaRequiredFlag === true && !(mfaEnrolled === true || hasTotpFactor === true);

  return { 
    user, 
    session, 
    loading, 
    roleLoading, 
    userRole, 
    signOut,
    requiresPasswordReset,
    requiresMfaEnrollment,
    mfaEnrolled,
    mfaTempBypassActive,
    securityLoaded,
    factorsLoaded,
    hasTotpFactor
  };
};
