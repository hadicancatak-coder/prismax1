import { useNavigate } from "react-router-dom";
import { BoardCard } from "@/components/workspace/BoardCard";
import { TOOL_COLORS } from "@/lib/constants";

const MOST_USED_TOOLS = [
  {
    id: "search-planner",
    name: "Search Planner",
    description: "Plan and manage search campaigns with advanced targeting",
    route: "/ads/search",
    icon: "Search",
    colorKey: "blue" as const,
  },
  {
    id: "utm-planner",
    name: "UTM Planner",
    description: "Build and track UTM campaign links efficiently",
    route: "/utm-planner",
    icon: "Link",
    colorKey: "purple" as const,
  },
  {
    id: "status-log",
    name: "Status Log",
    description: "Team status updates and activity tracking",
    route: "/operations/status-log",
    icon: "Activity",
    colorKey: "amber" as const,
  },
  {
    id: "location-intel",
    name: "Location Intel",
    description: "Geographic location intelligence and mapping",
    route: "/location-intelligence",
    icon: "MapPin",
    colorKey: "cyan" as const,
  },
  {
    id: "captions",
    name: "Caption Library",
    description: "Manage and reuse ad copy across campaigns",
    route: "/ads/captions",
    icon: "FileText",
    colorKey: "green" as const,
  },
  {
    id: "tasks",
    name: "Tasks",
    description: "Track and manage team tasks and deadlines",
    route: "/tasks",
    icon: "CheckSquare",
    colorKey: "red" as const,
  },
];

export function ToolsGallery() {
  const navigate = useNavigate();

  return (
    <section className="space-y-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-section-title text-foreground">Quick Access</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-lg">
        {MOST_USED_TOOLS.map((tool) => (
          <BoardCard
            key={tool.id}
            id={tool.id}
            name={tool.name}
            description={tool.description}
            route={tool.route}
            icon={tool.icon}
            color={TOOL_COLORS[tool.colorKey]}
          />
        ))}
      </div>
    </section>
  );
}
