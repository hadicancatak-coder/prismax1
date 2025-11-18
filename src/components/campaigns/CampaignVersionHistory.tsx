import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, ExternalLink, FileImage, Link as LinkIcon } from "lucide-react";
import { useCampaignVersions, type CampaignVersion } from "@/hooks/useCampaignVersions";
import { formatDistanceToNow } from "date-fns";

interface CampaignVersionHistoryProps {
  campaignId: string;
}

export function CampaignVersionHistory({ campaignId }: CampaignVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<CampaignVersion | null>(null);
  const { useVersions } = useCampaignVersions();
  const { data: versions = [], isLoading } = useVersions(campaignId);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History ({versions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading versions...</div>
            ) : versions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No versions yet. Save a version to track changes.
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="border rounded-lg p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">v{version.version_number}</Badge>
                        <span className="font-medium text-sm">{version.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    {version.version_notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {version.version_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge variant="outline">v{selectedVersion?.version_number}</Badge>
              {selectedVersion?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedVersion?.landing_page && (
              <div>
                <label className="text-sm font-medium">Landing Page</label>
                <a
                  href={selectedVersion.landing_page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  {selectedVersion.landing_page}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            
            {selectedVersion?.description && (
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm text-muted-foreground mt-1">{selectedVersion.description}</p>
              </div>
            )}

            {selectedVersion?.image_url && (
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <FileImage className="h-4 w-4" />
                  Asset Image
                  {selectedVersion.image_file_size && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({(selectedVersion.image_file_size / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </label>
                <img
                  src={selectedVersion.image_url}
                  alt="Campaign asset"
                  className="mt-2 rounded-lg border max-h-64 object-contain"
                />
              </div>
            )}

            {selectedVersion?.asset_link && (
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <LinkIcon className="h-4 w-4" />
                  Asset Link
                </label>
                <a
                  href={selectedVersion.asset_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  {selectedVersion.asset_link}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {selectedVersion?.version_notes && (
              <div>
                <label className="text-sm font-medium">Version Notes</label>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {selectedVersion.version_notes}
                </p>
              </div>
            )}

            <div className="text-xs text-muted-foreground border-t pt-3">
              Created {formatDistanceToNow(new Date(selectedVersion?.created_at || ""), { addSuffix: true })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
