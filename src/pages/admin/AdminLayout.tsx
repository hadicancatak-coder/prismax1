import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, Shield, AlertCircle, Activity, FileText } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentTab = location.pathname.split('/')[2] || 'overview';

  const handleTabChange = (value: string) => {
    navigate(`/admin/${value}`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10 -mx-6 -mt-6 px-6 py-6 mb-6 shadow-sm">
        <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage system settings and monitor activity</p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto bg-white border shadow-sm">
          <TabsTrigger 
            value="overview" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger 
            value="approvals" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Approvals</span>
          </TabsTrigger>
          <TabsTrigger 
            value="errors" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Errors</span>
          </TabsTrigger>
          <TabsTrigger 
            value="activity" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger 
            value="audit" 
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
        </TabsList>

        <Outlet />
      </Tabs>
    </div>
  );
}
