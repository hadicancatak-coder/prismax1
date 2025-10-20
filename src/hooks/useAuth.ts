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
  const [requiresMfaEnrollment, setRequiresMfaEnrollment] = useState(false);
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaTempBypassActive, setMfaTempBypassActive] = useState(false);
  const navigate = useNavigate();
  const roleCache = useRef<Map<string, "admin" | "member">>(new Map());

  useEffect(() => {
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRoleLoading(true);
        fetchUserRole(session.user.id);
        fetchSecurityStatus(session.user.id);
      }
      
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setRoleLoading(true);
          fetchUserRole(session.user.id);
          fetchSecurityStatus(session.user.id);
        } else {
          setUserRole(null);
          setRoleLoading(false);
          setRequiresPasswordReset(false);
          setRequiresMfaEnrollment(false);
          setMfaEnrolled(false);
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
      setRequiresPasswordReset(profile.force_password_reset);
      setRequiresMfaEnrollment(profile.mfa_enrollment_required && !profile.mfa_enrolled);
      setMfaEnrolled(profile.mfa_enrolled);
      
      // Check if temporary bypass is active
      const bypassUntil = profile.mfa_temp_bypass_until;
      const bypassActive = bypassUntil && new Date(bypassUntil) > new Date();
      setMfaTempBypassActive(bypassActive || false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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
    mfaTempBypassActive
  };
};
