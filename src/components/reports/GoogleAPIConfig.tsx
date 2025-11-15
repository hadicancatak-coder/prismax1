import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Save } from "lucide-react";

interface GoogleAPIConfigProps {
  onConfigured: () => void;
}

export function GoogleAPIConfig({ onConfigured }: GoogleAPIConfigProps) {
  const [clientId, setClientId] = useState(localStorage.getItem("GOOGLE_CLIENT_ID") || "");
  const [apiKey, setApiKey] = useState(localStorage.getItem("GOOGLE_API_KEY") || "");
  const [saving, setSaving] = useState(false);

  const isConfigured = clientId && apiKey;

  const handleSave = async () => {
    if (!clientId.trim() || !apiKey.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter both Client ID and API Key",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem("GOOGLE_CLIENT_ID", clientId.trim());
      localStorage.setItem("GOOGLE_API_KEY", apiKey.trim());

      toast({
        title: "Configuration Saved",
        description: "Google API credentials have been saved successfully",
      });

      // Reload the page to initialize Google APIs with new credentials
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem("GOOGLE_CLIENT_ID");
    localStorage.removeItem("GOOGLE_API_KEY");
    setClientId("");
    setApiKey("");
    toast({
      title: "Configuration Cleared",
      description: "Google API credentials have been removed",
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">API Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Enter your Google Cloud credentials from the setup steps above
          </p>
        </div>

        {isConfigured && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-700 dark:text-green-400">
              API credentials configured successfully
            </span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-id">OAuth 2.0 Client ID</Label>
            <Input
              id="client-id"
              type="text"
              placeholder="123456789-abcdefghijklmnop.apps.googleusercontent.com"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              From Google Cloud Console → Credentials → OAuth 2.0 Client IDs
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              From Google Cloud Console → Credentials → API Keys
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={saving || !clientId || !apiKey}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
          {isConfigured && (
            <Button variant="outline" onClick={handleClear}>
              <XCircle className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2 text-sm">Security Notice:</h4>
          <p className="text-xs text-muted-foreground">
            Your credentials are stored locally in your browser and never sent to our servers. 
            They're only used to communicate directly with Google's APIs.
          </p>
        </div>
      </div>
    </Card>
  );
}
