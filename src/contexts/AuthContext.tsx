import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

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
  validateMfaSession: (currentUser?: User) => Promise<boolean>;
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
  const location = useLocation();
  const roleCache = useRef<Map<string, "admin" | "member">>(new Map());
  const lastActivityTime = useRef<number>(Date.now());

  // Validate MFA session with server - Phase 1: Fix closure race condition
  const validateMfaSession = async (currentUser?: User): Promise<boolean> => {
    const userToCheck = currentUser || user;
    
    if (skipNextValidation) {
      console.log('⏭️ Skipping validation (just verified)');
      setSkipNextValidation(false);
      return true;
    }

    const sessionToken = getMfaSessionToken();
    
    console.log('🔍 Validating MFA session:', { 
      hasToken: !!sessionToken, 
      hasUser: !!userToCheck 
    });

    if (!sessionToken || !userToCheck) {
      console.log('❌ No token or user');
      setMfaVerified(false);
      return false;
    }

    // Phase 3: Check idle time - only validate if user was idle > 30 minutes
    const idleTime = Date.now() - lastActivityTime.current;
    const IDLE_THRESHOLD = 30 * 60 * 1000; // 30 minutes
    
    if (idleTime > IDLE_THRESHOLD) {
      console.log('⏰ User was idle, performing validation');
      lastActivityTime.current = Date.now();
    }

    try {
      const startTime = performance.now();
      
      const { data, error } = await supabase.functions.invoke('manage-mfa-session', {
        body: { 
          action: 'validate',
          sessionToken 
        }
      });

      const validationTime = performance.now() - startTime;
      
      console.log('📋 Validation response:', { 
        error: error?.message, 
        valid: data?.valid,
        reason: data?.reason,
        sameIp: data?.sameIp,
        timeMs: validationTime.toFixed(2)
      });

      if (error || !data?.valid) {
        console.log('❌ Validation failed:', data?.reason || error?.message);
        setMfaSessionToken(null);
        setMfaVerified(false);
        return false;
      }

      // Phase 5: Auto-refresh if expiring soon (< 1 hour remaining)
      if (data?.expiresAt) {
        const expiryTime = new Date(data.expiresAt).getTime();
        const timeRemaining = expiryTime - Date.now();
        const ONE_HOUR = 60 * 60 * 1000;
        
        if (timeRemaining < ONE_HOUR && timeRemaining > 0) {
          console.log('🔄 Session expiring soon, refreshing...');
          try {
            const { data: refreshData } = await supabase.functions.invoke('manage-mfa-session', {
              body: { 
                action: 'refresh',
                sessionToken 
              }
            });
            
            if (refreshData?.sessionToken && refreshData?.expiresAt) {
              setMfaSessionToken(refreshData.sessionToken, refreshData.expiresAt);
              console.log('✅ Session refreshed successfully');
            }
          } catch (refreshErr) {
            console.error('⚠️ Session refresh failed:', refreshErr);
          }
        }
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
          // Then validate in the background - Phase 1: Pass user to prevent closure issue
          validateMfaSession(session.user);
        } else {
          console.log('❌ No MFA session token found');
          validateMfaSession(session.user);
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
          
          // Only validate on initial login, not on every state change - Phase 1: Pass user
          if (event === 'SIGNED_IN') {
            validateMfaSession(session.user);
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

  // Periodic MFA validation (every 5 minutes) - Phase 1: Pass user to prevent closure
  useEffect(() => {
    if (!user || !mfaVerified) return;

    const interval = setInterval(() => {
      validateMfaSession(user);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, mfaVerified]);

  // Phase 6: Enhanced debug logging - State transition tracker
  useEffect(() => {
    console.log('🔐 Auth State Transition:', {
      userId: user?.id?.substring(0, 8),
      email: user?.email,
      mfaVerified,
      hasToken: !!getMfaSessionToken(),
      currentRoute: location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [user, mfaVerified, location.pathname]);

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
