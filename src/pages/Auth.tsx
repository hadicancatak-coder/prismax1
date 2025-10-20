import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authSchema } from "@/lib/validationSchemas";
import { z } from "zod";
import { verifyBackupCode } from "@/lib/mfaHelpers";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string>("");
  const [totpCode, setTotpCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleBackupCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (backupCode.length !== 8) {
        throw new Error("Backup code must be 8 digits");
      }

      // First sign in with email/password
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (!data.user) throw new Error("Login failed");

      // Get user's backup codes
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("mfa_backup_codes")
        .eq("user_id", data.user.id)
        .single();

      if (profileError) throw profileError;

      const storedHashes = profile.mfa_backup_codes as string[];
      if (!storedHashes || storedHashes.length === 0) {
        throw new Error("No backup codes available. Please contact support.");
      }

      // Verify the backup code
      const matchIndex = await verifyBackupCode(backupCode, storedHashes);
      if (matchIndex === -1) {
        throw new Error("Invalid backup code");
      }

      // Remove the used code
      const remainingCodes = storedHashes.filter((_, i) => i !== matchIndex);

      // Update profile
      await supabase
        .from("profiles")
        .update({ 
          mfa_backup_codes: remainingCodes,
          // If this was the last code, force re-enrollment
          mfa_enrollment_required: remainingCodes.length === 0
        })
        .eq("user_id", data.user.id);

      // Log backup code usage
      await supabase.from("mfa_backup_code_usage").insert({
        user_id: data.user.id,
        code_hash: storedHashes[matchIndex],
        ip_address: null,
        user_agent: navigator.userAgent
      });

      // Log auth event
      await supabase.from("auth_events").insert({
        user_id: data.user.id,
        event_type: "backup_code_login",
        success: true,
        metadata: { 
          remaining_codes: remainingCodes.length,
          last_code_used: remainingCodes.length === 0
        }
      });

      if (remainingCodes.length === 0) {
        toast({
          title: "Last Backup Code Used",
          description: "You'll need to set up MFA again after login.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: `${remainingCodes.length} backup codes remaining.`,
        });
      }

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or backup code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (useBackupCode) {
      await handleBackupCodeLogin(e);
      return;
    }

    setLoading(true);

    try {
      const validationData = isLogin 
        ? { email, password }
        : { email, password, name };
      
      authSchema.parse(validationData);

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if MFA is required
        if (data.user && !data.session) {
          // MFA is required, get the factor
          const factors = await supabase.auth.mfa.listFactors();
          const totpFactor = factors.data?.totp?.find(f => f.status === 'verified');
          
          if (totpFactor) {
            setMfaRequired(true);
            setMfaFactorId(totpFactor.id);
            setLoading(false);
            return; // Don't navigate yet
          }
        }

        // If we get here, login succeeded without MFA
        toast({
          title: "Welcome back!",
          description: "Successfully logged in.",
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "You can now log in.",
        });
        
        setIsLogin(true);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (totpCode.length !== 6) {
        throw new Error("Please enter a 6-digit code");
      }

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: mfaFactorId,
        code: totpCode,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "Successfully authenticated.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid authentication code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Prisma</h1>
          <p className="text-muted-foreground">
            {isLogin ? (useBackupCode ? "Use backup code" : "Welcome back") : "Create your account"}
          </p>
        </div>

        <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm text-muted-foreground ml-2">
            <strong>Security Notice:</strong> Do not use similar passwords across different platforms. 
            Avoid adding any sensitive or personal information.
          </AlertDescription>
        </Alert>

        {mfaRequired ? (
          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Enter your authenticator code
              </label>
              <Input
                type="text"
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
                autoFocus
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || totpCode.length !== 6}>
              {loading ? "Verifying..." : "Verify"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setMfaRequired(false);
                setMfaFactorId("");
                setTotpCode("");
              }}
            >
              Back to login
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {isLogin && useBackupCode && (
              <div>
                <Input
                  type="text"
                  placeholder="Backup code (8 digits)"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  maxLength={8}
                  className="text-center text-xl font-mono tracking-widest"
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? (useBackupCode ? "Login with Backup Code" : "Log In") : "Sign Up"}
            </Button>

            {isLogin && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setBackupCode("");
                }}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                {useBackupCode ? "Use password instead" : "Use backup code instead"}
              </Button>
            )}
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setUseBackupCode(false);
              setBackupCode("");
            }}
            className="text-sm text-primary hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </div>
      </Card>
    </div>
  );
}
