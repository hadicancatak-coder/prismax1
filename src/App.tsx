import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const CalendarView = lazy(() => import("./pages/CalendarView"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const TeamBase = lazy(() => import("./pages/TeamBase"));
const AdsPage = lazy(() => import("./pages/AdsPage"));
const Backlog = lazy(() => import("./pages/Backlog"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-muted-foreground">Loading...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/admin-panel" element={<AdminPanel />} />
              <Route path="/team-base" element={<TeamBase />} />
              <Route path="/backlog" element={<Backlog />} />
              <Route path="/ads" element={<AdsPage />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile/:userId?" element={<Profile />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/activity-log" element={<ActivityLog />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
