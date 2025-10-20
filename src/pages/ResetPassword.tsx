import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { passwordV5Schema } from "@/lib/validationSchemas";
import { z } from "zod";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reason = searchParams.get("reason");

  const isSecurityUpgrade = reason === "security-upgrade";
  const isRecoveryMode = searchParams.get("type") === "recovery";

  const handleSendResetEmail = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("User email not found");

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password?type=recovery`
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Reset Email Sent!",
        description: `Check your inbox at ${user.email}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      passwordV5Schema.parse(newPassword);

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ 
            force_password_reset: false,
            password_last_changed_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        await supabase.from("auth_events").insert({
          user_id: user.id,
          event_type: "password_reset",
          success: true,
          metadata: { reason: isSecurityUpgrade ? "security_upgrade" : "user_initiated" }
        });
      }

      toast({
        title: "Password Updated!",
        description: "Your password has been successfully updated.",
      });

      navigate("/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Password Requirements Not Met",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to update password",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isSecurityUpgrade ? "Security Upgrade Required" : "Reset Password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRecoveryMode 
              ? "Enter your new secure password below."
              : "We'll send you a secure link to reset your password."}
          </p>
        </div>

        {isSecurityUpgrade && !isRecoveryMode && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm ml-2">
              <strong>Required:</strong> All users must update their password to meet new security standards:
              <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                <li>Minimum 12 characters</li>
                <li>Upper & lowercase letters</li>
                <li>At least one number</li>
                <li>At least one special character</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {!isRecoveryMode && !emailSent && (
          <div className="space-y-4">
            <Alert className="border-blue-500/50 bg-blue-500/10">
              <AlertDescription className="text-sm">
                We'll send a secure reset link to your email address.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleSendResetEmail} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Email"}
            </Button>
          </div>
        )}

        {!isRecoveryMode && emailSent && (
          <div className="space-y-4">
            <Alert className="border-green-500/50 bg-green-500/10">
              <AlertDescription className="text-sm">
                ✅ Check your email inbox! Click the reset link to continue.
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline"
              onClick={() => setEmailSent(false)} 
              className="w-full"
            >
              Resend Email
            </Button>
          </div>
        )}

        {isRecoveryMode && (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <Alert className="mb-4 border-amber-500/50 bg-amber-500/10">
              <AlertDescription className="text-xs">
                <strong>Password Requirements:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Minimum 12 characters</li>
                  <li>Upper & lowercase letters</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div>
              <label className="text-sm font-medium mb-2 block">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
