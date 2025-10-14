import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TEAMS, ENTITIES } from "@/lib/constants";

interface LaunchCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LaunchCampaignDialog({ open, onOpenChange, onSuccess }: LaunchCampaignDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const [launchDate, setLaunchDate] = useState<Date | undefined>();
  const [creativesLink, setCreativesLink] = useState("");
  const [captions, setCaptions] = useState("");
  const [lpUrl, setLpUrl] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) fetchUsers();
  }, [open]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('user_id, name, teams');
    setUsers(data || []);
  };

  const handleSubmit = async () => {
    if (!title || selectedTeams.length === 0 || !launchDate) {
      toast({ title: "Missing fields", description: "Title, teams, and launch date are required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      const { data: campaign, error } = await supabase
        .from('launch_pad_campaigns')
        .insert({
          title,
          description: description.trim() || null,
          teams: selectedTeams,
          entity: entities.length > 0 ? entities : [],
          launch_date: launchDate.toISOString(),
          creatives_link: creativesLink.trim() || null,
          captions: captions.trim() || null,
          lp_url: lpUrl.trim() || null,
          status,
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-assign team members
      const assignees = users
        .filter(u => selectedTeams.some(team => u.teams?.includes(team)))
        .map(u => ({
          campaign_id: campaign.id,
          user_id: u.user_id,
          assigned_by: userId
        }));

      if (assignees.length > 0) {
        await supabase.from('launch_campaign_assignees').insert(assignees);
      }

      toast({ title: "Mission created successfully", description: "Campaign has been added to Launch Pad" });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Error creating campaign", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedTeams([]);
    setEntities([]);
    setLaunchDate(undefined);
    setCreativesLink("");
    setCaptions("");
    setLpUrl("");
    setStatus("pending");
  };

  const toggleTeam = (team: string) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🚀 New Mission Launch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Mission Title *</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Enter campaign title" 
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mission Brief</Label>
            <Textarea
              id="description"
              placeholder="Enter campaign description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Launch Teams *</Label>
            <div className="flex gap-4 mt-2">
              {TEAMS.map(team => (
                <div key={team} className="flex items-center gap-2">
                  <Checkbox
                    id={`team-${team}`}
                    checked={selectedTeams.includes(team)}
                    onCheckedChange={() => toggleTeam(team)}
                  />
                  <Label htmlFor={`team-${team}`} className="text-sm font-normal cursor-pointer">
                    {team}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Countries</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  {entities.length > 0 ? `${entities.length} selected` : "Select countries"}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80"
                onInteractOutside={(e) => {
                  const target = e.target as Element;
                  if (target.closest('[role="checkbox"]') || target.closest('label')) {
                    e.preventDefault();
                  }
                }}
              >
                <ScrollArea className="max-h-[300px]">
                  <div className="space-y-2 pr-4">
                    {ENTITIES.map((ent) => (
                      <div 
                        key={ent} 
                        className="flex items-center space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          id={`entity-${ent}`}
                          checked={entities.includes(ent)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setEntities([...entities, ent]);
                            } else {
                              setEntities(entities.filter(c => c !== ent));
                            }
                          }}
                        />
                        <Label htmlFor={`entity-${ent}`} className="text-sm cursor-pointer">
                          {ent}
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            {entities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {entities.map((ent) => (
                  <Badge key={ent} variant="secondary" className="text-xs">
                    {ent}
                    <button
                      type="button"
                      onClick={() => setEntities(entities.filter(c => c !== ent))}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Launch Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !launchDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {launchDate ? format(launchDate, "PPP") : "Pick launch date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={launchDate}
                  onSelect={setLaunchDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lpUrl">Landing Page URL</Label>
            <Input 
              id="lpUrl" 
              type="url"
              value={lpUrl} 
              onChange={(e) => setLpUrl(e.target.value)} 
              placeholder="https://..." 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creatives">Creative Assets Link</Label>
            <Input 
              id="creatives" 
              type="url"
              value={creativesLink} 
              onChange={(e) => setCreativesLink(e.target.value)} 
              placeholder="https://..." 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="captions">Ad Copy & Captions</Label>
            <Textarea 
              id="captions" 
              value={captions} 
              onChange={(e) => setCaptions(e.target.value)} 
              placeholder="Enter ad captions and copy" 
              rows={3} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Mission Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">🚧 Prep</SelectItem>
                <SelectItem value="live">🛰️ Live</SelectItem>
                <SelectItem value="stopped">☄️ Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "🚀 Create Mission"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
