import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GlobalBubbleMenu } from "@/components/editor/GlobalBubbleMenu";
import { lazy, Suspense } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Overview = lazy(() => import("./pages/admin/Overview"));
const UsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const Config = lazy(() => import("./pages/admin/Config"));
const SecurityPage = lazy(() => import("./pages/admin/SecurityPage"));
const Logs = lazy(() => import("./pages/admin/Logs"));
const Operations = lazy(() => import("./pages/Operations"));
const StatusLog = lazy(() => import("./pages/StatusLog"));
const GoogleSheetsReports = lazy(() => import("./pages/GoogleSheetsReports"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const TeamBase = lazy(() => import("./pages/TeamBase"));
const SearchPlanner = lazy(() => import("./pages/SearchPlanner"));
const DisplayPlanner = lazy(() => import("./pages/DisplayPlanner"));
const SavedElementsPage = lazy(() => import("./pages/SavedElementsPage"));
const Backlog = lazy(() => import("./pages/Backlog"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const MfaSetup = lazy(() => import("./pages/MfaSetup"));
const MfaVerify = lazy(() => import("./pages/MfaVerify"));
const Security = lazy(() => import("./pages/Security"));
const About = lazy(() => import("./pages/About"));
const UtmPlanner = lazy(() => import("./pages/UtmPlanner"));
const CopyWriter = lazy(() => import("./pages/CopyWriter"));
const LocationIntelligence = lazy(() => import("./pages/LocationIntelligence"));
const WebIntel = lazy(() => import("./pages/WebIntel"));
const ComplianceApproval = lazy(() => import("./pages/ComplianceApproval"));
const PublicComplianceReview = lazy(() => import("./pages/PublicComplianceReview"));
const KPIs = lazy(() => import("./pages/KPIs"));
const AuditLogDetail = lazy(() => import("./components/operations/AuditLogDetail").then(m => ({ default: m.AuditLogDetail })));


const App = () => (
  <ErrorBoundary>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <GlobalBubbleMenu />
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/mfa-setup" element={<ProtectedRoute><MfaSetup /></ProtectedRoute>} />
              <Route path="/mfa-verify" element={<ProtectedRoute><MfaVerify /></ProtectedRoute>} />
              <Route path="/review/:token" element={<PublicComplianceReview />} />
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
                <Route path="/operations/custom-reports" element={<GoogleSheetsReports />} />
                <Route path="/operations/:id" element={<AuditLogDetail />} />
                <Route path="/copywriter" element={<CopyWriter />} />
                <Route path="/security" element={<Security />} />
                <Route path="/kpis" element={<KPIs />} />
                <Route path="/location-intelligence" element={<LocationIntelligence />} />
                <Route path="/web-intel" element={<WebIntel />} />
                <Route path="/compliance-approval" element={<ComplianceApproval />} />
                <Route path="/about" element={<About />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </ErrorBoundary>
);

export default App;
