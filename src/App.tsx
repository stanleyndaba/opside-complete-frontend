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
import Landing from "./pages/Landing";
import Sync from "./pages/Sync";
import { AuthProvider, RequireAuth } from "@/hooks/useAuth";

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
const About = lazy(() => import("./pages/About"));
const Careers = lazy(() => import("./pages/Careers"));

// New Evidence Pages
const EvidenceOnboarding = lazy(() => import("./pages/EvidenceOnboarding"));
const EvidenceSearch = lazy(() => import("./pages/EvidenceSearch"));

// Shock & Awe Flow Pages
const AmazonSandbox = lazy(() => import("./pages/AmazonSandbox"));
const AnalyzingScreen = lazy(() => import("./pages/AnalyzingScreen"));

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
