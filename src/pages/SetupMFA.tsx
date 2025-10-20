import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Download, Copy, ArrowLeft } from "lucide-react";
import QRCodeLib from "qrcode";

export default function SetupMFA() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [qrCode, setQrCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"setup" | "backup-codes" | "complete">("setup");
  const [error, setError] = useState<string | null>(null);

  const reason = searchParams.get("reason");
  const isOptional = reason === "optional";

  // Start enrollment when component mounts
  useEffect(() => {
    if (!qrCode && !factorId && !loading) {
      enrollMFA();
    }
  }, []);

  const enrollMFA = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Clean up any unverified factors first
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      const unverified = existingFactors?.totp?.filter(f => f.status === 'unverified') || [];
      
      for (const factor of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id });
      }

      // Create new enrollment
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (enrollError) throw enrollError;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        
        // Generate QR code as data URL
        const dataUrl = await QRCodeLib.toDataURL(data.totp.qr_code);
        setQrDataUrl(dataUrl);
      }
    } catch (err: any) {
      console.error("Enrollment error:", err);
      setError(err.message || "Failed to start MFA enrollment");
      toast({
        title: "Error",
        description: err.message || "Failed to start MFA enrollment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!factorId || !verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Challenge and verify
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verificationCode,
      });

      if (verify.error) throw verify.error;

      // Generate backup codes
      const { data: codesData, error: codesError } = await supabase.functions.invoke('mfa-backup', {
        body: { action: 'generate' }
      });

      if (codesError) throw codesError;

      setBackupCodes(codesData.codes || []);
      setStep("backup-codes");
      
      toast({
        title: "Success",
        description: "MFA verified successfully",
      });
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Invalid verification code");
      toast({
        title: "Error",
        description: err.message || "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmBackupCodes = async () => {
    try {
      // Update profile to mark MFA as enrolled
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ mfa_enrolled: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh session
      await supabase.auth.refreshSession();

      setStep("complete");
      
      toast({
        title: "Success",
        description: "MFA setup completed successfully",
      });
    } catch (err: any) {
      console.error("Error saving backup codes confirmation:", err);
      toast({
        title: "Error",
        description: "Failed to complete setup",
        variant: "destructive",
      });
    }
  };

  const downloadBackupCodes = () => {
    const text = backupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Backup codes saved to file",
    });
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast({
      title: "Copied",
      description: "Backup codes copied to clipboard",
    });
  };

  const handleSkip = () => {
    navigate("/");
    toast({
      title: "MFA Setup Skipped",
      description: "You can set up MFA later from your profile settings",
    });
  };

  // Completion step
  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>MFA Setup Complete</CardTitle>
            <CardDescription>
              Your account is now protected with two-factor authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Your authenticator app is now set up. You'll need to use it every time you sign in.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => navigate("/")}>
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Backup codes step
  if (step === "backup-codes") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Save Your Backup Codes</CardTitle>
            <CardDescription>
              Store these codes in a safe place. Each can only be used once to access your account if you lose your authenticator device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="text-center">
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={downloadBackupCodes}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={copyBackupCodes}
                className="flex-1"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
            <Alert>
              <AlertDescription>
                Make sure you've saved these codes before continuing. You won't be able to see them again.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={confirmBackupCodes}>
              I've Saved My Backup Codes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Setup step (initial)
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Set Up Two-Factor Authentication</CardTitle>
            {isOptional && (
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
            )}
          </div>
          <CardDescription>
            Secure your account with an authenticator app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && !qrCode && (
            <div className="text-center py-8">
              <div className="text-muted-foreground">Setting up MFA...</div>
            </div>
          )}

          {qrCode && (
            <>
              <div className="space-y-4">
                <div className="text-sm">
                  <p className="font-medium mb-2">Step 1: Scan QR Code</p>
                  <p className="text-muted-foreground">
                    Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code:
                  </p>
                </div>

                <div className="flex justify-center p-4 bg-white rounded-lg">
                  {qrDataUrl && <img src={qrDataUrl} alt="MFA QR Code" className="w-[200px] h-[200px]" />}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Or enter this code manually:</p>
                  <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                    {secret}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Step 2: Enter the 6-digit code</p>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="text-center text-lg tracking-wider"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={verifyTOTP}
                  disabled={loading || verificationCode.length !== 6}
                >
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
