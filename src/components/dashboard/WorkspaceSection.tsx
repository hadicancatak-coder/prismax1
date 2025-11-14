import { useEffect, useState } from "react";
import { WorkspaceCard } from "@/components/workspace/WorkspaceCard";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Workspace {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  board_count?: number;
}

export function WorkspaceSection() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const { userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadWorkspaces();
  }, [userRole]);

  const loadWorkspaces = async () => {
    // Get workspaces with board counts
    const { data: workspacesData } = await supabase
      .from("workspaces")
      .select(`
        id,
        name,
        description,
        icon,
        color,
        boards:boards(count)
      `)
      .order("sort_order");

    if (workspacesData) {
      // Filter out Admin workspace for non-admin users
      const filtered = workspacesData.filter(w => 
        w.name !== 'Admin' || userRole === 'admin'
      );

      const formatted = filtered.map(w => ({
        id: w.id,
        name: w.name,
        description: w.description || '',
        icon: w.icon || 'Folder',
        color: w.color || '#3B82F6',
        board_count: Array.isArray(w.boards) ? w.boards.length : 0,
      }));

      setWorkspaces(formatted);
    }
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    // For now, navigate to the first board in the workspace
    // Later we can create workspace landing pages
    const firstBoardRoutes: Record<string, string> = {
      'Ads & Marketing': '/ads/search',
      'Operations': '/operations',
      'Intelligence': '/location-intel',
      'Admin': '/admin',
    };

    const route = firstBoardRoutes[workspace.name];
    if (route) {
      navigate(route);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-section-title text-foreground">Your Workspaces</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {workspaces.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            id={workspace.id}
            name={workspace.name}
            description={workspace.description}
            icon={workspace.icon}
            color={workspace.color}
            boardCount={workspace.board_count}
            onClick={() => handleWorkspaceClick(workspace)}
          />
        ))}
      </div>
    </section>
  );
}
