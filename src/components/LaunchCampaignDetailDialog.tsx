import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Edit, Save, X, Building2, Rocket } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ENTITIES } from "@/lib/constants";

interface LaunchCampaignDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string | null;
  onUpdate?: () => void;
}

export function LaunchCampaignDetailDialog({ open, onOpenChange, campaignId, onUpdate }: LaunchCampaignDetailDialogProps) {
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teams, setTeams] = useState<string[]>([]);
  const [entity, setEntity] = useState<string[]>([]);
  const [launchDate, setLaunchDate] = useState<Date | undefined>();
  const [lpUrl, setLpUrl] = useState("");
  const [creativesLink, setCreativesLink] = useState("");
  const [captions, setCaptions] = useState("");
  const [status, setStatus] = useState("pending");
  const [jiraLinks, setJiraLinks] = useState<string[]>([]);
  const [newJiraLink, setNewJiraLink] = useState("");

  useEffect(() => {
    if (open && campaignId) {
      fetchCampaign();
    }
  }, [open, campaignId]);

  const fetchCampaign = async () => {
    if (!campaignId) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("launch_pad_campaigns")
      .select(`
        *,
        launch_campaign_assignees(
          user_id,
          profiles(name, avatar_url, username)
        )
      `)
      .eq("id", campaignId)
      .single();

    if (!error && data) {
      setCampaign(data);
      setTitle(data.title);
      setDescription(data.description || "");
      setTeams(data.teams || []);
      setEntity(data.entity || []);
      setLaunchDate(data.launch_date ? new Date(data.launch_date) : undefined);
      setLpUrl(data.lp_url || "");
      setCreativesLink(data.creatives_link || "");
      setCaptions(data.captions || "");
      setStatus(data.status || "pending");
      setJiraLinks(Array.isArray(data.jira_links) ? data.jira_links.filter((l): l is string => typeof l === 'string') : []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Mission title is required", variant: "destructive" });
      return;
    }

    if (teams.length === 0) {
      toast({ title: "Error", description: "At least one team is required", variant: "destructive" });
      return;
    }

    if (!launchDate) {
      toast({ title: "Error", description: "Launch date is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("launch_pad_campaigns")
      .update({
        title: title.trim(),
        description: description.trim() || null,
        teams,
        entity,
        launch_date: launchDate.toISOString(),
        lp_url: lpUrl.trim() || null,
        creatives_link: creativesLink.trim() || null,
        captions: captions.trim() || null,
        jira_links: jiraLinks,
        status
      })
      .eq("id", campaignId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Mission updated successfully" });
      setEditMode(false);
      await fetchCampaign();
      onUpdate?.();
    }
  };

  const toggleTeam = (team: string) => {
    setTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  const toggleCountry = (country: string) => {
    setEntity(prev =>
      prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
    );
  };

  if (loading || !campaign) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" />
              <DialogTitle className="text-2xl">
                {editMode ? "Edit Mission" : "Mission Details"}
              </DialogTitle>
            </div>
            {!editMode && (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <DialogDescription>
            {editMode ? "Update mission details" : "View mission information"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {editMode ? (
            // EDIT MODE
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Mission Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter mission title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mission Brief</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the mission objectives..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Launch Teams *</Label>
                <div className="flex gap-4">
                {["SocialUA", "PPC", "PerMar"].map((team) => (
                    <div key={team} className="flex items-center gap-2">
                      <Checkbox
                        id={team}
                        checked={teams.includes(team)}
                        onCheckedChange={() => toggleTeam(team)}
                      />
                      <Label htmlFor={team} className="cursor-pointer font-normal">
                        {team === "SocialUA" ? "Social UA" : team === "PerMar" ? "Performance Marketing" : team}
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
                      <Building2 className="mr-2 h-4 w-4" />
                      {entity.length === 0 ? "Select countries" : `${entity.length} selected`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4" align="start">
                    <div className="grid grid-cols-2 gap-3">
                      {ENTITIES.map((country) => (
                        <div key={country} className="flex items-center gap-2">
                          <Checkbox
                            id={`country-${country}`}
                            checked={entity.includes(country)}
                            onCheckedChange={() => toggleCountry(country)}
                          />
                          <Label htmlFor={`country-${country}`} className="cursor-pointer text-sm font-normal">
                            {country}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {entity.length > 0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {entity.map((country) => (
                      <Badge key={country} variant="outline">
                        🌍 {country}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Launch Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {launchDate ? format(launchDate, "PPP") : "Select date"}
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
                  value={lpUrl}
                  onChange={(e) => setLpUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="creativesLink">Creative Assets Link</Label>
                <Input
                  id="creativesLink"
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
                  placeholder="Enter ad copy and captions..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Jira Links</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Paste Atlassian/Jira link..."
                      value={newJiraLink}
                      onChange={(e) => setNewJiraLink(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newJiraLink.trim() && newJiraLink.includes('atlassian')) {
                            setJiraLinks([...jiraLinks, newJiraLink.trim()]);
                            setNewJiraLink("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (newJiraLink.trim() && newJiraLink.includes('atlassian')) {
                          setJiraLinks([...jiraLinks, newJiraLink.trim()]);
                          setNewJiraLink("");
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {jiraLinks.length > 0 && (
                    <div className="space-y-1">
                      {jiraLinks.map((link, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {link}
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setJiraLinks(jiraLinks.filter((_, i) => i !== idx))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Mission Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">🚧 In Prep</SelectItem>
                    <SelectItem value="live">🛰️ Live</SelectItem>
                    <SelectItem value="orbit">🌍 In Orbit</SelectItem>
                    <SelectItem value="paused">☄️ Paused</SelectItem>
                    <SelectItem value="stopped">🔴 Stopped</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditMode(false);
                  fetchCampaign();
                }}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            // VIEW MODE
            <>
              <div>
                <Label className="text-muted-foreground">Mission Title</Label>
                <h3 className="text-xl font-semibold mt-1">{campaign.title}</h3>
              </div>

              {campaign.description && (
                <div>
                  <Label className="text-muted-foreground">Mission Brief</Label>
                  <p className="text-sm mt-1">{campaign.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-muted-foreground">Launch Teams</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {campaign.teams?.map((team: string) => (
                      <Badge key={team} variant="secondary">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Target Countries</Label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {campaign.entity?.map((country: string) => (
                      <Badge key={country} variant="outline">
                        🌍 {country}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">Launch Date</Label>
                  <p className="mt-1 font-medium">
                    {campaign.launch_date ? format(new Date(campaign.launch_date), "PPP") : "Not set"}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className={
                      campaign.status === 'live' 
                        ? "bg-success/10 text-success border-success/20"
                        : campaign.status === 'orbit'
                        ? "bg-primary/10 text-primary border-primary/20"
                        : campaign.status === 'pending'
                        ? "bg-warning/10 text-warning border-warning/20"
                        : "bg-muted"
                    }>
                      {campaign.status === 'live' ? '🛰️ Live' : 
                       campaign.status === 'orbit' ? '🌍 In Orbit' :
                       campaign.status === 'pending' ? '🚧 In Prep' :
                       campaign.status === 'paused' ? '☄️ Paused' : '🔴 Stopped'}
                    </Badge>
                  </div>
                </div>
              </div>

              {(campaign.lp_url || campaign.creatives_link) && (
                <div className="space-y-2 border-t pt-4">
                  <Label className="text-muted-foreground">Links</Label>
                  <div className="space-y-2">
                    {campaign.lp_url && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Landing Page</p>
                        <a
                          href={campaign.lp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {campaign.lp_url}
                        </a>
                      </div>
                    )}
                    {campaign.creatives_link && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Creative Assets</p>
                        <a
                          href={campaign.creatives_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {campaign.creatives_link}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {campaign.captions && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Ad Copy & Captions</Label>
                  <p className="text-sm mt-2 whitespace-pre-wrap">{campaign.captions}</p>
                </div>
              )}

              {campaign.jira_links && campaign.jira_links.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground">Jira Links</Label>
                  <div className="space-y-1 mt-2">
                    {campaign.jira_links.map((link: string, idx: number) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {campaign.launch_campaign_assignees?.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground mb-3 block">Mission Crew ({campaign.launch_campaign_assignees.length})</Label>
                  <div className="flex flex-wrap gap-3">
                    {campaign.launch_campaign_assignees.map((assignee: any) => (
                      <div key={assignee.user_id} className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={assignee.profiles?.avatar_url} />
                          <AvatarFallback>
                            {assignee.profiles?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{assignee.profiles?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 text-xs text-muted-foreground border-t pt-4">
                <div>
                  <span className="font-medium">Created:</span> {format(new Date(campaign.created_at), "PPp")}
                </div>
                {campaign.updated_at !== campaign.created_at && (
                  <div>
                    <span className="font-medium">Updated:</span> {format(new Date(campaign.updated_at), "PPp")}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
