import { UtmLink } from "@/hooks/useUtmLinks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface UtmCompactListProps {
  links: UtmLink[];
}

const entityEmojis: Record<string, string> = {
  Jordan: "🇯🇴",
  Lebanon: "🇱🇧",
  Mauritius: "🇲🇺",
  Vietnam: "🇻🇳",
  Iraq: "🇮🇶",
  Azerbaijan: "🇦🇿",
  UAE: "🇦🇪",
  Kuwait: "🇰🇼",
  Oman: "🇴🇲",
  UK: "🇬🇧",
  Cyprus: "🇨🇾",
  Vanuatu: "🇻🇺",
  Palestine: "🇵🇸",
  "South Africa": "🇿🇦",
};

export const UtmCompactList = ({ links }: UtmCompactListProps) => {
  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("UTM link copied to clipboard");
  };

  const getLpTypeBadge = (lpType: string | null) => {
    if (!lpType) return null;
    
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      static: { label: "Static", variant: "default" },
      mauritius: { label: "Mauritius", variant: "secondary" },
      dynamic: { label: "Dynamic", variant: "outline" },
    };

    const config = variants[lpType] || { label: lpType, variant: "outline" };
    return <Badge variant={config.variant} className="text-[10px] py-0 px-1.5">{config.label}</Badge>;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-3 py-1.5 text-xs font-medium">Link Name</th>
              <th className="text-left px-3 py-1.5 text-xs font-medium">Campaign</th>
              <th className="text-left px-3 py-1.5 text-xs font-medium">Platform</th>
              <th className="text-left px-3 py-1.5 text-xs font-medium">Entity</th>
              <th className="text-left px-3 py-1.5 text-xs font-medium">LP Type</th>
              <th className="text-left px-3 py-1.5 text-xs font-medium">Date</th>
              <th className="text-right px-3 py-1.5 text-xs font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                  No UTM links found
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="border-b hover:bg-muted/30 transition-colors group">
                  <td className="px-3 py-1.5 text-sm font-medium">{link.name || "—"}</td>
                  <td className="px-3 py-1.5 text-sm">{link.campaign_name || "—"}</td>
                  <td className="px-3 py-1.5 text-sm capitalize">{link.platform || "—"}</td>
                  <td className="px-3 py-1.5">
                    {link.entity && link.entity.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {link.entity.map((e) => (
                          <span key={e} className="text-xs">
                            {entityEmojis[e] || ""} {e}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Dynamic</span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">{getLpTypeBadge(link.lp_type)}</td>
                  <td className="px-3 py-1.5 text-xs text-muted-foreground">
                    {format(new Date(link.created_at), "MMM dd")}
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex gap-0.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(link.full_url)}
                        className="h-7 w-7 p-0"
                        title="Copy URL"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(link.full_url, "_blank")}
                        className="h-7 w-7 p-0"
                        title="Open link"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
