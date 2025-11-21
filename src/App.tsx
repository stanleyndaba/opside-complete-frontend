import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationsProvider from '@/components/providers/NotificationsProvider';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DemoOverlay from "@/components/demo/DemoOverlay";
import AdminOnly from "@/components/routes/AdminOnly";

// Route-level code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("@/components/layout/Dashboard").then(m => ({ default: m.Dashboard })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Sync = lazy(() => import("./pages/Sync"));
const SyncStatus = lazy(() => import("./pages/SyncStatus"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const IntegrationsHub = lazy(() => import("./pages/IntegrationsHub"));
const Recoveries = lazy(() => import("./pages/Recoveries"));
const CaseDetail = lazy(() => import("./pages/CaseDetail"));
const ResolveCase = lazy(() => import("./pages/ResolveCase"));
const SmartInventorySync = lazy(() => import("./pages/SmartInventorySync"));
const EvidenceLocker = lazy(() => import("./pages/EvidenceLocker"));
const DocumentDetail = lazy(() => import("./pages/DocumentDetail"));
const Billing = lazy(() => import("./pages/Billing"));
const InvoiceDetail = lazy(() => import("./pages/InvoiceDetail"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const ExportCenter = lazy(() => import("./pages/ExportCenter"));
const NotificationHub = lazy(() => import("./pages/NotificationHub"));
const ApiAccess = lazy(() => import("./pages/ApiAccess"));
const ApiLanding = lazy(() => import("./pages/ApiLanding"));
const Help = lazy(() => import("./pages/Help"));
const WhatsNew = lazy(() => import("./pages/WhatsNew"));
const ReconnectProvider = lazy(() => import("./pages/ReconnectProvider"));
const OAuthProviderSandbox = lazy(() => import("./pages/OAuthProviderSandbox"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const OAuthCallbackRedirect = lazy(() => import("./pages/OAuthCallbackRedirect"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));
const StripeCallback = lazy(() => import("./pages/StripeCallback"));
const About = lazy(() => import("./pages/About"));
const Careers = lazy(() => import("./pages/Careers"));
const Docs = lazy(() => import("./pages/Docs"));
const Privacy = lazy(() => import("./pages/Privacy"));
const UpcomingPayments = lazy(() => import("./pages/UpcomingPayments"));
const RevenueModel = lazy(() => import("./pages/RevenueModel"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminUsersAndIntegrations = lazy(() => import("./pages/AdminUsersAndIntegrations"));
const AmazonAuthTest = lazy(() => import("./pages/AmazonAuthTest"));
const Agent1Test = lazy(() => import("./pages/Agent1Test"));
const Terms = lazy(() => import("./pages/Terms"));

// New Evidence Pages
const EvidenceOnboarding = lazy(() => import("./pages/EvidenceOnboarding"));
const EvidenceSearch = lazy(() => import("./pages/EvidenceSearch"));

// Shock & Awe Flow Pages
const AmazonSandbox = lazy(() => import("./pages/AmazonSandbox"));
const AnalyzingScreen = lazy(() => import("./pages/AnalyzingScreen"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // Increased to 60s for better caching
      gcTime: 10 * 60_000, // Increased to 10 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: false, // Don't refetch on mount if data is fresh
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
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
        <NotificationsProvider>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/app" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} /> {/* Backend redirect compatibility */}
            <Route path="/sync" element={<Sync />} />
            <Route path="/sync-status" element={<SyncStatus />} />
            {/* Market/Stocks pages removed for FBA MVP focus */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/integrations-hub" element={<IntegrationsHub />} />
            <Route path="/integrations/reconnect/:provider" element={<ReconnectProvider />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/upcoming-payments" element={<UpcomingPayments />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/users-integrations" element={<AdminOnly><AdminUsersAndIntegrations /></AdminOnly>} />
            <Route path="/admin/amazon-auth-test" element={<AdminOnly><AmazonAuthTest /></AdminOnly>} />
            <Route path="/test/agent1" element={<Agent1Test />} />
            <Route path="/revenue-model" element={<AdminOnly><RevenueModel /></AdminOnly>} />
            <Route path="/recoveries" element={<Recoveries />} />
            <Route path="/recoveries/:caseId" element={<CaseDetail />} />
            <Route path="/recoveries/:caseId/resolve" element={<ResolveCase />} />
            <Route path="/smart-inventory-sync" element={<SmartInventorySync />} />
            <Route path="/evidence-locker" element={<EvidenceLocker />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/billing/invoice/:id" element={<InvoiceDetail />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/export-center" element={<ExportCenter />} />
            <Route path="/notifications" element={<NotificationHub />} />
            <Route path="/api-access" element={<ApiAccess />} />
            <Route path="/developer-api" element={<ApiLanding />} />
            <Route path="/help" element={<Help />} />
            <Route path="/whats-new" element={<WhatsNew />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/evidence-onboarding" element={<EvidenceOnboarding />} />
            <Route path="/evidence-search" element={<EvidenceSearch />} />
            
            {/* Auth & OAuth Routes */}
            <Route path="/auth/callback" element={<OAuthCallback />} />
            <Route path="/auth/callback/integrations-hub" element={<OAuthCallbackRedirect />} />
            <Route path="/auth/success" element={<OAuthSuccess />} />
            <Route path="/api/v1/integrations/amazon/callback" element={<OAuthCallback />} />
            <Route path="/stripe/callback" element={<StripeCallback />} />
            
            {/* Shock & Awe Flow Routes */}
            <Route path="/auth/amazon-sandbox" element={<AmazonSandbox />} />
            <Route path="/auth/analyzing" element={<AnalyzingScreen />} />
            <Route path="/auth/gmail-sandbox" element={<OAuthProviderSandbox />} />
            <Route path="/auth/outlook-sandbox" element={<OAuthProviderSandbox />} />
            <Route path="/auth/gdrive-sandbox" element={<OAuthProviderSandbox />} />
            <Route path="/auth/dropbox-sandbox" element={<OAuthProviderSandbox />} />
            
            {/* 404 Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <DemoOverlay />
        </Suspense>
        </NotificationsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
 
// redeploy
// Deployment trigger
