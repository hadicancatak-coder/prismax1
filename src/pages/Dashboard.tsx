import { useAuth } from "@/hooks/useAuth";
import { NewsTicker } from "@/components/NewsTicker";
import { ToolsGallery } from "@/components/dashboard/ToolsGallery";
import { MyTasks } from "@/components/dashboard/MyTasks";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-background page-transition">
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12 py-12 space-y-12">
        <header>
          <h1 className="text-page-title mb-2">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-body text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <NewsTicker />

        <ToolsGallery />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <MyTasks />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
