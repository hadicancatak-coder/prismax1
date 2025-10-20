import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, Copy, Download, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";
import { generateBackupCode, hashBackupCode } from "@/lib/mfaHelpers";
import { useAuth } from "@/hooks/useAuth";

export default function SetupMFA() {
  const { mfaEnrolled } = useAuth();
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [step, setStep] = useState<'totp' | 'backup-codes' | 'confirm-codes'>('totp');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [confirmationIndices, setConfirmationIndices] = useState<number[]>([]);
  const [confirmationInputs, setConfirmationInputs] = useState<string[]>(['', '']);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reason = searchParams.get("reason");

  const isMandatory = reason === "mandatory" || reason === "enroll-required";
  const isBypassExpired = reason === "bypass-expired";

  // Auto-resolve if user already has a TOTP factor
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !mounted) return;
        
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const verifiedTotp = factors?.totp?.filter(f => f.status === 'verified') || [];
        const hasVerifiedTotp = verifiedTotp.length > 0;
        
        if (hasVerifiedTotp && mounted) {
          // Has verified factor - mark enrolled and redirect
          console.log("Verified factor exists, marking enrolled and redirecting");
          const { error } = await supabase
            .from("profiles")
            .update({ mfa_enrolled: true })
            .eq("user_id", user.id);
          
          if (error) {
            console.error("Failed to update profile:", error);
            toast({
              title: "Error",
              description: "Failed to update profile. Please try again.",
              variant: "destructive"
            });
            setInitializing(false);
            return;
          }
          
          await supabase.auth.refreshSession();
          await new Promise(r => setTimeout(r, 200));
          navigate("/", { replace: true });
        } else {
          // No verified factor - clean up any unverified and start fresh
          if (mounted) {
            // Clean up unverified factors
            const unverifiedFactors = factors?.totp?.filter(f => f.status === 'unverified') || [];
            for (const factor of unverifiedFactors) {
              try {
                await supabase.auth.mfa.unenroll({ factorId: factor.id });
                console.log("Cleaned up unverified factor:", factor.id);
              } catch (err) {
                console.error("Failed to clean up unverified factor:", err);
              }
            }
            
            setInitializing(false);
            enrollMFA();
          }
        }
      } catch (error) {
        console.error("Error checking MFA status:", error);
        if (mounted) {
          setInitializing(false);
          toast({
            title: "Error",
            description: "Failed to check MFA status. Please refresh the page.",
            variant: "destructive"
          });
        }
      }
    })();

    return () => { mounted = false; };
  }, [navigate]);

  const enrollMFA = async () => {
    if (loading || factorId) return; // Prevent multiple enrollments
    
    setLoading(true);
    try {
      // Check for any unverified factors and clean them up
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const unverifiedFactors = factorsData?.totp?.filter(f => f.status === 'unverified') || [];
      
      for (const factor of unverifiedFactors) {
        try {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
          console.log("Cleaned up unverified factor:", factor.id);
        } catch (err) {
          console.warn("Failed to clean up unverified factor:", err);
        }
      }

      // Create fresh enrollment
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator'
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      }
    } catch (error: any) {
      console.error("MFA enrollment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize MFA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    setLoading(true);
    try {
      if (!factorId) throw new Error("No MFA factor found");

      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      });

      if (error) throw error;

      // Generate backup codes via edge function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mfa-backup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: 'generate' })
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      setBackupCodes(result.codes);
      
      // Select 2 random indices for confirmation
      const indices = [
        Math.floor(Math.random() * result.codes.length),
        Math.floor(Math.random() * result.codes.length)
      ];
      // Ensure they're different
      while (indices[1] === indices[0]) {
        indices[1] = Math.floor(Math.random() * result.codes.length);
      }
      setConfirmationIndices(indices.sort((a, b) => a - b));

      setStep('backup-codes');
      toast({
        title: "TOTP Verified!",
        description: "Now let's set up your backup codes.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n');
    const blob = new Blob([`Backup Codes - Save these safely!\n\n${text}\n\nEach code can only be used once.`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "Backup codes saved to file" });
  };

  const copyBackupCodes = () => {
    const text = backupCodes.map((code, i) => `${i + 1}. ${code}`).join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "All backup codes copied to clipboard" });
  };

  const proceedToConfirmation = () => {
    setStep('confirm-codes');
  };

  const confirmBackupCodes = async () => {
    setLoading(true);
    try {
      // Verify the entered codes match
      if (confirmationInputs[0] !== backupCodes[confirmationIndices[0]] ||
          confirmationInputs[1] !== backupCodes[confirmationIndices[1]]) {
        throw new Error("Backup codes don't match. Please check and try again.");
      }

      // Mark MFA as enrolled in profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      await supabase
        .from("profiles")
        .update({ 
          mfa_enrolled: true,
          mfa_temp_bypass_until: null // Clear any bypass
        })
        .eq("user_id", user.id);

      // Log events
      await supabase.from("auth_events").insert([
        {
          user_id: user.id,
          event_type: "mfa_enrolled",
          success: true
        },
        {
          user_id: user.id,
          event_type: "mfa_backup_codes_generated",
          success: true,
          metadata: { codes_count: backupCodes.length }
        }
      ]);

      // Refresh session to pick up new profile state
      await supabase.auth.refreshSession();
      
      // Small delay to ensure session is refreshed
      await new Promise(resolve => setTimeout(resolve, 100));

      setEnrolled(true);
      toast({
        title: "MFA Enabled!",
        description: "Two-factor authentication is now active on your account.",
      });

      setTimeout(() => navigate("/", { replace: true }), 2000);
    } catch (error: any) {
      toast({
        title: "Confirmation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({ title: "Copied!", description: "Secret key copied to clipboard" });
  };

  if (initializing || enrolled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 text-center">
          {enrolled ? (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">MFA Enabled Successfully!</h1>
              <p className="text-muted-foreground">Redirecting you back...</p>
            </>
          ) : (
            <>
              <Shield className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
              <h1 className="text-2xl font-bold mb-2">Checking MFA Status...</h1>
              <p className="text-muted-foreground">Please wait</p>
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Enable Two-Factor Authentication
          </h1>
          <p className="text-sm text-muted-foreground">
            {isMandatory || isBypassExpired
              ? "Required for all users. Secure your account with MFA."
              : "Add an extra layer of security to your account."}
          </p>
        </div>

        {(isMandatory || isBypassExpired) && (
          <Alert className="mb-6 border-primary/50 bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm ml-2">
              <strong>Required:</strong> MFA is mandatory for all users.
            </AlertDescription>
          </Alert>
        )}

        {step === 'totp' && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium mb-4">Step 1: Scan QR code with your authenticator app</p>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                {qrCode && <div dangerouslySetInnerHTML={{ __html: qrCode }} />}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Or manually enter this secret:</p>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copySecret}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Step 2: Enter the 6-digit code</p>
              <Input
                type="text"
                placeholder="000000"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>

            <Button
              onClick={verifyTOTP}
              className="w-full"
              disabled={loading || verifyCode.length !== 6}
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
          </div>
        )}

        {step === 'backup-codes' && (
          <div className="space-y-6">
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm ml-2">
                <strong>Save these codes!</strong> Each can only be used once. If you lose your authenticator, these are your only way back in.
              </AlertDescription>
            </Alert>

            <div>
              <p className="text-sm font-medium mb-4">Your Backup Codes:</p>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-2">
                {backupCodes.map((code, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-muted-foreground">{i + 1}.</span>
                    <span className="font-bold">{code}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={copyBackupCodes} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
            </div>

            <Button onClick={proceedToConfirmation} className="w-full">
              I've Saved My Codes
            </Button>
          </div>
        )}

        {step === 'confirm-codes' && (
          <div className="space-y-6">
            <p className="text-sm font-medium">To confirm you saved them, enter these codes:</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Backup code #{confirmationIndices[0] + 1}:
                </label>
                <Input
                  type="text"
                  placeholder="00000000"
                  value={confirmationInputs[0]}
                  onChange={(e) => {
                    const newInputs = [...confirmationInputs];
                    newInputs[0] = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setConfirmationInputs(newInputs);
                  }}
                  maxLength={8}
                  className="text-center text-xl font-mono tracking-widest"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Backup code #{confirmationIndices[1] + 1}:
                </label>
                <Input
                  type="text"
                  placeholder="00000000"
                  value={confirmationInputs[1]}
                  onChange={(e) => {
                    const newInputs = [...confirmationInputs];
                    newInputs[1] = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setConfirmationInputs(newInputs);
                  }}
                  maxLength={8}
                  className="text-center text-xl font-mono tracking-widest"
                />
              </div>
            </div>

            <Button
              onClick={confirmBackupCodes}
              className="w-full"
              disabled={loading || confirmationInputs.some(code => code.length !== 8)}
            >
              {loading ? "Confirming..." : "Confirm & Complete Setup"}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setStep('backup-codes')}
            >
              Back to Codes
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
