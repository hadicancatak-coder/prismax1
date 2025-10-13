import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import CalendarView from "./pages/CalendarView";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import TeamBase from "./pages/TeamBase";
import AdsPage from "./pages/AdsPage";
import Backlog from "./pages/Backlog";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Campaigns from "./pages/Campaigns";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
