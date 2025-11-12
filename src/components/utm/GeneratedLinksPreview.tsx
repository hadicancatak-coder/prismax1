import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Save, X } from "lucide-react";
import { toast } from "sonner";

interface GeneratedLink {
  id: string;
  name: string;
  full_url: string;
  utm_campaign: string;
  entity?: string[];
  platform: string;
  deviceType?: string;
  purpose?: string;
}

interface GeneratedLinksPreviewProps {
  links: GeneratedLink[];
  onCopy: (url: string) => void;
  onSave: (link: GeneratedLink) => void;
  onClear: () => void;
}

export function GeneratedLinksPreview({ links, onCopy, onSave, onClear }: GeneratedLinksPreviewProps) {
  if (links.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Generated Links ({links.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {links.map((link) => (
            <div key={link.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-mono break-all bg-muted px-3 py-2 rounded">
                    {link.full_url}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">{link.utm_campaign}</Badge>
                    {link.entity && link.entity.length > 0 && (
                      <Badge variant="outline">{link.entity.join(", ")}</Badge>
                    )}
                    <Badge variant="secondary">{link.platform}</Badge>
                    {link.deviceType && (
                      <Badge variant="outline" className="text-xs">
                        {link.deviceType}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onCopy(link.full_url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => onSave(link)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
