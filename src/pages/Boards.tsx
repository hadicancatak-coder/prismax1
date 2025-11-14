import { useState } from "react";
import { useBoards } from "@/hooks/useBoards";
import { BoardCard } from "@/components/workspace/BoardCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";

type SortOption = "recent" | "name" | "most-used";

export default function Boards() {
  const { boards, loading, toggleStar, getStarredBoards, trackAccess } = useBoards();
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const starredBoards = getStarredBoards();

  // Group boards by workspace
  const workspaceGroups = boards.reduce((acc, board) => {
    const workspaceName = board.workspace?.name || "Other";
    if (!acc[workspaceName]) {
      acc[workspaceName] = [];
    }
    acc[workspaceName].push(board);
    return acc;
  }, {} as Record<string, typeof boards>);

  // Filter boards based on search
  const filteredBoards = boards.filter(board =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    board.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort boards
  const sortedBoards = [...filteredBoards].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "most-used":
        return (b.access_count || 0) - (a.access_count || 0);
      case "recent":
      default:
        const dateA = new Date(a.last_accessed_at || 0).getTime();
        const dateB = new Date(b.last_accessed_at || 0).getTime();
        return dateB - dateA;
    }
  });

  const getRelativeTime = (date?: string) => {
    if (!date) return "Never";
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 lg:px-12 xl:px-24 py-8 space-y-8">
        <Skeleton className="h-12 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-24 py-8 space-y-8 animate-fade-in">
      <header className="space-y-4">
        <h1 className="text-page-title text-foreground">All Boards</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently Viewed</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="most-used">Most Used</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {starredBoards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <h2 className="text-section-title text-foreground">Starred</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {starredBoards.map((board) => (
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
      )}

      {Object.entries(workspaceGroups).map(([workspaceName, workspaceBoards]) => {
        const filteredWorkspaceBoards = workspaceBoards.filter(board =>
          sortedBoards.some(sb => sb.id === board.id)
        );

        if (filteredWorkspaceBoards.length === 0) return null;

        return (
          <section key={workspaceName} className="space-y-4">
            <h2 className="text-section-title text-foreground">{workspaceName}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWorkspaceBoards
                .sort((a, b) => {
                  switch (sortBy) {
                    case "name":
                      return a.name.localeCompare(b.name);
                    case "most-used":
                      return (b.access_count || 0) - (a.access_count || 0);
                    case "recent":
                    default:
                      const dateA = new Date(a.last_accessed_at || 0).getTime();
                      const dateB = new Date(b.last_accessed_at || 0).getTime();
                      return dateB - dateA;
                  }
                })
                .map((board) => (
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
      })}

      {sortedBoards.length === 0 && searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle>No boards found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No boards match your search "{searchQuery}". Try a different search term.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
