import { useNavigate } from "react-router-dom";
import { BoardCard } from "@/components/workspace/BoardCard";

const MOST_USED_TOOLS = [
  {
    id: "search-planner",
    name: "Search Planner",
    description: "Plan and manage search campaigns with advanced targeting",
    route: "/ads/search",
    icon: "Search",
    color: "#3B82F6",
  },
  {
    id: "utm-planner",
    name: "UTM Planner",
    description: "Build and track UTM campaign links efficiently",
    route: "/utm-planner",
    icon: "Link",
    color: "#8B5CF6",
  },
  {
    id: "status-log",
    name: "Status Log",
    description: "Team status updates and activity tracking",
    route: "/operations/status-log",
    icon: "Activity",
    color: "#F59E0B",
  },
  {
    id: "location-intel",
    name: "Location Intel",
    description: "Geographic location intelligence and mapping",
    route: "/location-intelligence",
    icon: "MapPin",
    color: "#06B6D4",
  },
  {
    id: "captions",
    name: "Caption Library",
    description: "Manage and reuse ad copy across campaigns",
    route: "/ads/captions",
    icon: "FileText",
    color: "#10B981",
  },
  {
    id: "tasks",
    name: "Tasks",
    description: "Track and manage team tasks and deadlines",
    route: "/tasks",
    icon: "CheckSquare",
    color: "#EF4444",
  },
];

export function ToolsGallery() {
  const navigate = useNavigate();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-section-title text-foreground">Quick Access</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {MOST_USED_TOOLS.map((tool) => (
          <BoardCard
            key={tool.id}
            id={tool.id}
            name={tool.name}
            description={tool.description}
            route={tool.route}
            icon={tool.icon}
            color={tool.color}
          />
        ))}
      </div>
    </section>
  );
}
