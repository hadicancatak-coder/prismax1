import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Copy, Edit, Save, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface CampaignLogCardProps {
  campaign: {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    lp_link: string | null;
    image_url: string | null;
    notes: string | null;
  };
  onUpdateNotes: (campaignId: string, notes: string) => void;
}

export function CampaignLogCard({ campaign, onUpdateNotes }: CampaignLogCardProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(campaign.notes || "");

  const handleSaveNotes = () => {
    onUpdateNotes(campaign.id, notesValue);
    setEditingNotes(false);
  };

  const handleCancelEdit = () => {
    setNotesValue(campaign.notes || "");
    setEditingNotes(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 border-border bg-card">
      <CardHeader className="space-y-sm">
        {campaign.image_url && (
          <div className="w-full h-32 rounded-md overflow-hidden bg-muted">
            <img
              src={campaign.image_url}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="space-y-sm">
          <CardTitle className="text-heading-sm line-clamp-2">{campaign.title}</CardTitle>
          <div className="flex items-center gap-sm text-metadata text-muted-foreground">
            <Badge variant="outline" className="text-metadata">
              {format(new Date(campaign.start_date), "MMM d, yyyy")} -{" "}
              {format(new Date(campaign.end_date), "MMM d, yyyy")}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-md">
        {campaign.description && (
          <CardDescription className="line-clamp-3 text-body-sm">
            {campaign.description}
          </CardDescription>
        )}

        {campaign.lp_link && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Landing Page</label>
            <div className="flex items-center gap-2">
              <a
                href={campaign.lp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs text-primary hover:underline truncate"
              >
                {campaign.lp_link}
              </a>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => copyToClipboard(campaign.lp_link!)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                asChild
              >
                <a href={campaign.lp_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-sm">
          <div className="flex items-center justify-between">
            <label className="text-metadata font-semibold text-foreground">Notes</label>
            {!editingNotes && (
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setEditingNotes(true)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>

          {editingNotes ? (
            <div className="space-y-sm">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add notes about this campaign..."
                className="min-h-[100px] text-body-sm"
              />
              <div className="flex justify-end gap-sm">
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveNotes}>
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-body-sm text-muted-foreground min-h-[60px] p-sm bg-muted/50 rounded-md">
              {campaign.notes || "No notes yet. Click edit to add notes."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
