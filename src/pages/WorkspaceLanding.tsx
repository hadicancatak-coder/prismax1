import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useBoards } from "@/hooks/useBoards";
import { BoardCard } from "@/components/workspace/BoardCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Users, Settings } from "lucide-react";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
}

export default function WorkspaceLanding() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { boards, loading, toggleStar, getBoardsByWorkspace } = useBoards();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  const loadWorkspace = async () => {
    if (!workspaceId) return;

    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", workspaceId)
      .single();

    if (error) {
      console.error("Error loading workspace:", error);
      setLoadingWorkspace(false);
      return;
    }

    if (data) {
      setWorkspace(data);
    }

    setLoadingWorkspace(false);
  };

  const workspaceBoards = workspaceId ? getBoardsByWorkspace(workspaceId) : [];
  const Icon = workspace?.icon ? (Icons[workspace.icon as keyof typeof Icons] as LucideIcon) : Icons.Folder;

  const getRelativeTime = (date?: string) => {
    if (!date) return "Never";
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loadingWorkspace || loading) {
    return (
      <div className="px-4 md:px-8 lg:px-12 xl:px-24 py-8 space-y-8">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="px-4 md:px-8 lg:px-12 xl:px-24 py-8">
        <div className="text-center space-y-4">
          <h1 className="text-page-title">Workspace Not Found</h1>
          <Button onClick={() => navigate("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-24 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <header className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div 
              className="p-4 rounded-xl"
              style={{ backgroundColor: `${workspace.color || '#3B82F6'}15` }}
            >
              {Icon && <Icon className="h-8 w-8" style={{ color: workspace.color || '#3B82F6' }} />}
            </div>
            <div>
              <h1 className="text-page-title text-foreground mb-2">{workspace.name}</h1>
              <p className="text-body text-muted-foreground max-w-2xl">
                {workspace.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Members
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Boards</div>
          <div className="text-2xl font-bold text-foreground">{workspaceBoards.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Starred Boards</div>
          <div className="text-2xl font-bold text-foreground">
            {workspaceBoards.filter(b => b.is_starred).length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Access</div>
          <div className="text-2xl font-bold text-foreground">
            {workspaceBoards.reduce((sum, b) => sum + (b.access_count || 0), 0)}
          </div>
        </div>
      </div>

      {/* Boards Grid */}
      <section className="space-y-4">
        <h2 className="text-section-title text-foreground">Boards</h2>
        {workspaceBoards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {workspaceBoards
              .sort((a, b) => a.sort_order - b.sort_order)
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
                  stats={`${board.access_count || 0} views`}
                  lastUpdated={getRelativeTime(board.last_accessed_at)}
                  onStarToggle={toggleStar}
                />
              ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">No boards in this workspace yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
