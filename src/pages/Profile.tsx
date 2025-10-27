import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { TaskCard } from "@/components/TaskCard";
import { Upload, Users, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { NotificationPreferences } from "@/components/NotificationPreferences";

const TEAMS = ["SocialUA", "PPC", "PerMar"];

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwnProfile = !userId || userId === user?.id;
  
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [tagline, setTagline] = useState("");
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any>({ completed: [], pending: [], blocked: [], failed: [] });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchTasks();
    fetchTeamMembers();
  }, [userId, user?.id]);

  const fetchProfile = async () => {
    const targetUserId = userId || user?.id;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", targetUserId).single();
    
    if (data) {
      setProfile(data);
      setName(data.name || "");
      setTitle(data.title || "");
      setPhoneNumber(data.phone_number || "");
      setTagline(data.tagline || "");
      setSelectedTeams((data.teams as string[]) || []);
    }
  };

  const fetchTeamMembers = async () => {
    const targetUserId = userId || user?.id;
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("teams")
      .eq("user_id", targetUserId)
      .single();

    if (currentProfile?.teams && currentProfile.teams.length > 0) {
      const { data } = await supabase
        .from("public_profiles")
        .select("user_id, name, username, avatar_url, title")
        .contains("teams", currentProfile.teams);

      setTeamMembers(data || []);
    }
  };

  const fetchTasks = async () => {
    const targetUserId = userId || user?.id;
    
    // Get the profile.id for the target user
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", targetUserId)
      .single();
    
    if (!profile) return;
    
    // Get task IDs assigned to this user
    const { data: assignedTaskIds } = await supabase
      .from("task_assignees")
      .select("task_id")
      .eq("user_id", profile.id);
    
    const taskIds = assignedTaskIds?.map(a => a.task_id) || [];
    
    // Fetch full task details
    const { data: allTasks } = await supabase
      .from("tasks")
      .select("*, profiles:created_by(name)")
      .in("id", taskIds.length > 0 ? taskIds : ['00000000-0000-0000-0000-000000000000']);

    if (allTasks) {
      setTasks({
        completed: allTasks.filter(t => t.status === "Completed"),
        pending: allTasks.filter(t => t.status === "Ongoing" || t.status === "Pending"),
        blocked: allTasks.filter(t => t.status === "Blocked"),
        failed: allTasks.filter(t => t.status === "Failed"),
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type (only PNG)
    if (file.type !== 'image/png') {
      toast({
        title: "Invalid file type",
        description: "Only PNG images are allowed",
        variant: "destructive"
      });
      e.target.value = ''; // Reset input
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Avatar must be under 2MB",
        variant: "destructive"
      });
      e.target.value = ''; // Reset input
      return;
    }

    setUploading(true);

    // Generate cryptographically safe filename
    const timestamp = Date.now();
    const randomStr = crypto.randomUUID();
    const filePath = `${user.id}/avatar_${timestamp}_${randomStr}.png`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);

    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
    } else {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      
      if (updateError) {
        toast({ title: "Error", description: updateError.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Avatar updated" });
        fetchProfile();
      }
    }
    setUploading(false);
  };

  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ 
        name, 
        title, 
        phone_number: phoneNumber, 
        tagline,
        teams: selectedTeams as any
      })
      .eq("user_id", user?.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated" });
      setEditing(false);
      fetchProfile();
      fetchTeamMembers();
    }
  };

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team]
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!profile) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <Card className="p-8">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl">{profile.name?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <label>
                <Button variant="outline" size="sm" disabled={uploading} asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploading ? "Uploading..." : "Upload Photo"}
                  </span>
                </Button>
                <input type="file" accept="image/png" onChange={handleAvatarUpload} className="hidden" />
              </label>
            )}
          </div>

          <div className="flex-1 space-y-4">
            {editing && isOwnProfile ? (
              <>
                <div>
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Senior Developer" />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Tagline</Label>
                  <Textarea value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="A short bio..." />
                </div>
                <div>
                  <Label className="mb-3 block">Teams</Label>
                  <div className="space-y-2">
                    {TEAMS.map((team) => (
                      <div key={team} className="flex items-center gap-2">
                        <Checkbox
                          id={team}
                          checked={selectedTeams.includes(team)}
                          onCheckedChange={() => toggleTeam(team)}
                        />
                        <Label htmlFor={team} className="cursor-pointer">
                          {team}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Save</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                {profile.title && <p className="text-lg text-muted-foreground">{profile.title}</p>}
                {profile.tagline && <p className="text-sm">{profile.tagline}</p>}
                {profile.phone_number && <p className="text-sm text-muted-foreground">{profile.phone_number}</p>}
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                
                {profile.kpis && (
                  <div className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
                    </div>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {profile.kpis}
                      </p>
                    </div>
                  </div>
                )}
                
                {profile.teams && profile.teams.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {profile.teams.map((team: string) => (
                      <Badge key={team} variant="secondary">
                        {team}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {isOwnProfile && (
                  <Button onClick={() => setEditing(true)} variant="outline">Edit Profile</Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Notification Preferences - Only for own profile */}
      {isOwnProfile && (
        <NotificationPreferences />
      )}

      {/* Team Members */}
      {teamMembers.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Users className="h-5 w-5" />
            Team Members ({teamMembers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Card
                key={member.user_id}
                className="p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/profile/${member.user_id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{member.name}</h3>
                    {member.username && (
                      <p className="text-sm text-muted-foreground truncate">
                        @{member.username}
                      </p>
                    )}
                    {member.title && (
                      <p className="text-xs text-muted-foreground truncate">
                        {member.title}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      <Tabs defaultValue="completed" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="completed">Completed ({tasks.completed.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({tasks.pending.length})</TabsTrigger>
          <TabsTrigger value="blocked">Blocked ({tasks.blocked.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({tasks.failed.length})</TabsTrigger>
        </TabsList>

        {["completed", "pending", "blocked", "failed"].map((status) => (
          <TabsContent key={status} value={status} className="mt-6 space-y-4">
            {tasks[status].length > 0 ? (
              tasks[status].map((task: any) => (
                <TaskCard
                  key={task.id}
                  task={{
                    id: task.id,
                    title: task.title,
                    description: task.description || "",
                    assignee: "Multi-assignee",
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.due_at,
                    timeTracked: "0h 00m",
                    entity: task.entity || undefined,
                    recurrence: task.recurrence_rrule ? (task.recurrence_rrule.includes('DAILY') ? 'daily' : task.recurrence_rrule.includes('WEEKLY') ? 'weekly' : task.recurrence_rrule.includes('MONTHLY') ? 'monthly' : 'none') : 'none',
                  }}
                />
              ))
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No {status} tasks</p>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
