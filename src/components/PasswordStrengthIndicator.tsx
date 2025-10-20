import { Check, X } from "lucide-react";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements: PasswordRequirement[] = [
    { label: "At least 9 characters", met: password.length >= 9 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "One number (0-9)", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$%^&*()_+-=[]{}|;:,.<>?)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  const metCount = requirements.filter(r => r.met).length;
  const strength = metCount === 0 ? 0 : metCount === 4 ? 100 : (metCount / 4) * 100;

  const getStrengthLabel = () => {
    if (metCount === 4) return "Strong";
    if (metCount >= 2) return "Medium";
    return "Weak";
  };

  const getStrengthColor = () => {
    if (metCount === 4) return "bg-green-500";
    if (metCount >= 2) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {req.met ? (
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 text-red-500 flex-shrink-0" />
            )}
            <span className={req.met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
              {req.label}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password Strength:</span>
          <span className={`font-medium ${metCount === 4 ? 'text-green-600 dark:text-green-400' : metCount >= 2 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>
    </div>
  );
};
