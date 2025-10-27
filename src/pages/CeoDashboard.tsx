import { Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CeoSidebar } from "@/components/CeoSidebar";
import SpotinHeader from "@/components/SpotinHeader";
import { LogoutButton } from "@/components/LogoutButton";
import CeoOverview from "./ceo/CeoOverview";
import ReceptionistDashboard from "./ReceptionistDashboard";
import BaristaDashboard from "./BaristaDashboard";
import CommunityManagerDashboard from "./CommunityManagerDashboard";
import OperationsDashboard from "./OperationsDashboard";
import CrmDashboard from "./CrmDashboard";
import FinanceDashboard from "./FinanceDashboard";
import KPIManagement from "@/components/KPIManagement";
import RolesManagement from "@/components/RolesManagement";
import ManagementSettings from "./ManagementSettings";

const CeoDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SpotinHeader showClock />
      
      <SidebarProvider defaultOpen>
        <div className="flex min-h-[calc(100vh-64px)] w-full">
          <CeoSidebar />
          
          <main className="flex-1 overflow-auto">
            {/* Global Header with Trigger */}
            <div className="sticky top-0 z-10 h-12 flex items-center justify-between border-b bg-background/95 backdrop-blur px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <h2 className="text-sm font-medium text-muted-foreground">CEO Control Center</h2>
              </div>
              <LogoutButton variant="ghost" size="sm" />
            </div>

            {/* Main Content Area */}
            <div className="container mx-auto p-6">
              <Routes>
                <Route index element={<CeoOverview />} />
                <Route path="reception" element={<ReceptionistDashboard />} />
                <Route path="barista" element={<BaristaDashboard />} />
                <Route path="community" element={<CommunityManagerDashboard />} />
                <Route path="operations" element={<OperationsDashboard />} />
                <Route path="crm" element={<CrmDashboard />} />
                <Route path="finance" element={<FinanceDashboard />} />
                <Route path="analytics" element={<CeoOverview />} />
                <Route path="kpis" element={<KPIManagement />} />
                <Route path="roles" element={<RolesManagement />} />
                <Route path="settings" element={<ManagementSettings />} />
                <Route path="*" element={<Navigate to="/ceo" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default CeoDashboard;
