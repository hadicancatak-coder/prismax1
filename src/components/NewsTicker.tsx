import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, X } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function NewsTicker() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("ticker-announcements")
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
      .order("created_at", { ascending: false })
      .limit(5);

    setAnnouncements(data || []);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-orange-500 text-white";
      case "normal":
        return "bg-primary text-primary-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (announcements.length === 0) return null;

  return (
    <>
      <div className="bg-muted border border-border rounded overflow-hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {announcements.map((announcement) => (
              <div 
                key={announcement.id} 
                className="flex-[0_0_100%] min-w-0 p-3 cursor-pointer hover:bg-muted/80 transition-smooth"
                onClick={() => setSelectedAnnouncement(announcement)}
              >
                <div className="flex items-center justify-center gap-3">
                  <Megaphone className="h-4 w-4 text-primary flex-shrink-0" />
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority}
                  </Badge>
                  <span className="font-medium text-foreground">{announcement.title}</span>
                  <span className="text-muted-foreground">-</span>
                  <span className="text-body text-muted-foreground truncate">{announcement.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {selectedAnnouncement?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(selectedAnnouncement?.priority)}>
                {selectedAnnouncement?.priority}
              </Badge>
              <span className="text-metadata text-muted-foreground">
                {selectedAnnouncement?.created_at && new Date(selectedAnnouncement.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-body text-foreground whitespace-pre-wrap">
              {selectedAnnouncement?.message}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
