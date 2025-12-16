import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, MessageCircle, FileImage, Link2, Loader2 } from "lucide-react";
import { useCampaignEntityTracking } from "@/hooks/useCampaignEntityTracking";
import { useCampaignVersions } from "@/hooks/useCampaignVersions";
import { CampaignComments } from "./CampaignComments";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UtmCampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

export function UtmCampaignDetailDialog({ open, onOpenChange, campaignId }: UtmCampaignDetailDialogProps) {
  const [showComments, setShowComments] = useState(false);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["utm-campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!campaignId,
  });

  const { getEntitiesForCampaign } = useCampaignEntityTracking();
  const { useVersions } = useCampaignVersions();
  const { data: versions = [] } = useVersions(campaignId);
  const entities = getEntitiesForCampaign(campaignId);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-h-[85vh] p-0 gap-0",
        showComments ? "max-w-[1000px]" : "max-w-2xl"
      )}>
        <div className="flex h-full max-h-[85vh]">
          <div className="flex-1 flex flex-col overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">{campaign.name}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {campaign.description || "No description"}
                  </DialogDescription>
                </div>
                <Button
                  variant={showComments ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Comments
                </Button>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 pb-6">
              <div className="space-y-6">
                {/* Landing Page */}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Landing Page</p>
                  {campaign.landing_page ? (
                    <a 
                      href={campaign.landing_page} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline flex items-center gap-1 break-all"
                    >
                      {campaign.landing_page}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                  ) : (
                    <p className="text-muted-foreground">Not set</p>
                  )}
                </div>

                {/* Active Entities */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Active Entities</p>
                  <div className="flex flex-wrap gap-2">
                    {entities.length === 0 ? (
                      <p className="text-muted-foreground text-sm">Not live on any entity</p>
                    ) : (
                      entities.map((e) => (
                        <Badge key={e.id} variant="secondary">{e.entity}</Badge>
                      ))
                    )}
                  </div>
                </div>

                <Separator />

                {/* Version History */}
                <div>
                  <h3 className="font-semibold mb-3">Version History</h3>
                  {versions.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-6">No versions yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Version</TableHead>
                          <TableHead className="w-28">Date</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="w-16">Asset</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {versions.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell><Badge variant="outline">v{v.version_number}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {v.created_at ? format(new Date(v.created_at), 'MMM d') : '-'}
                            </TableCell>
                            <TableCell className="text-sm">{v.version_notes || '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {v.image_url && (
                                  <a href={v.image_url} target="_blank" rel="noopener noreferrer">
                                    <FileImage className="h-4 w-4 text-primary" />
                                  </a>
                                )}
                                {v.asset_link && (
                                  <a href={v.asset_link} target="_blank" rel="noopener noreferrer">
                                    <Link2 className="h-4 w-4 text-primary" />
                                  </a>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Comments Panel */}
          {showComments && (
            <>
              <Separator orientation="vertical" />
              <div className="w-[350px] flex flex-col">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-sm">Comments</h3>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CampaignComments campaignId={campaignId} />
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}