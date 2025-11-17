import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { UtmRuleEngine } from "@/lib/utmRuleEngine";
import { Progress } from "@/components/ui/progress";

interface RegenerateLinksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegenerateLinksDialog({
  open,
  onOpenChange,
}: RegenerateLinksDialogProps) {
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all UTM links
  const { data: utmLinks = [] } = useQuery({
    queryKey: ["utm-links-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_links")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Fetch active rules
  const { data: activeRules = [] } = useQuery({
    queryKey: ["utm-rules-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_automation_rules")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const totalLinks = utmLinks.length;
      let processed = 0;

      for (const link of utmLinks) {
        try {
          const context = {
            platform: link.platform || "",
            campaign: link.campaign_name || "",
            entity: Array.isArray(link.entity) ? link.entity[0] || "" : link.entity || "",
            lpUrl: link.base_url || "",
            date: new Date(link.created_at),
          };

          // Regenerate UTM parameters using active rules
          const utmSource = await UtmRuleEngine.executeRule("utm_source", context);
          const utmMedium = await UtmRuleEngine.executeRule("utm_medium", context);
          const utmCampaign = await UtmRuleEngine.executeRule("utm_campaign", context);
          const utmContent = await UtmRuleEngine.executeRule("utm_content", context);

          // Build final URL
          const baseUrl = link.base_url || "";
          const params = new URLSearchParams();
          if (utmSource) params.set("utm_source", utmSource);
          if (utmMedium) params.set("utm_medium", utmMedium);
          if (utmCampaign) params.set("utm_campaign", utmCampaign);
          if (utmContent) params.set("utm_content", utmContent);

          const finalUrl = `${baseUrl}?${params.toString()}`;

          // Update the link
          const { error } = await supabase
            .from("utm_links")
            .update({
              utm_source: utmSource,
              utm_medium: utmMedium,
              utm_campaign: utmCampaign,
              utm_content: utmContent,
              final_url: finalUrl,
              updated_at: new Date().toISOString(),
            })
            .eq("id", link.id);

          if (error) throw error;

          processed++;
        } catch (error) {
          console.error(`Failed to regenerate link ${link.id}:`, error);
        }
      }

      return processed;
    },
    onSuccess: (processed) => {
      toast({
        title: "Links Regenerated",
        description: `Successfully regenerated ${processed} UTM links with new automation rules.`,
      });
      queryClient.invalidateQueries({ queryKey: ["utm-links"] });
      onOpenChange(false);
      setConfirmed(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Regeneration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRegenerate = () => {
    if (!confirmed) {
      toast({
        title: "Confirmation Required",
        description: "Please confirm that you want to regenerate all links.",
        variant: "destructive",
      });
      return;
    }
    regenerateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Regenerate All UTM Links
          </DialogTitle>
          <DialogDescription>
            This will rebuild all existing UTM links using the currently active automation rules.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-warning/50 bg-warning/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Warning</p>
                <p className="text-sm text-muted-foreground">
                  This action will overwrite all existing UTM links. This cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Links to regenerate:</span>
              <span className="font-semibold">{utmLinks.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Active rules:</span>
              <span className="font-semibold">{activeRules.length}</span>
            </div>
          </div>

          {activeRules.length === 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">
                No active rules found. Links will use fallback logic.
              </p>
            </div>
          )}

          {activeRules.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Rules:</p>
              <div className="space-y-1">
                {activeRules.map((rule: any) => (
                  <div key={rule.id} className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {rule.rule_name}
                    </code>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-xs">{rule.template}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 pt-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand this will overwrite all {utmLinks.length} existing UTM links
            </label>
          </div>

          {regenerateMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Regenerating links...</span>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={regenerateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={!confirmed || regenerateMutation.isPending}
            variant="destructive"
          >
            {regenerateMutation.isPending ? "Regenerating..." : "Regenerate All Links"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
