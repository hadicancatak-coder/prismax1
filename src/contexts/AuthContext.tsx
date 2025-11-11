import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// MFA session token storage with expiry
const MFA_SESSION_KEY = 'mfa_session_data';

const getMfaSessionToken = (): string | null => {
  const data = localStorage.getItem(MFA_SESSION_KEY);
  if (!data) return null;
  
  try {
    const { token, expiresAt } = JSON.parse(data);
    // Check if expired locally before server validation
    if (new Date(expiresAt) < new Date()) {
      localStorage.removeItem(MFA_SESSION_KEY);
      return null;
    }
    return token;
  } catch {
    return null;
  }
};

const setMfaSessionToken = (token: string | null, expiresAt?: string): void => {
  if (token && expiresAt) {
    localStorage.setItem(MFA_SESSION_KEY, JSON.stringify({ 
      token, 
      expiresAt,
      storedAt: new Date().toISOString()
    }));
  } else {
    localStorage.removeItem(MFA_SESSION_KEY);
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roleLoading: boolean;
  userRole: "admin" | "member" | null;
  mfaVerified: boolean;
  setMfaVerifiedStatus: (verified: boolean, sessionToken?: string, expiresAt?: string) => void;
  validateMfaSession: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [mfaVerified, setMfaVerified] = useState<boolean>(false);
  const [skipNextValidation, setSkipNextValidation] = useState(false);
  const navigate = useNavigate();
  const roleCache = useRef<Map<string, "admin" | "member">>(new Map());

  // Validate MFA session with server
  const validateMfaSession = async (): Promise<boolean> => {
    if (skipNextValidation) {
      console.log('⏭️ Skipping validation (just verified)');
      setSkipNextValidation(false);
      return true;
    }

    const sessionToken = getMfaSessionToken();
    
    console.log('🔍 Validating MFA session:', { 
      hasToken: !!sessionToken, 
      hasUser: !!user 
    });

    if (!sessionToken || !user) {
      console.log('❌ No token or user');
      setMfaVerified(false);
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-mfa-session', {
        body: { 
          action: 'validate',
          sessionToken 
        }
      });

      console.log('📋 Validation response:', { 
        error: error?.message, 
        valid: data?.valid,
        reason: data?.reason,
        sameIp: data?.sameIp 
      });

      if (error || !data?.valid) {
        console.log('❌ Validation failed:', data?.reason || error?.message);
        setMfaSessionToken(null);
        setMfaVerified(false);
        return false;
      }

      console.log('✅ MFA session valid');
      setMfaVerified(true);
      return true;
    } catch (err) {
      console.error('❌ Validation error:', err);
      setMfaSessionToken(null);
      setMfaVerified(false);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setRoleLoading(true);
        fetchUserRole(session.user.id);
        
        // Check if we have a valid session token in localStorage
        const sessionToken = getMfaSessionToken();
        if (sessionToken) {
          console.log('✅ Found MFA session token in localStorage, setting verified=true');
          // Optimistically set to verified if we have a token
          setMfaVerified(true);
          // Then validate in the background
          validateMfaSession();
        } else {
          console.log('❌ No MFA session token found');
          validateMfaSession();
        }
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
          
          // Only validate on initial login, not on every state change
          if (event === 'SIGNED_IN') {
            validateMfaSession();
          }
        } else {
          setUserRole(null);
          setRoleLoading(false);
          setMfaVerified(false);
          setMfaSessionToken(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Periodic MFA validation (every 5 minutes)
  useEffect(() => {
    if (!user || !mfaVerified) return;

    const interval = setInterval(() => {
      validateMfaSession();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, mfaVerified]);

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

  const setMfaVerifiedStatus = (verified: boolean, sessionToken?: string, expiresAt?: string) => {
    console.log('🔐 Setting MFA status:', { verified });
    setMfaVerified(verified);
    if (verified && sessionToken && expiresAt) {
      setMfaSessionToken(sessionToken, expiresAt);
      setSkipNextValidation(true); // Skip immediate re-validation
    } else {
      setMfaSessionToken(null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setMfaSessionToken(null);
    setMfaVerified(false);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        session, 
        loading, 
        roleLoading, 
        userRole, 
        mfaVerified,
        validateMfaSession,
        setMfaVerifiedStatus, 
        signOut 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
