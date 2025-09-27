import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ClientLogin from "./pages/ClientLogin";
import ManagementLogin from "./pages/ManagementLogin";
import ReceptionistDashboard from "./pages/ReceptionistDashboard";
import CeoDashboard from "./pages/CeoDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import BaristaDashboard from "./pages/BaristaDashboard";
import CrmDashboard from "./pages/CrmDashboard";
import CommunityManagerDashboard from "./pages/CommunityManagerDashboard";
import ClientSignup from "./pages/ClientSignup";
import PasswordReset from "./pages/PasswordReset";
import SuperAdminSetup from "./pages/SuperAdminSetup";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="spotin-ui-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/client-login" element={<ClientLogin />} />
              <Route path="/management-login" element={<ManagementLogin />} />
              <Route path="/client-signup" element={<ClientSignup />} />
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/super-admin-setup" element={<SuperAdminSetup />} />
              
              {/* Protected Client Routes */}
              <Route path="/client" element={
                <ProtectedRoute requiredRole="client" redirectTo="/client-login">
                  <ClientDashboard />
                </ProtectedRoute>
              } />
              
              {/* Protected Management Routes */}
              <Route path="/receptionist" element={
                <ProtectedRoute requiredRole="receptionist" redirectTo="/management-login">
                  <ReceptionistDashboard />
                </ProtectedRoute>
              } />
              <Route path="/ceo" element={
                <ProtectedRoute requiredRole={["ceo", "admin"]} redirectTo="/management-login">
                  <CeoDashboard />
                </ProtectedRoute>
              } />
              <Route path="/operations" element={
                <ProtectedRoute requiredRole="operations_manager" redirectTo="/management-login">
                  <OperationsDashboard />
                </ProtectedRoute>
              } />
              <Route path="/barista" element={
                <ProtectedRoute requiredRole="barista" redirectTo="/management-login">
                  <BaristaDashboard />
                </ProtectedRoute>
              } />
              <Route path="/crm" element={
                <ProtectedRoute requiredRole={["ceo", "admin"]} redirectTo="/management-login">
                  <CrmDashboard />
                </ProtectedRoute>
              } />
              <Route path="/community-manager" element={
                <ProtectedRoute requiredRole="community_manager" redirectTo="/management-login">
                  <CommunityManagerDashboard />
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
