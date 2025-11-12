import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, Users, Shield, AlertCircle, Activity, FileText, ShieldCheck, Database } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentTab = location.pathname.split('/')[2] || 'overview';

  const handleTabChange = (value: string) => {
    navigate(`/admin/${value}`);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-12 py-6 lg:py-8 bg-background min-h-screen space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-page-title">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage system settings and monitor activity</p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6 lg:space-y-8">
        <TabsList className="grid grid-cols-4 sm:grid-cols-8 w-full lg:w-auto border-b border-border overflow-x-auto">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="selectors" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Selectors</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Errors</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
        </TabsList>

        <Outlet />
      </Tabs>
    </div>
  );
}
