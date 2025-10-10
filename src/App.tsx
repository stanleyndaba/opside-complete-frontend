import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
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
import Login from "./pages/Login";
import Claims from "./pages/Claims";
import Validation from "./pages/Validation";
import Monitoring from "./pages/Monitoring";
import { ProtectedRoute } from "@/components/routing/ProtectedRoute";
import { AuthProvider } from "@/providers/AuthProvider";
import { ErrorBoundary } from "@/components/errors/ErrorBoundary";

// Route-level code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("@/components/layout/Dashboard").then(m => ({ default: m.Dashboard })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Sync = lazy(() => import("./pages/Sync"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const IntegrationsHub = lazy(() => import("./pages/IntegrationsHub"));
const Recoveries = lazy(() => import("./pages/Recoveries"));
const CaseDetail = lazy(() => import("./pages/CaseDetail"));
const SmartInventorySync = lazy(() => import("./pages/SmartInventorySync"));
const EvidenceLocker = lazy(() => import("./pages/EvidenceLocker"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail"));
const Billing = lazy(() => import("./pages/Billing"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const ExportCenter = lazy(() => import("./pages/ExportCenter"));
const NotificationHub = lazy(() => import("./pages/NotificationHub"));
const ApiAccess = lazy(() => import("./pages/ApiAccess"));
const ApiLanding = lazy(() => import("./pages/ApiLanding"));
const Help = lazy(() => import("./pages/Help"));
const WhatsNew = lazy(() => import("./pages/WhatsNew"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));
const StripeCallback = lazy(() => import("./pages/StripeCallback"));
const AutomationRules = lazy(() => import("./pages/AutomationRules"));
const Thresholds = lazy(() => import("./pages/Thresholds"));
const Whitelist = lazy(() => import("./pages/Whitelist"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 2,
    },
    mutations: {
      retry: 1,
    },
  },
});

const RouteSkeleton = () => (
  <div className="p-6 space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-2/3" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  </div>
);

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
