import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export function NewsTicker() {
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<any[]>([]);
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
    <div 
      className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/20 rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate("/notifications")}
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="flex-[0_0_100%] min-w-0 p-3">
              <div className="flex items-center justify-center gap-3">
                <Megaphone className="h-4 w-4 text-primary flex-shrink-0" />
                <Badge className={getPriorityColor(announcement.priority)}>
                  {announcement.priority}
                </Badge>
                <span className="font-semibold text-foreground">{announcement.title}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-sm text-muted-foreground truncate">{announcement.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
