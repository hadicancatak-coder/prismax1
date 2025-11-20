import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalBubbleMenu } from "@/components/editor/GlobalBubbleMenu";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import CalendarView from "./pages/CalendarView";
import AdminLayout from "./pages/admin/AdminLayout";
import Overview from "./pages/admin/Overview";
import UsersManagement from "./pages/admin/UsersManagement";
import Config from "./pages/admin/Config";
import SecurityPage from "./pages/admin/SecurityPage";
import Logs from "./pages/admin/Logs";
import AdRulesManagement from "./pages/admin/AdRulesManagement";
import Operations from "./pages/Operations";
import StatusLog from "./pages/StatusLog";
import ReportsLog from "./pages/ReportsLog";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import TeamBase from "./pages/TeamBase";
import SearchPlanner from "./pages/SearchPlanner";
import DisplayPlanner from "./pages/DisplayPlanner";
import SavedElementsPage from "./pages/SavedElementsPage";
import Backlog from "./pages/Backlog";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ActivityLog from "./pages/ActivityLog";
import MfaSetup from "./pages/MfaSetup";
import MfaVerify from "./pages/MfaVerify";
import Security from "./pages/Security";
import About from "./pages/About";
import UtmPlanner from "./pages/UtmPlanner";
import CopyWriter from "./pages/CopyWriter";
import LocationIntelligence from "./pages/LocationIntelligence";
import WebIntel from "./pages/WebIntel";
import KPIs from "./pages/KPIs";
import CampaignsLog from "./pages/CampaignsLog";
import CampaignReview from "./pages/CampaignReview";
import { AuditLogDetail } from "./components/operations/AuditLogDetail";


const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Sonner position="bottom-right" expand={false} richColors closeButton />
          <GlobalBubbleMenu />
          <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/mfa-setup" element={<ProtectedRoute><MfaSetup /></ProtectedRoute>} />
              <Route path="/mfa-verify" element={<ProtectedRoute><MfaVerify /></ProtectedRoute>} />
              <Route path="/campaigns-log/review/:token" element={<CampaignReview />} />
              <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/calendar" element={<CalendarView />} />
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route path="overview" element={<Overview />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="config" element={<Config />} />
                  <Route path="security" element={<SecurityPage />} />
                  <Route path="logs" element={<Logs />} />
                  <Route path="ad-rules" element={<AdRulesManagement />} />
                </Route>
                <Route path="/team-base" element={<TeamBase />} />
                <Route path="/ads" element={<Navigate to="/ads/search" replace />} />
                <Route path="/ads/search" element={<SearchPlanner adType="search" key="search" />} />
                <Route path="/ads/display" element={<DisplayPlanner />} />
                <Route path="/ads/library" element={<SavedElementsPage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile/:userId?" element={<Profile />} />
                <Route path="/activity-log" element={<ActivityLog />} />
                <Route path="/utm-planner" element={<UtmPlanner />} />
                <Route path="/operations" element={<Operations />} />
                <Route path="/operations/status-log" element={<StatusLog />} />
                <Route path="/operations/custom-reports" element={<ReportsLog />} />
                <Route path="/operations/:id" element={<AuditLogDetail />} />
                <Route path="/copywriter" element={<CopyWriter />} />
                <Route path="/security" element={<Security />} />
                <Route path="/kpis" element={<KPIs />} />
                <Route path="/campaigns-log/review/:token" element={<CampaignReview />} />
                <Route path="/campaigns-log" element={<CampaignsLog />} />
                <Route path="/location-intelligence" element={<LocationIntelligence />} />
                <Route path="/web-intel" element={<WebIntel />} />
                <Route path="/about" element={<About />} />
              </Route>
              <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
