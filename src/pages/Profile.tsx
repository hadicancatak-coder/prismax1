import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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
import { Upload } from "lucide-react";

export default function Profile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const isOwnProfile = !userId || userId === user?.id;
  
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [tagline, setTagline] = useState("");
  const [tasks, setTasks] = useState<any>({ completed: [], pending: [], blocked: [], failed: [] });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchTasks();
  }, [userId, user]);

  const fetchProfile = async () => {
    const targetUserId = userId || user?.id;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", targetUserId).single();
    
    if (data) {
      setProfile(data);
      setName(data.name || "");
      setTitle(data.title || "");
      setPhoneNumber(data.phone_number || "");
      setTagline(data.tagline || "");
    }
  };

  const fetchTasks = async () => {
    const targetUserId = userId || user?.id;
    
    const { data: allTasks } = await supabase
      .from("tasks")
      .select("*, profiles:created_by(name), assignee:assignee_id(name)")
      .or(`created_by.eq.${targetUserId},assignee_id.eq.${targetUserId}`);

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
      .update({ name, title, phone_number: phoneNumber, tagline })
      .eq("user_id", user?.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated" });
      setEditing(false);
      fetchProfile();
    }
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
                {isOwnProfile && (
                  <Button onClick={() => setEditing(true)} variant="outline">Edit Profile</Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>

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
                    assignee: task.assignee?.name || "Unassigned",
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.due_at,
                    timeTracked: "0h 00m",
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
