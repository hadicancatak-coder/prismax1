import { useBoards } from "@/hooks/useBoards";
import { BoardCard } from "@/components/workspace/BoardCard";
import { Clock } from "lucide-react";

export function RecentlyViewed() {
  const { getRecentlyViewed, toggleStar } = useBoards();
  const recentBoards = getRecentlyViewed();

  if (recentBoards.length === 0) {
    return null;
  }

  const getRelativeTime = (date?: string) => {
    if (!date) return "Never";
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-section-title text-foreground">Recently Viewed</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {recentBoards.map((board) => (
          <BoardCard
            key={board.id}
            id={board.id}
            name={board.name}
            description={board.description}
            route={board.route}
            icon={board.icon}
            color={board.color}
            isStarred={board.is_starred}
            lastUpdated={getRelativeTime(board.last_accessed_at)}
            onStarToggle={toggleStar}
          />
        ))}
      </div>
    </section>
  );
}
