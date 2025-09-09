
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import IntegrationsHub from "./pages/IntegrationsHub";
import Recoveries from "./pages/Recoveries";
import CaseDetail from "./pages/CaseDetail";
import EvidenceLocker from "./pages/EvidenceLocker";
import DocumentDetail from "./pages/DocumentDetail";
import Billing from "./pages/Billing";
import TeamManagement from "./pages/TeamManagement";
import ExportCenter from "./pages/ExportCenter";
import NotificationHub from "./pages/NotificationHub";
import ApiAccess from "./pages/ApiAccess";
import Help from "./pages/Help";
import WhatsNew from "./pages/WhatsNew";
import Landing from "./pages/Landing";
import Sync from "./pages/Sync";
import { AuthProvider, RequireAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            {/* Authenticated */}
            <Route path="/integrations-hub" element={<RequireAuth><IntegrationsHub /></RequireAuth>} />
            <Route path="/sync" element={<RequireAuth><Sync /></RequireAuth>} />
            <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
            <Route path="/recoveries" element={<RequireAuth><Recoveries /></RequireAuth>} />
            <Route path="/recoveries/:caseId" element={<RequireAuth><CaseDetail /></RequireAuth>} />
            <Route path="/evidence-locker" element={<RequireAuth><EvidenceLocker /></RequireAuth>} />
            <Route path="/evidence-locker/document/:documentId" element={<RequireAuth><DocumentDetail /></RequireAuth>} />
            <Route path="/billing" element={<RequireAuth><Billing /></RequireAuth>} />
            <Route path="/team-management" element={<RequireAuth><TeamManagement /></RequireAuth>} />
            <Route path="/export" element={<RequireAuth><ExportCenter /></RequireAuth>} />
            <Route path="/notifications" element={<RequireAuth><NotificationHub /></RequireAuth>} />
            <Route path="/api" element={<RequireAuth><ApiAccess /></RequireAuth>} />
            <Route path="/help" element={<RequireAuth><Help /></RequireAuth>} />
            <Route path="/whats-new" element={<RequireAuth><WhatsNew /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
