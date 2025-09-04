
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Stocks from "./pages/Stocks";
import Markets from "./pages/Markets";
import Currencies from "./pages/Currencies";
import Global from "./pages/Global";
import Portfolio from "./pages/Portfolio";
import Performance from "./pages/Performance";
import Analysis from "./pages/Analysis";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import IntegrationsHub from "./pages/IntegrationsHub";
import Recoveries from "./pages/Recoveries";
import CaseDetail from "./pages/CaseDetail";
import SmartInventorySync from "./pages/SmartInventorySync";
import EvidenceLocker from "./pages/EvidenceLocker";
import DocumentDetail from "./pages/DocumentDetail";
import Billing from "./pages/Billing";
import TeamManagement from "./pages/TeamManagement";
import ExportCenter from "./pages/ExportCenter";
import NotificationHub from "./pages/NotificationHub";
import ApiAccess from "./pages/ApiAccess";
import Help from "./pages/Help";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/stocks" element={<Stocks />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/currencies" element={<Currencies />} />
          <Route path="/global" element={<Global />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/integrations-hub" element={<IntegrationsHub />} />
          <Route path="/recoveries" element={<Recoveries />} />
          <Route path="/recoveries/:caseId" element={<CaseDetail />} />
          <Route path="/smart-inventory-sync" element={<SmartInventorySync />} />
          <Route path="/evidence-locker" element={<EvidenceLocker />} />
          <Route path="/evidence-locker/document/:documentId" element={<DocumentDetail />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/team-management" element={<TeamManagement />} />
          <Route path="/export" element={<ExportCenter />} />
          <Route path="/notifications" element={<NotificationHub />} />
          <Route path="/api" element={<ApiAccess />} />
          <Route path="/help" element={<Help />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
