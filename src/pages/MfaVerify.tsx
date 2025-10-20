import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, KeyRound } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function MfaVerify() {
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const verifyOtp = async () => {
    const code = useBackupCode ? backupCode : otp;

    if (!code || (useBackupCode && code.length < 8) || (!useBackupCode && code.length !== 6)) {
      toast({
        title: "Invalid code",
        description: useBackupCode ? "Please enter a valid backup code" : "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-mfa-otp', {
        body: { 
          otpCode: code,
          isBackupCode: useBackupCode
        }
      });

      if (error) throw error;

      if (data.success) {
        // Mark MFA as verified in session storage
        sessionStorage.setItem('mfa_verified', 'true');
        
        toast({
          title: "Verified!",
          description: "You have been successfully authenticated",
        });

        navigate("/");
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
      setOtp("");
      setBackupCode("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Two-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground">
            {useBackupCode 
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"
            }
          </p>
        </div>

        <div className="space-y-4">
          {useBackupCode ? (
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Backup Code
              </label>
              <Input
                type="text"
                placeholder="Enter backup code"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Verification Code
              </label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          )}

          <Button
            onClick={verifyOtp}
            disabled={verifying}
            className="w-full"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setOtp("");
              setBackupCode("");
            }}
            className="w-full"
          >
            <KeyRound className="h-4 w-4 mr-2" />
            {useBackupCode ? "Use authenticator app instead" : "Use backup code instead"}
          </Button>

          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              sessionStorage.removeItem('mfa_verified');
              navigate("/auth");
            }}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
