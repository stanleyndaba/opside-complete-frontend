import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationsProvider from '@/components/providers/NotificationsProvider';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DemoOverlay from "@/components/demo/DemoOverlay";
import AdminOnly from "@/components/routes/AdminOnly";
import AppAccessGate from "@/components/routes/AppAccessGate";
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { TenantProvider } from '@/contexts/TenantContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PublicChatNode } from "@/components/chat/PublicChatNode";
import { FoundingActivationGate } from "@/components/navigation/FoundingActivationGate";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { RouteErrorBoundary } from "@/components/error/RouteErrorBoundary";
import { usePrivateRouteRobots } from "@/hooks/usePrivateRouteRobots";
import { AnalyticsRouteTracker } from "@/components/AnalyticsRouteTracker";
import { PublicSiteInstrumentation } from "@/components/analytics/PublicSiteInstrumentation";

// Route-level code splitting
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("@/components/layout/Dashboard").then(m => ({ default: m.Dashboard })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const ConnectAmazonAccount = lazy(() => import("./pages/ConnectAmazonAccount"));
const Sync = lazy(() => import("./pages/Sync"));
const Settings = lazy(() => import("./pages/Settings"));
const IntegrationsHub = lazy(() => import("./pages/IntegrationsHub"));
const Recoveries = lazy(() => import("./pages/RecoveryPipelineAgent8"));
const ApprovedReimbursements = lazy(() => import("./pages/ApprovedReimbursements"));
const FilingPipeline = lazy(() => import("./pages/FilingPipeline"));
const DisputeCases = lazy(() => import("./pages/DisputeCases"));
const Appeals = lazy(() => import("./pages/Appeals"));
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
const Help = lazy(() => import("./pages/Help"));
const WhatsNew = lazy(() => import("./pages/WhatsNew"));
const ReconnectProvider = lazy(() => import('./pages/ReconnectProvider'));
const TenantRedirect = lazy(() => import('./components/navigation/TenantRedirect').then(module => ({ default: module.TenantRedirect })));

// Analytics injection
const OAuthProviderSandbox = lazy(() => import("./pages/OAuthProviderSandbox"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const OAuthCallbackRedirect = lazy(() => import("./pages/OAuthCallbackRedirect"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));
const SystemErrorPreview = lazy(() => import("./pages/SystemErrorPreview"));
const StripeCallback = lazy(() => import("./pages/StripeCallback"));
const Careers = lazy(() => import("./pages/Careers"));
const Docs = lazy(() => import("./pages/Docs"));
const Privacy = lazy(() => import("./pages/Privacy"));
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
const AmazonFbaReimbursement = lazy(() => import("./pages/AmazonFbaReimbursement"));
const ReimbursementAcquisitionPage = lazy(() => import("./pages/ReimbursementAcquisitionPage"));
const GetidaAlternative = lazy(() => import("./pages/GetidaAlternative"));
const SellerboardAlternative = lazy(() => import("./pages/SellerboardAlternative"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const EarlyAccess = lazy(() => import("./pages/EarlyAccess"));
const DocumentUploads = lazy(() => import("@/components/documentuploads"));
const PricingAdjust = lazy(() => import("./pages/PricingAdjust"));
const CurrencyMargin = lazy(() => import("./pages/CurrencyMargin"));
const Standalone = lazy(() => import("./pages/standalone"));
const StandardAgreement = lazy(() => import("./pages/StandardAgreement"));
const EmailActionRedirect = lazy(() => import("./pages/EmailActionRedirect"));
const AboutMargin = lazy(() => import("./pages/AboutMargin"));
const Research = lazy(() => import("./pages/Research"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const FoundingActivationStatus = lazy(() => import("./pages/FoundingActivationStatus"));
const DesignSimulate = lazy(() => import("./pages/designsimulate"));
const PlatformSimulate = lazy(() => import("./pages/platformsimulate"));
const DocumentSimulate = lazy(() => import("./pages/documentsimulate"));
const AuditSimulate = lazy(() => import("./pages/auditsimulate"));
const Audit = lazy(() => import("./pages/audit"));
const TimelineSimulation = lazy(() => import("./pages/TimelineSimulation"));
const ReadinessSimulate = lazy(() => import("./pages/ReadinessSimulate"));
const ReadinessSimulateTwo = lazy(() => import("./pages/readiness-simulate-two"));
const MemorySimulate = lazy(() => import("./pages/MemorySimulate"));
const ReconciliationSimulate = lazy(() => import("./pages/ReconciliationSimulate"));
const PlatformFly = lazy(() => import("./pages/platformfly"));
const AccuracyGraph = lazy(() => import("./pages/AccuracyGraph"));
const ScatterDesign = lazy(() => import("./pages/scatterdesign"));
const Countdown = lazy(() => import("./pages/Countdown"));
const Plane = lazy(() => import("./pages/plane"));
const ClosingCTA = lazy(() => import("./pages/ClosingCTA"));
const ClaimSimulate = lazy(() => import("@/components/ClaimSimulate"));
const FileSimulate = lazy(() => import("@/components/FileSimulate"));
const ApiConnection = lazy(() => import("@/components/api-connection"));
const EvidenceAnalysis = lazy(() => import("@/components/evidence-analysis"));
const EvidenceMatch = lazy(() => import("@/components/evidence-match"));
const RejectionLoop = lazy(() => import("@/components/rejection-loop"));
const ReportGeneration = lazy(() => import("@/components/report-generation"));
const AccuracyScaling = lazy(() => import("@/components/accuracy-scaling"));
const FeedbackLearning = lazy(() => import("@/components/feedback-learning"));
const AuditableWorkspace = lazy(() => import("@/components/auditable-workspace"));
const AuditableOutputs = lazy(() => import("@/components/auditable-outputs"));
const EveryCase = lazy(() => import("@/components/every-case"));
const OpenStatement = lazy(() => import("@/components/openstatement"));
const MarginTakesOver = lazy(() => import("@/components/margin-takes-over"));
const MarginReads = lazy(() => import("@/components/margin-reads"));
const EvidenceBeforeAsked = lazy(() => import("@/components/evidence-before-asked"));
const RecoveryLifecycle = lazy(() => import("@/components/recovery-lifecycle"));
const LearningRecovery = lazy(() => import("@/components/learning-recovery"));
const AuditReadyHistory = lazy(() => import("@/components/audit-ready-history"));
const AmazonAsks = lazy(() => import("@/components/Amazon-asks"));
const ClockSimulate = lazy(() => import("@/components/ClockSimulate"));
const RejectSimulate = lazy(() => import("@/components/RejectSimulate"));
const StareSimulate = lazy(() => import("@/components/StareSimulate"));
const DiscrepancySimulate = lazy(() => import("@/components/DiscrepancySimulate"));
const ReframeSimulate = lazy(() => import("@/components/ReframeSimulate"));
const DiscoverySimulate = lazy(() => import("@/components/DiscoverySimulate"));
const StatementSimulate = lazy(() => import("@/components/StatementSimulate"));
const ComparisonSimulate = lazy(() => import("@/components/ComparisonSimulate"));
const FinalPayoffSimulate = lazy(() => import("@/components/FinalPayoffSimulate"));
const Finality = lazy(() => import("@/components/Finality"));
const EvidenceChaseSimulate = lazy(() => import("@/components/EvidenceChaseSimulate"));
const EvidenceInsightSimulate = lazy(() => import("@/components/EvidenceInsightSimulate"));
const LaunchCountdownSimulate = lazy(() => import("@/components/LaunchCountdownSimulate"));
const GivingUpSimulate = lazy(() => import("@/components/GivingUpSimulate"));
const ResultsScrollSimulate = lazy(() => import("@/components/ResultsScrollSimulate"));
const SupplierChatSimulate = lazy(() => import("@/components/SupplierChatSimulate"));
const GoogleDriveSimulate = lazy(() => import("@/components/GoogleDriveSimulate"));
const IntroPainSimulate = lazy(() => import("@/components/IntroPainSimulate"));
const ActionSimulate = lazy(() => import("@/components/ActionSimulate"));
const RejectionScreenSimulate = lazy(() => import("@/components/RejectionScreenSimulate"));
const RejectCard = lazy(() => import("@/components/RejectCard"));
const ReAppealSimulate = lazy(() => import("@/components/ReAppealSimulate"));
const DiscrepancyStack = lazy(() => import("@/components/discrepancy-stack"));

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

const PRELOAD_ROUTES = [
  () => import("./pages/Index"),
  () => import("./pages/PricingAdjust"),
  () => import("./pages/EarlyAccess"),
  () => import("./pages/AboutMargin"),
  () => import("./pages/Sales"),
  () => import("./pages/Research"),
  () => import("./pages/Docs"),
  () => import("./pages/Contact"),
  () => import("./pages/Waitlist"),
  () => import("./pages/ClosingCTA"),
  () => import("./pages/PaymentSuccess"),
  () => import("./pages/FoundingActivationStatus"),
  () => import("./pages/Privacy"),
  () => import("./pages/Terms"),
  () => import("./pages/RefundPolicy"),
] as const;

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

const RouteSkeleton = () => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#FAFAF7] px-5 text-[#182026]">
    <div className="inline-flex max-w-full items-center justify-center gap-2.5 sm:gap-3">
      <img src="/logoimagetwo.png" alt="Margin" className="h-6 w-auto shrink-0 object-contain sm:h-7" />
      <span className="route-loading-brand-text brand-wordmark font-merriweather text-xl tracking-normal text-[#182026] sm:text-2xl">
        Margin
      </span>
    </div>
  </div>
);

const appRoute = (element: React.ReactNode) => (
  <AppAccessGate>{element}</AppAccessGate>
);

const PreserveSearchRedirect = ({ to }: { to: string }) => {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
};

const RoutePreloader = () => {
  useEffect(() => {
    const preloadRoutes = () => PRELOAD_ROUTES.forEach((loadRoute) => {
      void loadRoute();
    });

    const win = window as WindowWithIdleCallback;

    if (typeof win.requestIdleCallback === "function") {
      const idleId = win.requestIdleCallback(preloadRoutes, { timeout: 5000 });
      return () => win.cancelIdleCallback?.(idleId);
    }

    const fallbackId = window.setTimeout(preloadRoutes, 3000);
    return () => window.clearTimeout(fallbackId);
  }, []);

  return null;
};

import { SessionProvider } from '@/contexts/SessionContext';

// ... (route-level imports)

const RouteOverlays = () => {
  const location = useLocation();
  usePrivateRouteRobots(location.pathname);
  const hidePublicChat = ['/designsimulate', '/platformsimulate', '/documentsimulate', '/auditsimulate', '/platformfly', '/accuracy-graph', '/scatterdesign', '/countdown', '/plane', '/closingcta', '/finality', '/finalpayoffsimulate', '/amazon-asks', '/evidence-chase', '/evidence-insight', '/launch-countdown', '/giving-up', '/results-scroll', '/supplier-chat', '/google-drive', '/intro-pain', '/action-simulate', '/rejection-screen', '/card-review', '/api-connection', '/evidence-analysis', '/evidence-match', '/rejection-loop', '/report-generation', '/accuracy-scaling', '/feedback-learning', '/auditable-workspace', '/auditable-outputs', '/every-case', '/openstatement', '/margin-takes-over', '/margin-reads', '/evidence-before-asked', '/recovery-lifecycle', '/learning-recovery', '/audit-ready-history', '/AppealSimulate', '/appealsimulate', '/timeline-simulation', '/readiness-simulate', '/readiness-simulate-two', '/memory-simulate', '/reconciliation-simulate', '/currency-margin', '/standalone'].includes(location.pathname);

  return (
    <>
      <DemoOverlay />
      {!hidePublicChat ? <PublicChatNode /> : null}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider>
        <SessionProvider>
          <TooltipProvider>
            <CurrencyProvider>
              <TenantProvider>
                <NotificationsProvider>
                  <Toaster />
                  <Sonner />
                  <SmoothScrollProvider>
                    <RoutePreloader />
                      <RouteErrorBoundary>
                      <AnalyticsRouteTracker />
                      <PublicSiteInstrumentation />
                      <Suspense fallback={<RouteSkeleton />}>
                        <Routes>
                        {/* PUBLIC ROUTES - No tenant required */}
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/connect-amazon" element={<TenantRedirect targetPath="/connect-amazon" />} />
                        <Route path="/careers" element={<Careers />} />
                        <Route path="/docs" element={<Docs />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/refund-policy" element={<RefundPolicy />} />
                        <Route path="/contact" element={<Contact />} />
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/amazon-fba-reimbursement" element={<AmazonFbaReimbursement />} />
                        <Route path="/amazon-lost-inventory-reimbursement" element={<ReimbursementAcquisitionPage />} />
                        <Route path="/amazon-reimbursement-audit" element={<ReimbursementAcquisitionPage />} />
                        <Route path="/amazon-inbound-shipment-shortage" element={<ReimbursementAcquisitionPage />} />
                        <Route path="/amazon-fee-overcharge-reimbursement" element={<ReimbursementAcquisitionPage />} />
                        <Route path="/getida-alternative" element={<GetidaAlternative />} />
                        <Route path="/sellerboard-alternative" element={<SellerboardAlternative />} />
                        <Route path="/about" element={<AboutMargin />} />
                        <Route path="/about-margin" element={<AboutMargin />} />
                        <Route path="/research" element={<Research />} />
                        <Route path="/fba-reimbursement-research" element={<Research />} />
                        <Route path="/pricing" element={<PricingAdjust />} />
                        <Route path="/currency-margin" element={<CurrencyMargin />} />
                        <Route path="/standalone" element={<Standalone />} />
                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/founding-500/status" element={<FoundingActivationStatus />} />
                        <Route path="/designsimulate" element={<DesignSimulate />} />
                        <Route path="/platformsimulate" element={<PlatformSimulate />} />
                        <Route path="/documentsimulate" element={<DocumentSimulate />} />
                        <Route path="/auditsimulate" element={<AuditSimulate />} />
                        <Route path="/audit" element={<Audit />} />
                        <Route path="/timeline-simulation" element={<TimelineSimulation />} />
                        <Route path="/readiness-simulate" element={<ReadinessSimulate />} />
                        <Route path="/readiness-simulate-two" element={<ReadinessSimulateTwo />} />
                        <Route path="/memory-simulate" element={<MemorySimulate />} />
                        <Route path="/reconciliation-simulate" element={<ReconciliationSimulate />} />
                        <Route path="/platformfly" element={<PlatformFly />} />
                        <Route path="/accuracy-graph" element={<AccuracyGraph />} />
                        <Route path="/scatterdesign" element={<ScatterDesign />} />
                        <Route path="/countdown" element={<Countdown />} />
                        <Route path="/plane" element={<Plane />} />
                        <Route path="/closingcta" element={<ClosingCTA />} />
                        <Route path="/claimsimulate" element={<ClaimSimulate />} />
                        <Route path="/filesimulate" element={<FileSimulate />} />
                        <Route path="/api-connection" element={<ApiConnection />} />
                        <Route path="/evidence-analysis" element={<EvidenceAnalysis />} />
                        <Route path="/evidence-match" element={<EvidenceMatch />} />
                        <Route path="/rejection-loop" element={<RejectionLoop />} />
                        <Route path="/report-generation" element={<ReportGeneration />} />
                        <Route path="/accuracy-scaling" element={<AccuracyScaling />} />
                        <Route path="/feedback-learning" element={<FeedbackLearning />} />
                        <Route path="/auditable-workspace" element={<AuditableWorkspace />} />
                        <Route path="/auditable-outputs" element={<AuditableOutputs />} />
                        <Route path="/every-case" element={<EveryCase />} />
                        <Route path="/openstatement" element={<OpenStatement />} />
                        <Route path="/margin-takes-over" element={<MarginTakesOver />} />
                        <Route path="/margin-reads" element={<MarginReads />} />
                        <Route path="/evidence-before-asked" element={<EvidenceBeforeAsked />} />
                        <Route path="/recovery-lifecycle" element={<RecoveryLifecycle />} />
                        <Route path="/learning-recovery" element={<LearningRecovery />} />
                        <Route path="/audit-ready-history" element={<AuditReadyHistory />} />
                        <Route path="/amazon-asks" element={<AmazonAsks />} />
                        <Route path="/clocksimulate" element={<ClockSimulate />} />
                        <Route path="/rejectsimulate" element={<RejectSimulate />} />
                        <Route path="/staresimulate" element={<StareSimulate />} />
                        <Route path="/discrepancysimulate" element={<DiscrepancySimulate />} />
                        <Route path="/reframesimulate" element={<ReframeSimulate />} />
                        <Route path="/discoverysimulate" element={<DiscoverySimulate />} />
                        <Route path="/statementsimulate" element={<StatementSimulate />} />
                        <Route path="/comparisonsimulate" element={<ComparisonSimulate />} />
                        <Route path="/finality" element={<Finality />} />
                        <Route path="/finalpayoffsimulate" element={<FinalPayoffSimulate />} />
                        <Route path="/evidence-chase" element={<EvidenceChaseSimulate />} />
                        <Route path="/evidence-insight" element={<EvidenceInsightSimulate />} />
                        <Route path="/launch-countdown" element={<LaunchCountdownSimulate />} />
                        <Route path="/giving-up" element={<GivingUpSimulate />} />
                        <Route path="/results-scroll" element={<ResultsScrollSimulate />} />
                        <Route path="/supplier-chat" element={<SupplierChatSimulate />} />
                        <Route path="/google-drive" element={<GoogleDriveSimulate />} />
                        <Route path="/intro-pain" element={<IntroPainSimulate />} />
                        <Route path="/action-simulate" element={<ActionSimulate />} />
                        <Route path="/rejection-screen" element={<RejectionScreenSimulate />} />
                        <Route path="/card-review" element={<RejectCard />} />
                        <Route path="/AppealSimulate" element={<ReAppealSimulate />} />
                        <Route path="/appealsimulate" element={<ReAppealSimulate />} />
                        <Route path="/discrepancy-stack" element={<DiscrepancyStack />} />
                        <Route path="/waitlist" element={<Waitlist />} />
                        <Route path="/early-access" element={<EarlyAccess />} />
                        <Route path="/document-uploads" element={<DocumentUploads />} />
                        <Route path="/pricing/standard-agreement" element={<StandardAgreement />} />
                        <Route path="/branding" element={<Branding />} />
                        {/* AUTH & OAUTH ROUTES - No tenant required */}
                        <Route path="/auth/callback" element={<OAuthCallback />} />
                        <Route path="/auth/callback/redirect" element={<OAuthCallbackRedirect />} />
                        <Route path="/auth/redirect/callback" element={<OAuthCallbackRedirect />} />
                        <Route path="/auth/success" element={<OAuthSuccess />} />
                        <Route path="/auth/amazon-sandbox" element={<OAuthProviderSandbox />} />
                        <Route path="/auth/sandbox-callback" element={<OAuthCallback />} />
                        <Route path="/system-error-preview" element={<SystemErrorPreview />} />
                        <Route path="/stripe/callback" element={<StripeCallback />} />
                        <Route path="/amazon-sandbox" element={<AmazonSandbox />} />
                        <Route path="/analyzing" element={<AnalyzingScreen />} />
                        {/* TENANT-SCOPED ROUTES - Require :tenantSlug */}
                        <Route path="/app" element={appRoute(<TenantRedirect />)} />
                        <Route path="/app/redirect" element={<EmailActionRedirect />} />
                        <Route path="/app/:tenantSlug" element={appRoute(<FoundingActivationGate><Dashboard /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/dashboard" element={appRoute(<FoundingActivationGate><Dashboard /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/reports" element={appRoute(<Navigate to="../dashboard" replace />)} />
                        <Route path="/app/:tenantSlug/export" element={appRoute(<ExportCenter />)} />
                        <Route path="/app/:tenantSlug/learning-insights" element={appRoute(<LearningInsights />)} />
                        <Route path="/app/:tenantSlug/sync" element={appRoute(<Sync />)} />
                        <Route path="/app/:tenantSlug/auth/callback" element={appRoute(<FoundingActivationGate><OAuthCallback /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/auth/success" element={appRoute(<FoundingActivationGate><OAuthSuccess /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/integrations-hub" element={appRoute(<FoundingActivationGate><IntegrationsHub /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/recoveries" element={appRoute(<Recoveries />)} />
                        <Route path="/app/:tenantSlug/filing-pipeline" element={appRoute(<FilingPipeline />)} />
                        <Route path="/app/:tenantSlug/approved-reimbursements" element={appRoute(<ApprovedReimbursements />)} />
                        <Route path="/app/:tenantSlug/dispute-cases" element={appRoute(<DisputeCases />)} />
                        <Route path="/app/:tenantSlug/appeals" element={appRoute(<Appeals />)} />
                        <Route path="/app/:tenantSlug/cases/:caseId" element={appRoute(<CaseDetail />)} />
                        <Route path="/app/:tenantSlug/recoveries/:caseId" element={appRoute(<CaseDetail />)} />
                        <Route path="/app/:tenantSlug/resolve/:id" element={appRoute(<ResolveCase />)} />
                        <Route path="/app/:tenantSlug/history" element={appRoute(<Navigate to="../billing" replace />)} />
                        <Route path="/app/:tenantSlug/documents" element={appRoute(<EvidenceLocker />)} />
                        <Route path="/app/:tenantSlug/evidence-locker" element={appRoute(<EvidenceLocker />)} />
                        <Route path="/app/:tenantSlug/documents/:id" element={appRoute(<DocumentDetail />)} />
                        <Route path="/app/:tenantSlug/notifications" element={appRoute(<NotificationHub />)} />
                        <Route path="/app/:tenantSlug/settings" element={appRoute(<Settings />)} />
                        <Route path="/app/:tenantSlug/upcoming-payments" element={appRoute(<Navigate to="../billing" replace />)} />
                        <Route path="/app/:tenantSlug/reconnect-amazon" element={appRoute(<FoundingActivationGate><ReconnectProvider /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/connect-amazon" element={appRoute(<FoundingActivationGate><ConnectAmazonAccount /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/integrations/reconnect/amazon" element={appRoute(<FoundingActivationGate><ReconnectProvider /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/billing" element={appRoute(<FoundingActivationGate><Billing /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/api-access" element={appRoute(<ApiAccess />)} />
                        <Route path="/app/:tenantSlug/help" element={appRoute(<Help />)} />
                        <Route path="/app/:tenantSlug/whats-new" element={appRoute(<WhatsNew />)} />
                        <Route path="/app/:tenantSlug/evidence-onboarding" element={appRoute(<FoundingActivationGate><EvidenceOnboarding /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/evidence-search" element={appRoute(<EvidenceSearch />)} />
                        <Route path="/app/:tenantSlug/margin-board" element={appRoute(<MarginBoard />)} />
                        <Route path="/app/:tenantSlug/data-upload" element={appRoute(<FoundingActivationGate><DataUpload /></FoundingActivationGate>)} />
                        <Route path="/app/:tenantSlug/pricing/standard-agreement" element={appRoute(<StandardAgreement />)} />
                        <Route path="/app/:tenantSlug/pricing-adjust" element={appRoute(<PricingAdjust />)} />
                        <Route path="/app/:tenantSlug/admin" element={appRoute(<Admin />)} />
                        <Route path="/app/:tenantSlug/admin/users-integrations" element={appRoute(<AdminOnly><AdminUsersAndIntegrations /></AdminOnly>)} />
                        <Route path="/app/:tenantSlug/admin/amazon-auth-test" element={appRoute(<AdminOnly><AmazonAuthTest /></AdminOnly>)} />
                        <Route path="/app/:tenantSlug/test/agent1" element={appRoute(<Agent1Test />)} />
                        <Route path="/app/:tenantSlug/revenue-model" element={appRoute(<AdminOnly><RevenueModel /></AdminOnly>)} />
                        <Route path="/app/:tenantSlug/admin/revenue-model" element={appRoute(<AdminOnly><RevenueModel /></AdminOnly>)} />
                        <Route path="/app/:tenantSlug/admin/revenue" element={appRoute(<AdminOnly><AdminRevenue /></AdminOnly>)} />
                        <Route path="/app/:tenantSlug/admin/queue" element={appRoute(<AdminOnly><QueueDashboard /></AdminOnly>)} />
                        <Route path="/app/:tenantSlug/admin/team" element={appRoute(<AdminOnly><TeamManagement /></AdminOnly>)} />
                        {/* LEGACY REDIRECTS */}
                        <Route path="/integrations-hub" element={<TenantRedirect />} />
                        <Route path="/cases/:caseId" element={<TenantRedirect preservePath />} />
                        <Route path="/recoveries/:caseId" element={<TenantRedirect preservePath />} />
                        <Route path="/recoveries" element={<TenantRedirect />} />
                        <Route path="/filing-pipeline" element={<TenantRedirect />} />
                        <Route path="/approved-reimbursements" element={<TenantRedirect targetPath="/approved-reimbursements" />} />
                        <Route path="/dispute-cases" element={<TenantRedirect />} />
                        <Route path="/appeals" element={<TenantRedirect />} />
                        <Route path="/sync" element={<TenantRedirect />} />
                        <Route path="/settings" element={<TenantRedirect />} />
                        <Route path="/reconnect-amazon" element={<TenantRedirect />} />
                        <Route path="/connect-amazon-account" element={<TenantRedirect targetPath="/connect-amazon" />} />
                        <Route path="/billing" element={<TenantRedirect />} />
                        <Route path="/history" element={<TenantRedirect targetPath="/billing" />} />
                        <Route path="/upcoming-payments" element={<TenantRedirect targetPath="/billing" />} />
                        <Route path="/admin/queue" element={<TenantRedirect />} />
                        <Route path="/admin/users-integrations" element={<TenantRedirect />} />
                        <Route path="/pricing-adjust" element={<TenantRedirect />} />
                        <Route path="*" element={<NotFound />} />
                        </Routes>
                        <RouteOverlays />
                      </Suspense>
                    </RouteErrorBoundary>
                  </SmoothScrollProvider>
                </NotificationsProvider>
              </TenantProvider>
            </CurrencyProvider>
          </TooltipProvider>
        </SessionProvider>
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

