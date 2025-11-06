import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Calendar, Target, ExternalLink, Building2, Edit, X, Check, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ENTITIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  onUpdate?: () => void;
}

export function CampaignDetailDialog({ open, onOpenChange, campaignId, onUpdate }: CampaignDetailDialogProps) {
  const { userRole } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editEntities, setEditEntities] = useState<string[]>([]);
  const [editTarget, setEditTarget] = useState("");
  const [editLpLink, setEditLpLink] = useState("");
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (open && campaignId) {
      fetchCampaign();
    }
  }, [open, campaignId]);

  const fetchCampaign = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (!error && data) {
      setCampaign(data);
      setEditTitle(data.title);
      setEditDescription(data.description || "");
      setEditEntities(data.entity || []);
      setEditTarget(data.target);
      setEditLpLink(data.lp_link || "");
      setEditStartDate(data.start_date ? new Date(data.start_date) : undefined);
      setEditEndDate(data.end_date ? new Date(data.end_date) : undefined);
      
      // Get signed URL for private image
      if (data.image_url) {
        const fileName = data.image_url.split('/').pop();
        const { data: signedData } = await supabase.storage
          .from("campaigns")
          .createSignedUrl(fileName, 3600); // 1 hour expiry
        
        if (signedData) {
          setImageUrl(signedData.signedUrl);
        }
      }
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("campaigns")
      .update({
        title: editTitle.trim(),
        description: editDescription.trim(),
        entity: editEntities,
        target: editTarget,
        lp_link: editLpLink.trim(),
        start_date: editStartDate?.toISOString(),
        end_date: editEndDate?.toISOString(),
      })
      .eq("id", campaignId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Campaign updated successfully" });
      setEditMode(false);
      fetchCampaign();
      onUpdate?.();
    }
  };

  const toggleEntity = (entity: string) => {
    setEditEntities(prev =>
      prev.includes(entity)
        ? prev.filter(e => e !== entity)
        : [...prev, entity]
    );
  };

  if (loading || !campaign) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) setEditMode(false);
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{campaign.title}</DialogTitle>
              <DialogDescription>
                {editMode ? "Edit campaign details" : "Campaign details and information"}
              </DialogDescription>
            </div>
            {userRole === "admin" && !editMode && (
              <Button onClick={() => setEditMode(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </div>

            <div>
              <Label>Entities (Countries)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="mr-2 h-4 w-4" />
                    {editEntities.length > 0 ? `${editEntities.length} selected` : "Select entities"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-4" align="start">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {ENTITIES.map((entity) => (
                      <div key={entity} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editEntities.includes(entity)}
                          onChange={() => toggleEntity(entity)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm">{entity}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {editEntities.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {editEntities.map(entity => (
                    <Badge key={entity} variant="secondary">
                      {entity}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label>Target</Label>
              <Select value={editTarget} onValueChange={setEditTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2B">B2B</SelectItem>
                  <SelectItem value="B2C">B2C</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Landing Page URL</Label>
              <Input value={editLpLink} onChange={(e) => setEditLpLink(e.target.value)} placeholder="https://" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editStartDate ? format(editStartDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editStartDate}
                      onSelect={setEditStartDate}
                      initialFocus
                      className={cn("p-3")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editEndDate ? format(editEndDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editEndDate}
                      onSelect={setEditEndDate}
                      initialFocus
                      className={cn("p-3")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSave} className="gap-2">
                <Check className="h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditMode(false)} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6">
            {imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt={campaign.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {campaign.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{campaign.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {campaign.entity && campaign.entity.length > 0 && (
                <div className="flex items-start gap-2 col-span-2">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Entities</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {campaign.entity.map((e: string) => (
                        <Badge key={e} variant="outline">{e}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Target className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Target</p>
                  <Badge variant="outline">{campaign.target}</Badge>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(campaign.start_date), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              {campaign.end_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">
                      {format(new Date(campaign.end_date), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {campaign.lp_link && (
              <div>
                <h3 className="font-semibold mb-2">Landing Page</h3>
                <a
                  href={campaign.lp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  {campaign.lp_link}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
