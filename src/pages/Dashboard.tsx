import { useAuth } from "@/hooks/useAuth";
import { NewsTicker } from "@/components/NewsTicker";
import { ToolsGallery } from "@/components/dashboard/ToolsGallery";
import { WorkspaceSection } from "@/components/dashboard/WorkspaceSection";
import { RecentlyViewed } from "@/components/dashboard/RecentlyViewed";
import { MyTasks } from "@/components/dashboard/MyTasks";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-24 py-8 bg-background min-h-screen space-y-8">
      <header>
        <h1 className="text-page-title text-foreground mb-1">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h1>
        <p className="text-body text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      <NewsTicker />

      <ToolsGallery />

      <RecentlyViewed />

      <WorkspaceSection />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <MyTasks />
        <ActivityFeed />
      </div>
    </div>
  );
}
