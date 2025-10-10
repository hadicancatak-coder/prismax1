import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, ExternalLink, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export default function Reports() {
  const { user, userRole } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("sheet");

  useEffect(() => {
    if (!user) return;
    fetchReports();

    // Real-time subscription
    const channel = supabase
      .channel("reports-changes")
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "reports" 
        },
        (payload) => {
          console.log("Report change detected:", payload);
          fetchReports();
        }
      )
      .subscribe((status) => {
        console.log("Reports subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching reports:", error);
    } else {
      console.log("Fetched reports:", data);
      setReports(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("reports").insert({ title, link, type, created_by: user?.id });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    
    toast({ title: "Success", description: "Report link added successfully" });
    setDialogOpen(false);
    setTitle("");
    setLink("");
    setType("sheet");
    
    // Immediately refetch to show the new report
    await fetchReports();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    
    toast({ title: "Success", description: "Report deleted" });
    
    // Immediately refetch to show the deletion
    await fetchReports();
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">Access shared Google Sheets and Slides</p>
        </div>
        {userRole === "admin" && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary hover:shadow-glow transition-all">
                <Plus className="h-4 w-4" />
                Add Report Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Report Link</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="link">Link</Label>
                  <Input id="link" type="url" value={link} onChange={(e) => setLink(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sheet">Google Sheet</SelectItem>
                      <SelectItem value="slide">Google Slides</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Add Report</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.id} className="p-6 hover-scale">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{report.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {report.type === "sheet" ? "Google Sheet" : report.type === "slide" ? "Google Slides" : "Link"}
                </p>
                <a href={report.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
                  Open Link <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              {userRole === "admin" && (
                <Button variant="ghost" size="sm" onClick={() => handleDelete(report.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
