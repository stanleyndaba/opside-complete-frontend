import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationsProvider from '@/components/providers/NotificationsProvider';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DemoOverlay from "@/components/demo/DemoOverlay";
import AdminOnly from "@/components/routes/AdminOnly";
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { TenantProvider } from '@/contexts/TenantContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PublicChatNode } from "@/components/chat/PublicChatNode";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

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
const ResolveCase = lazy(() => import("./pages/ResolveCase"));
const DataUpload = lazy(() => import("./pages/DataUpload"));
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
const ReconnectProvider = lazy(() => import('./pages/ReconnectProvider'));
const TenantRedirect = lazy(() => import('./components/navigation/TenantRedirect').then(module => ({ default: module.TenantRedirect })));

// Analytics injection
const OAuthProviderSandbox = lazy(() => import("./pages/OAuthProviderSandbox"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const OAuthCallbackRedirect = lazy(() => import("./pages/OAuthCallbackRedirect"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));
const StripeCallback = lazy(() => import("./pages/StripeCallback"));
const Careers = lazy(() => import("./pages/Careers"));
const Docs = lazy(() => import("./pages/Docs"));
const Privacy = lazy(() => import("./pages/Privacy"));
const UpcomingPayments = lazy(() => import("./pages/UpcomingPayments"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const RevenueModel = lazy(() => import("./pages/RevenueModel"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminUsersAndIntegrations = lazy(() => import("./pages/AdminUsersAndIntegrations"));
const AmazonAuthTest = lazy(() => import("./pages/AmazonAuthTest"));
const Agent1Test = lazy(() => import("./pages/Agent1Test"));
const Terms = lazy(() => import("./pages/Terms"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const LearningInsights = lazy(() => import("./pages/LearningInsights"));
const AdminRevenue = lazy(() => import("./pages/AdminRevenue"));
const QueueDashboard = lazy(() => import("./pages/QueueDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const Sales = lazy(() => import("./pages/Sales"));
const UltraBeta = lazy(() => import("./pages/UltraBeta"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const PricingAdjust = lazy(() => import("./pages/PricingAdjust"));
const StandardAgreement = lazy(() => import("./pages/StandardAgreement"));


// New Evidence Pages
const EvidenceOnboarding = lazy(() => import("./pages/EvidenceOnboarding"));
const EvidenceSearch = lazy(() => import("./pages/EvidenceSearch"));
const MarginBoard = lazy(() => import("./pages/MarginBoard"));
const Branding = lazy(() => import("./pages/Branding"));

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
    <ThemeProvider>
      <TooltipProvider>
      <CurrencyProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SmoothScrollProvider>
            <TenantProvider>
              <NotificationsProvider>
                <Suspense fallback={<RouteSkeleton />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                  </Routes>
                  <DemoOverlay />
                  <PublicChatNode />
                </Suspense>
              </NotificationsProvider>
            </TenantProvider>
          </SmoothScrollProvider>
        </BrowserRouter>
      </CurrencyProvider>
        </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

