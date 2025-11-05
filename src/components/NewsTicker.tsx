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

  return announcements.length === 0 ? null : (
    <div 
      className="bg-white border-b border-gray-200 cursor-pointer"
      onClick={() => navigate("/notifications")}
    >
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {announcements.map((announcement) => (
            <div key={announcement.id} className="flex-[0_0_100%] min-w-0 py-2 px-4">
              <div className="flex items-center justify-center gap-3">
                <Megaphone className="h-3.5 w-3.5 text-gray-600" />
                <span className="text-sm text-gray-900 font-medium">{announcement.title}</span>
                <span className="text-gray-400">·</span>
                <span className="text-sm text-gray-600 truncate">{announcement.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
