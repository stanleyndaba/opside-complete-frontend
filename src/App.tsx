import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/sync" element={<Sync />} />
            {/* Market/Stocks pages removed for FBA MVP focus */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/integrations-hub" element={<IntegrationsHub />} />
            <Route path="/reports" element={<Reports />} />
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
            <Route path="/whats-new" element={<WhatsNew />} />
            <Route path="/automation/rules" element={<AutomationRules />} />
            <Route path="/automation/thresholds" element={<Thresholds />} />
            <Route path="/automation/whitelist" element={<Whitelist />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/oauth/success" element={<OAuthSuccess />} />
            <Route path="/oauth/stripe/callback" element={<StripeCallback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
