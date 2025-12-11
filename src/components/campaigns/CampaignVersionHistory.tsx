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
  const { data: versions = [], isLoading, error } = useVersions(campaignId);

  if (error) {
    console.error('Version history error:', error);
  }

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
          <ScrollArea className="h-[300px] pr-md">
            {isLoading ? (
              <div className="text-body-sm text-muted-foreground">Loading versions...</div>
            ) : error ? (
              <div className="text-body-sm text-destructive">Error loading versions</div>
            ) : versions.length === 0 ? (
              <div className="text-body-sm text-muted-foreground text-center py-lg">
                No versions yet. Save a version to track changes.
              </div>
            ) : (
              <div className="space-y-sm">
                {versions.map((version) => {
                  const createdDate = version.created_at ? new Date(version.created_at) : null;
                  const isValidDate = createdDate && !isNaN(createdDate.getTime());
                  
                  return (
                    <div
                      key={version.id}
                      className="border rounded-lg p-sm hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-start justify-between mb-sm">
                        <div className="flex items-center gap-sm">
                          <Badge variant="outline">v{version.version_number}</Badge>
                          <span className="font-medium text-body-sm">{version.name}</span>
                        </div>
                        <span className="text-metadata text-muted-foreground">
                          {isValidDate 
                            ? formatDistanceToNow(createdDate, { addSuffix: true })
                            : 'Date unavailable'}
                        </span>
                      </div>
                      {version.version_notes && (
                        <p className="text-metadata text-muted-foreground line-clamp-2">
                          {version.version_notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-sm">
              <Badge variant="outline">v{selectedVersion?.version_number}</Badge>
              {selectedVersion?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-md">
            {selectedVersion?.landing_page && (
              <div>
                <label className="text-body-sm font-medium">Landing Page</label>
                <a
                  href={selectedVersion.landing_page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm text-primary hover:underline flex items-center gap-xs mt-xs"
                >
                  {selectedVersion.landing_page}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            
            {selectedVersion?.description && (
              <div>
                <label className="text-body-sm font-medium">Description</label>
                <p className="text-body-sm text-muted-foreground mt-xs">{selectedVersion.description}</p>
              </div>
            )}

            {selectedVersion?.image_url && (
              <div>
                <label className="text-body-sm font-medium flex items-center gap-xs">
                  <FileImage className="h-4 w-4" />
                  Asset Image
                  {selectedVersion.image_file_size && (
                    <span className="text-metadata text-muted-foreground ml-sm">
                      ({(selectedVersion.image_file_size / 1024).toFixed(0)} KB)
                    </span>
                  )}
                </label>
                <img
                  src={selectedVersion.image_url}
                  alt="Campaign asset"
                  className="mt-sm rounded-lg border max-h-64 object-contain"
                />
              </div>
            )}

            {selectedVersion?.asset_link && (
              <div>
                <label className="text-body-sm font-medium flex items-center gap-xs">
                  <LinkIcon className="h-4 w-4" />
                  Asset Link
                </label>
                <a
                  href={selectedVersion.asset_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-body-sm text-primary hover:underline flex items-center gap-xs mt-xs"
                >
                  {selectedVersion.asset_link}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {selectedVersion?.version_notes && (
              <div>
                <label className="text-body-sm font-medium">Version Notes</label>
                <p className="text-body-sm text-muted-foreground mt-xs whitespace-pre-wrap">
                  {selectedVersion.version_notes}
                </p>
              </div>
            )}

            <div className="text-metadata text-muted-foreground border-t pt-sm">
              {(() => {
                try {
                  const date = selectedVersion?.created_at ? new Date(selectedVersion.created_at) : null;
                  return date && !isNaN(date.getTime())
                    ? `Created ${formatDistanceToNow(date, { addSuffix: true })}`
                    : 'Creation date unavailable';
                } catch {
                  return 'Creation date unavailable';
                }
              })()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
