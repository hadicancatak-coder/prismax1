import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Megaphone, Plus, CalendarIcon, Edit, Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function AnnouncementsSection() {
  const { user, userRole } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    setAnnouncements(data || []);
  };

  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Error", description: "Title and message are required", variant: "destructive" });
      return;
    }

    const { data: newAnnouncement, error } = await supabase
      .from("announcements")
      .insert({
        title: title.trim(),
        message: message.trim(),
        priority,
        expires_at: expiresAt?.toISOString(),
        created_by: user?.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    const { data: allUsers } = await supabase.from("profiles").select("user_id");

    if (allUsers && allUsers.length > 0) {
      const notifications = allUsers.map((u) => ({
        user_id: u.user_id,
        type: "announcement",
        payload_json: {
          announcement_id: newAnnouncement.id,
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          priority: newAnnouncement.priority
        }
      }));

      await supabase.from("notifications").insert(notifications);
    }

    toast({ title: "Success", description: "Announcement created and sent to all users" });
    setDialogOpen(false);
    setTitle("");
    setMessage("");
    setPriority("normal");
    setExpiresAt(undefined);
    fetchAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Announcement deleted" });
      fetchAnnouncements();
      setDetailDialogOpen(false);
    }
  };

  const handleEditAnnouncement = async () => {
    if (!title.trim() || !message.trim() || !selectedAnnouncement) return;

    const { error } = await supabase
      .from("announcements")
      .update({
        title: title.trim(),
        message: message.trim(),
        priority,
        expires_at: expiresAt?.toISOString(),
      })
      .eq("id", selectedAnnouncement.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Announcement updated" });
      setEditDialogOpen(false);
      setDetailDialogOpen(false);
      fetchAnnouncements();
    }
  };

  const handleBroadcastAgain = async (announcement: any) => {
    const { data: allUsers } = await supabase.from("profiles").select("user_id");

    if (allUsers && allUsers.length > 0) {
      const notifications = allUsers.map((u) => ({
        user_id: u.user_id,
        type: "announcement",
        payload_json: {
          announcement_id: announcement.id,
          title: announcement.title,
          message: announcement.message,
          priority: announcement.priority
        }
      }));

      const { error } = await supabase.from("notifications").insert(notifications);
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `Notification sent to ${allUsers.length} users` });
      }
    }
  };

  const openEditDialog = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setPriority(announcement.priority);
    setExpiresAt(announcement.expires_at ? new Date(announcement.expires_at) : undefined);
    setEditDialogOpen(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-warning text-warning-foreground";
      case "normal":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Announcements</h2>
        </div>
        {userRole === "admin" && (
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Announcement
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create Announcement</AlertDialogTitle>
                <AlertDialogDescription>
                  Send an announcement to all team members
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Announcement message"
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Expiration Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {expiresAt ? format(expiresAt, "PPP") : <span>No expiration</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expiresAt}
                        onSelect={setExpiresAt}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateAnnouncement} className="flex-1">
                    Create & Send
                  </Button>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <Card 
              key={announcement.id} 
              className="p-4 border-l-4 border-l-primary cursor-pointer hover:shadow-md transition-all"
              onClick={() => {
                setSelectedAnnouncement(announcement);
                setDetailDialogOpen(true);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPriorityColor(announcement.priority)}>
                      {announcement.priority}
                    </Badge>
                    <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{announcement.message}</p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    {announcement.expires_at && (
                      <span>Expires: {new Date(announcement.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <Megaphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No active announcements</p>
        </Card>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              {selectedAnnouncement?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Badge className={getPriorityColor(selectedAnnouncement?.priority || "normal")}>
              {selectedAnnouncement?.priority}
            </Badge>
            <p className="text-foreground">{selectedAnnouncement?.message}</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Created: {selectedAnnouncement && new Date(selectedAnnouncement.created_at).toLocaleDateString()}</span>
              {selectedAnnouncement?.expires_at && (
                <span>Expires: {new Date(selectedAnnouncement.expires_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          {userRole === "admin" && (
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => openEditDialog(selectedAnnouncement)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" onClick={() => handleBroadcastAgain(selectedAnnouncement)} className="gap-2">
                <Send className="h-4 w-4" />
                Broadcast Again
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteAnnouncement(selectedAnnouncement.id)} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Announcement title"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Announcement message"
                rows={4}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expiration Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiresAt ? format(expiresAt, "PPP") : <span>No expiration</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiresAt}
                    onSelect={setExpiresAt}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditAnnouncement}>Save Changes</Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
