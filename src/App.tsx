import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import CeoDashboard from "./pages/CeoDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import BaristaDashboard from "./pages/BaristaDashboard";
import CommunityManagerDashboard from "./pages/CommunityManagerDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/receptionist" element={<ReceptionistDashboard />} />
          <Route path="/ceo" element={<CeoDashboard />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/operations" element={<OperationsDashboard />} />
          <Route path="/barista" element={<BaristaDashboard />} />
          <Route path="/community" element={<CommunityManagerDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
