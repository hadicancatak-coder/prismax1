import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Board {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  route: string;
  icon?: string;
  color?: string;
  sort_order: number;
  workspace?: {
    name: string;
    color?: string;
  };
  is_starred?: boolean;
  last_accessed_at?: string;
  access_count?: number;
}

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (user) {
      loadBoards();
    }
  }, [user, userRole]);

  const loadBoards = async () => {
    if (!user) return;

    setLoading(true);

    // Get boards with workspace info and user preferences
    const { data: boardsData, error } = await supabase
      .from("boards")
      .select(`
        id,
        workspace_id,
        name,
        description,
        route,
        icon,
        color,
        sort_order,
        workspaces:workspace_id (
          name,
          color
        ),
        user_board_access:user_board_access!left (
          is_starred,
          last_accessed_at,
          access_count
        )
      `)
      .order("sort_order");

    if (error) {
      console.error("Error loading boards:", error);
      setLoading(false);
      return;
    }

    if (boardsData) {
      // Filter out Admin workspace boards for non-admin users
      const filtered = boardsData
        .filter((board: any) => {
          const workspace = Array.isArray(board.workspaces) ? board.workspaces[0] : board.workspaces;
          return workspace?.name !== 'Admin' || userRole === 'admin';
        })
        .map((board: any) => {
          const workspace = Array.isArray(board.workspaces) ? board.workspaces[0] : board.workspaces;
          const userAccess = Array.isArray(board.user_board_access) && board.user_board_access.length > 0
            ? board.user_board_access[0]
            : null;

          return {
            id: board.id,
            workspace_id: board.workspace_id,
            name: board.name,
            description: board.description || '',
            route: board.route,
            icon: board.icon || 'FileText',
            color: board.color,
            sort_order: board.sort_order,
            workspace: workspace ? {
              name: workspace.name,
              color: workspace.color,
            } : undefined,
            is_starred: userAccess?.is_starred || false,
            last_accessed_at: userAccess?.last_accessed_at,
            access_count: userAccess?.access_count || 0,
          };
        });

      setBoards(filtered);
    }

    setLoading(false);
  };

  const toggleStar = async (boardId: string) => {
    if (!user) return;

    const board = boards.find(b => b.id === boardId);
    if (!board) return;

    const newStarredState = !board.is_starred;

    // Optimistically update UI
    setBoards(prev => prev.map(b => 
      b.id === boardId ? { ...b, is_starred: newStarredState } : b
    ));

    // Update or insert user board access
    const { error } = await supabase
      .from("user_board_access")
      .upsert({
        user_id: user.id,
        board_id: boardId,
        is_starred: newStarredState,
        last_accessed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,board_id'
      });

    if (error) {
      console.error("Error toggling star:", error);
      // Revert on error
      setBoards(prev => prev.map(b => 
        b.id === boardId ? { ...b, is_starred: !newStarredState } : b
      ));
    }
  };

  const trackAccess = async (boardId: string) => {
    if (!user) return;

    await supabase.rpc('increment_board_access', {
      p_user_id: user.id,
      p_board_id: boardId,
    });
  };

  const getStarredBoards = () => boards.filter(b => b.is_starred);

  const getRecentlyViewed = () => {
    return boards
      .filter(b => b.last_accessed_at)
      .sort((a, b) => {
        const dateA = new Date(a.last_accessed_at || 0).getTime();
        const dateB = new Date(b.last_accessed_at || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 6);
  };

  const getBoardsByWorkspace = (workspaceId: string) => {
    return boards.filter(b => b.workspace_id === workspaceId);
  };

  return {
    boards,
    loading,
    toggleStar,
    trackAccess,
    getStarredBoards,
    getRecentlyViewed,
    getBoardsByWorkspace,
    reload: loadBoards,
  };
}
