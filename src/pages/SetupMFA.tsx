import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

export default function SetupMFA() {
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reason = searchParams.get("reason");

  const isAdminRequired = reason === "admin-required";
  const isOptional = reason === "optional";

  useEffect(() => {
    enrollMFA();
  }, []);

  const enrollMFA = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize MFA",
        variant: "destructive",
      });
    }
  };

  const verifyMFA = async () => {
    setLoading(true);
    try {
      const factors = await supabase.auth.mfa.listFactors();
      if (!factors.data?.totp?.[0]?.id) throw new Error("No MFA factor found");

      const factorId = factors.data.totp[0].id;

      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode
      });

      if (error) throw error;

      // Update profile to mark MFA as enrolled
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ mfa_enrolled: true })
          .eq("user_id", user.id);

        // Log the event
        await supabase.from("auth_events").insert({
          user_id: user.id,
          event_type: "mfa_enrolled",
          success: true
        });
      }

      setEnrolled(true);
      toast({
        title: "MFA Enabled!",
        description: "Two-factor authentication is now active on your account.",
      });

      setTimeout(() => navigate("/"), 2000);
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

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast({ title: "Copied!", description: "Secret key copied to clipboard" });
  };

  if (enrolled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">MFA Enabled Successfully!</h1>
          <p className="text-muted-foreground">Redirecting you back...</p>
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
            {isAdminRequired 
              ? "Required for admin access. Secure your account with MFA."
              : "Add an extra layer of security to your account."}
          </p>
        </div>

        {isAdminRequired && (
          <Alert className="mb-6 border-primary/50 bg-primary/10">
            <Shield className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm ml-2">
              <strong>Admin Requirement:</strong> MFA is mandatory for admin accounts.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-4">1. Scan QR code with your authenticator app:</p>
            <div className="flex justify-center p-4 bg-white rounded-lg">
              {qrCode && <QRCodeSVG value={qrCode} size={200} />}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">2. Or manually enter this secret:</p>
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
            <p className="text-sm font-medium mb-2">3. Enter the 6-digit code:</p>
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
            onClick={verifyMFA}
            className="w-full"
            disabled={loading || verifyCode.length !== 6}
          >
            {loading ? "Verifying..." : "Verify & Enable MFA"}
          </Button>

          {isOptional && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => navigate("/")}
            >
              Skip for Now
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
