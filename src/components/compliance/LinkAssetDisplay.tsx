import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LinkAssetDisplayProps {
  url: string;
}

export function LinkAssetDisplay({ url }: LinkAssetDisplayProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="text-sm font-medium mb-1">External Link:</div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline break-all"
        >
          {url}
        </a>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(url, "_blank")}
      >
        <ExternalLink className="h-4 w-4 mr-2" />
        Open
      </Button>
    </div>
  );
}
