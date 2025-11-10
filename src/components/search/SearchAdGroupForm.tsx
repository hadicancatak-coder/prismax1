import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SearchAdGroupFormProps {
  campaign: any;
  entity: string;
  onAdGroupCreated: () => void;
}

export function SearchAdGroupForm({ campaign, entity, onAdGroupCreated }: SearchAdGroupFormProps) {
  const [name, setName] = useState("");
  const [maxCpc, setMaxCpc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch existing ad groups for this campaign
  const { data: existingAdGroups = [], refetch } = useQuery({
    queryKey: ["ad-groups", campaign.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ad_groups")
        .select("*, ads(count)")
        .eq("campaign_id", campaign.id)
        .order("created_at", { ascending: false });
      return data || [];
    }
  });

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter an ad group name");
      return;
    }

    setIsCreating(true);

    try {
      const { error } = await supabase.from("ad_groups").insert({
        name: name.trim(),
        campaign_id: campaign.id,
        max_cpc: maxCpc ? parseFloat(maxCpc) : null,
        status: "active"
      });

      if (error) throw error;

      toast.success("Ad group created successfully");
      setName("");
      setMaxCpc("");
      refetch();
      onAdGroupCreated();
    } catch (error: any) {
      toast.error(error.message || "Failed to create ad group");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{entity}</span>
            <span>›</span>
            <span className="font-medium text-foreground">{campaign.name}</span>
          </div>
          <h2 className="text-2xl font-semibold">Ad Groups</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create ad groups to organize your search ads
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Ad Group</CardTitle>
            <CardDescription>
              Add an ad group to {campaign.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adgroup-name">Ad Group Name *</Label>
              <Input
                id="adgroup-name"
                placeholder="e.g., Exact Match Keywords"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-cpc">Max CPC (Optional)</Label>
              <Input
                id="max-cpc"
                type="number"
                step="0.01"
                placeholder="e.g., 2.50"
                value={maxCpc}
                onChange={(e) => setMaxCpc(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum cost-per-click bid for this ad group
              </p>
            </div>

            <Button 
              onClick={handleCreate} 
              disabled={isCreating}
              className="w-full"
            >
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Ad Group
            </Button>
          </CardContent>
        </Card>

        {existingAdGroups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ad Groups ({existingAdGroups.length})</CardTitle>
              <CardDescription>Click an ad group in the tree to create ads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {existingAdGroups.map(adGroup => {
                  const adCount = adGroup.ads?.[0]?.count || 0;
                  return (
                    <div
                      key={adGroup.id}
                      className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{adGroup.name}</div>
                        <Badge variant="secondary">{adCount} {adCount === 1 ? 'ad' : 'ads'}</Badge>
                      </div>
                      {adGroup.max_cpc && (
                        <div className="text-sm text-muted-foreground">
                          Max CPC: ${adGroup.max_cpc}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
