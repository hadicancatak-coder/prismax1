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
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-medium">Link Name</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Campaign</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Platform</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Entity</th>
              <th className="text-left px-4 py-2 text-sm font-medium">LP Type</th>
              <th className="text-left px-4 py-2 text-sm font-medium">Date</th>
              <th className="text-right px-4 py-2 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No UTM links found
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 font-medium">{link.name || "—"}</td>
                  <td className="px-4 py-2">{link.campaign_name || "—"}</td>
                  <td className="px-4 py-2 capitalize">{link.platform || "—"}</td>
                  <td className="px-4 py-2">
                    {link.entity && link.entity.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {link.entity.map((e) => (
                          <span key={e} className="text-sm">
                            {entityEmojis[e] || ""} {e}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Dynamic</span>
                    )}
                  </td>
                  <td className="px-4 py-2">{getLpTypeBadge(link.lp_type)}</td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {format(new Date(link.created_at), "MMM dd")}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(link.full_url)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(link.full_url, "_blank")}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
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
