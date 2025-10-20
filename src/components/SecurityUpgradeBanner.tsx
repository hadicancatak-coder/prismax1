import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const SecurityUpgradeBanner = () => {
  const { userRole, mfaEnrolled } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  const shouldShow = userRole === 'member' && !mfaEnrolled && !dismissed;

  if (!shouldShow) return null;

  return (
    <Alert className="mb-4 border-blue-500/50 bg-blue-500/10">
      <ShieldAlert className="h-4 w-4 text-blue-500" />
      <div className="flex items-center justify-between flex-1 ml-2">
        <AlertDescription className="text-sm">
          <strong>Optional:</strong> Enable two-factor authentication for enhanced account security.
        </AlertDescription>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate("/setup-mfa?reason=optional")}
          >
            Enable MFA
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Alert>
  );
};
