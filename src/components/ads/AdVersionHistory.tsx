import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdVersions, useRestoreAdVersion } from '@/hooks/useAdVersions';
import { History, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';
import { ConfirmPopover } from '@/components/ui/ConfirmPopover';

interface AdVersionHistoryProps {
  adId: string;
}

export function AdVersionHistory({ adId }: AdVersionHistoryProps) {
  const [confirmRestoreVersion, setConfirmRestoreVersion] = useState<any>(null);
  const { data: versions, isLoading } = useAdVersions(adId);
  const restoreVersion = useRestoreAdVersion();

  const handleRestore = (versionData: any) => {
    const { id, created_at, updated_at, version, ...restoreData } = versionData;
    restoreVersion.mutate({ adId, versionData: restoreData });
    setConfirmRestoreVersion(null);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading history...</div>;
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4" />
        <h3 className="font-semibold">Version History</h3>
      </div>

      <ScrollArea className="h-96">
        {versions && versions.length > 0 ? (
          <div className="space-y-3">
            {versions.map((version) => (
              <div key={version.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">Version {version.version_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(version.created_at), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                  <ConfirmPopover
                    open={confirmRestoreVersion?.id === version.id}
                    onOpenChange={(open) => !open && setConfirmRestoreVersion(null)}
                    onConfirm={() => handleRestore(version.snapshot_data)}
                    title="Restore this version?"
                    description="This will create a new version with the restored content."
                    trigger={
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmRestoreVersion(version)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Restore
                      </Button>
                    }
                  />
                </div>

                {version.changed_fields && version.changed_fields.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {version.changed_fields.map((field) => (
                      <Badge key={field} variant="secondary" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No version history yet
          </p>
        )}
      </ScrollArea>
    </Card>
  );
}
