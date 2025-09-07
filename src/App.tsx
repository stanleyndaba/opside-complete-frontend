
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
import WhatsNew from "./pages/WhatsNew";
import Login from "./pages/Login";
import Claims from "./pages/Claims";
import Validation from "./pages/Validation";
import Monitoring from "./pages/Monitoring";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { AuthProvider } from "@/providers/AuthProvider";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/stocks" element={<ProtectedRoute><Stocks /></ProtectedRoute>} />
            <Route path="/markets" element={<ProtectedRoute><Markets /></ProtectedRoute>} />
            <Route path="/currencies" element={<ProtectedRoute><Currencies /></ProtectedRoute>} />
            <Route path="/global" element={<ProtectedRoute><Global /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/integrations-hub" element={<ProtectedRoute><IntegrationsHub /></ProtectedRoute>} />
            <Route path="/recoveries" element={<ProtectedRoute><Recoveries /></ProtectedRoute>} />
            <Route path="/recoveries/:caseId" element={<ProtectedRoute><CaseDetail /></ProtectedRoute>} />
            <Route path="/smart-inventory-sync" element={<ProtectedRoute><SmartInventorySync /></ProtectedRoute>} />
            <Route path="/evidence-locker" element={<ProtectedRoute><EvidenceLocker /></ProtectedRoute>} />
            <Route path="/evidence-locker/document/:documentId" element={<ProtectedRoute><DocumentDetail /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/team-management" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/export" element={<ProtectedRoute><ExportCenter /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationHub /></ProtectedRoute>} />
            <Route path="/api" element={<ProtectedRoute><ApiAccess /></ProtectedRoute>} />
            <Route path="/whats-new" element={<ProtectedRoute><WhatsNew /></ProtectedRoute>} />
            <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
            <Route path="/validation" element={<ProtectedRoute><Validation /></ProtectedRoute>} />
            <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
