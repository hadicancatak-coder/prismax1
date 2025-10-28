import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

// MFA verification helpers
const MFA_EXPIRY_HOURS = 6;

const getMfaVerificationStatus = (): boolean => {
  const data = localStorage.getItem('mfa_verified');
  if (!data) return false;
  
  try {
    const { verified, timestamp } = JSON.parse(data);
    const hoursPassed = (Date.now() - timestamp) / (1000 * 60 * 60);
    
    if (hoursPassed > MFA_EXPIRY_HOURS) {
      localStorage.removeItem('mfa_verified');
      return false;
    }
    
    return verified;
  } catch {
    return false;
  }
};

const setMfaVerificationStorage = (verified: boolean): void => {
  if (verified) {
    localStorage.setItem('mfa_verified', JSON.stringify({
      verified: true,
      timestamp: Date.now()
    }));
  } else {
    localStorage.removeItem('mfa_verified');
  }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roleLoading: boolean;
  userRole: "admin" | "member" | null;
  mfaVerified: boolean;
  setMfaVerifiedStatus: (verified: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "member" | null>(null);
  const [mfaVerified, setMfaVerified] = useState<boolean>(() => {
    return getMfaVerificationStatus();
  });
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
          localStorage.removeItem('mfa_verified');
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
    setMfaVerificationStorage(verified);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('mfa_verified');
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
