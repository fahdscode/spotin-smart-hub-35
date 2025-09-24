import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "./pages/Landing";
import ClientPortal from "./pages/ClientPortal";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import AccountSettings from "./pages/AccountSettings";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import CeoDashboard from "./pages/CeoDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import BaristaDashboard from "./pages/BaristaDashboard";
import CommunityManagerDashboard from "./pages/CommunityManagerDashboard";
import CrmDashboard from "./pages/CrmDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="spotin-ui-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/client" element={<ClientPortal />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-panel" element={<AdminPanel />} />
            <Route path="/account-settings" element={<AccountSettings />} />
            <Route path="/receptionist" element={<ReceptionistDashboard />} />
            <Route path="/ceo" element={<CeoDashboard />} />
            <Route path="/old-client" element={<ClientDashboard />} />
            <Route path="/operations" element={<OperationsDashboard />} />
            <Route path="/barista" element={<BaristaDashboard />} />
            <Route path="/community" element={<CommunityManagerDashboard />} />
            <Route path="/crm" element={<CrmDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
