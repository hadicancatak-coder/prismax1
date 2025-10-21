import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import CalendarView from "./pages/CalendarView";
import AdminPanel from "./pages/AdminPanel";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import UsersManagement from "./pages/admin/UsersManagement";
import ErrorLogs from "./pages/admin/ErrorLogs";
import ApprovalsCenter from "./pages/admin/ApprovalsCenter";
import AuditLog from "./pages/admin/AuditLog";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import TeamBase from "./pages/TeamBase";
import AdsPage from "./pages/AdsPage";
import Backlog from "./pages/Backlog";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Campaigns from "./pages/Campaigns";
import ActivityLog from "./pages/ActivityLog";
import LaunchPad from "./pages/LaunchPad";
import Team from "./pages/Team";
import MfaSetup from "./pages/MfaSetup";
import MfaVerify from "./pages/MfaVerify";
import Security from "./pages/Security";
import About from "./pages/About";
import UtmPlanner from "./pages/UtmPlanner";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/mfa-setup" element={<ProtectedRoute><MfaSetup /></ProtectedRoute>} />
            <Route path="/mfa-verify" element={<ProtectedRoute><MfaVerify /></ProtectedRoute>} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="overview" element={<Overview />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="approvals" element={<ApprovalsCenter />} />
              <Route path="errors" element={<ErrorLogs />} />
              <Route path="activity" element={<ActivityLog />} />
              <Route path="audit" element={<AuditLog />} />
            </Route>
            <Route path="/team-base" element={<TeamBase />} />
            <Route path="/ads" element={<AdsPage />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile/:userId?" element={<Profile />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/launch-pad" element={<LaunchPad />} />
            <Route path="/utm-planner" element={<UtmPlanner />} />
            <Route path="/security" element={<Security />} />
            <Route path="/about" element={<About />} />
          </Route>
          <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
