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
  const [mfaVerified, setMfaVerified] = useState(false);
  const navigate = useNavigate();
  const roleCache = useRef<Map<string, "admin" | "member">>(new Map());

  useEffect(() => {
    let mounted = true;
    
    // Check session storage for MFA verification status
    const mfaStatus = sessionStorage.getItem('mfa_verified');
    setMfaVerified(mfaStatus === 'true');
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRoleLoading(true);
        fetchUserRole(session.user.id);
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
        } else {
          setUserRole(null);
          setRoleLoading(false);
          setMfaVerified(false);
          sessionStorage.removeItem('mfa_verified');
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

  const setMfaVerifiedStatus = (verified: boolean) => {
    setMfaVerified(verified);
    if (verified) {
      sessionStorage.setItem('mfa_verified', 'true');
    } else {
      sessionStorage.removeItem('mfa_verified');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    sessionStorage.removeItem('mfa_verified');
    setMfaVerified(false);
    navigate("/auth");
  };

  return { user, session, loading, roleLoading, userRole, mfaVerified, setMfaVerifiedStatus, signOut };
};
