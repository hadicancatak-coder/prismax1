import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TEAMS, MONTHS } from "@/lib/constants";

interface LaunchCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LaunchCampaignDialog({ open, onOpenChange, onSuccess }: LaunchCampaignDialogProps) {
  const [title, setTitle] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [creativesLink, setCreativesLink] = useState("");
  const [captions, setCaptions] = useState("");
  const [lpUrl, setLpUrl] = useState("");
  const [launchMonth, setLaunchMonth] = useState("");
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
    if (!title || selectedTeams.length === 0) {
      toast({ title: "Missing fields", description: "Title and team selection are required", variant: "destructive" });
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
          teams: selectedTeams,
          creatives_link: creativesLink,
          captions,
          lp_url: lpUrl,
          launch_month: launchMonth,
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

      toast({ title: "Campaign created!", description: "Ready for launch" });
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
    setSelectedTeams([]);
    setCreativesLink("");
    setCaptions("");
    setLpUrl("");
    setLaunchMonth("");
    setStatus("pending");
  };

  const toggleTeam = (team: string) => {
    setSelectedTeams(prev =>
      prev.includes(team) ? prev.filter(t => t !== team) : [...prev, team]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>🚀 Launch Setup</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Campaign Title *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q1 Brand Campaign" />
          </div>

          <div>
            <Label>Teams *</Label>
            <div className="flex gap-4 mt-2">
              {TEAMS.map(team => (
                <div key={team} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedTeams.includes(team)}
                    onCheckedChange={() => toggleTeam(team)}
                  />
                  <Label>{team}</Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="creatives">Creatives Link</Label>
            <Input id="creatives" value={creativesLink} onChange={(e) => setCreativesLink(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <Label htmlFor="captions">Captions</Label>
            <Textarea id="captions" value={captions} onChange={(e) => setCaptions(e.target.value)} placeholder="Ad copy and captions..." rows={3} />
          </div>

          <div>
            <Label htmlFor="lpUrl">Landing Page URL</Label>
            <Input id="lpUrl" value={lpUrl} onChange={(e) => setLpUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="month">Launch Month</Label>
              <Select value={launchMonth} onValueChange={setLaunchMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map(month => (
                    <SelectItem key={month} value={month}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
