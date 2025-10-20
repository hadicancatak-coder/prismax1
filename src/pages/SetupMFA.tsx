import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Download, Copy, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function SetupMFA() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [qrCode, setQrCode] = useState("");
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
      }
    } catch (err: any) {
      console.error("Enrollment error:", err);
      setError(err.message || "Failed to start MFA enrollment");
      toast({
        title: "Error",
        description: "Failed to initialize MFA setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!factorId || verificationCode.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verificationCode,
      });

      if (verify.error) throw verify.error;

      // Generate backup codes
      const { data: backupData, error: backupError } = await supabase.functions.invoke(
        "mfa-backup",
        { body: { action: "generate" } }
      );

      if (backupError) throw backupError;

      setBackupCodes(backupData.codes || []);
      setStep("backup-codes");

      toast({
        title: "Success",
        description: "MFA verified successfully!",
      });
    } catch (err: any) {
      console.error("Verification error:", err);
      setError(err.message || "Invalid code. Please try again.");
      toast({
        title: "Error",
        description: "Invalid code. Please check and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmBackupCodes = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Mark MFA as enrolled
      const { error } = await supabase
        .from("profiles")
        .update({ mfa_enrolled: true })
        .eq("user_id", user.id);

      if (error) throw error;

      await supabase.auth.refreshSession();
      setStep("complete");

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (err: any) {
      console.error("Error completing setup:", err);
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mfa-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast({
      title: "Copied",
      description: "Backup codes copied to clipboard",
    });
  };

  const handleSkip = () => {
    navigate("/", { replace: true });
  };

  if (step === "complete") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <CardTitle>MFA Enabled Successfully!</CardTitle>
            <CardDescription>Your account is now more secure</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            Redirecting you to the dashboard...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "backup-codes") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Save Your Backup Codes</CardTitle>
            <CardDescription>
              Store these codes in a safe place. You can use them to access your account if you lose your authenticator device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription className="font-mono text-sm">
                {backupCodes.map((code, i) => (
                  <div key={i}>{code}</div>
                ))}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={copyBackupCodes} variant="outline" className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>

            <Button onClick={confirmBackupCodes} disabled={loading} className="w-full">
              {loading ? "Completing..." : "I've Saved My Codes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOptional && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                  className="mr-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <CardTitle>Enable Two-Factor Authentication</CardTitle>
          <CardDescription>
            {isOptional 
              ? "Add an extra layer of security to your account (optional)"
              : "Enhance your account security with 2FA"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && !qrCode ? (
            <div className="text-center py-8 text-muted-foreground">
              Setting up MFA...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium">Step 1: Scan QR Code</p>
                <p className="text-sm text-muted-foreground">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={qrCode} size={200} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Or enter this code manually:</p>
                <code className="block p-2 bg-muted rounded text-sm font-mono break-all">
                  {secret}
                </code>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Step 2: Enter Verification Code</p>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
              </div>

              <div className="space-y-2">
                <Button
                  onClick={verifyTOTP}
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? "Verifying..." : "Verify and Continue"}
                </Button>
                
                {isOptional && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="w-full"
                  >
                    Skip for Now
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
