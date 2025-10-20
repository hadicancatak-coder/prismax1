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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const reason = searchParams.get("reason");

  const isSecurityUpgrade = reason === "security-upgrade";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate new password
      passwordV5Schema.parse(newPassword);

      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Update password via Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // Update profile to mark password reset complete
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ 
            force_password_reset: false,
            password_last_changed_at: new Date().toISOString()
          })
          .eq("user_id", user.id);

        // Log the event
        await supabase.from("auth_events").insert({
          user_id: user.id,
          event_type: "password_reset",
          success: true,
          metadata: { reason: isSecurityUpgrade ? "security_upgrade" : "user_initiated" }
        });
      }

      toast({
        title: "Password Updated!",
        description: "Your password has been successfully updated with enhanced security.",
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
            {isSecurityUpgrade 
              ? "We've upgraded our security. Please create a stronger password."
              : "Create a new strong password for your account."}
          </p>
        </div>

        {isSecurityUpgrade && (
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
      </Card>
    </div>
  );
}
