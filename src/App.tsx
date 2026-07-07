import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationsProvider from '@/components/providers/NotificationsProvider';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DemoOverlay from "@/components/demo/DemoOverlay";
import AdminOnly from "@/components/routes/AdminOnly";
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { TenantProvider } from '@/contexts/TenantContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PublicChatNode } from "@/components/chat/PublicChatNode";
import { FoundingActivationGate } from "@/components/navigation/FoundingActivationGate";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { RouteErrorBoundary } from "@/components/error/RouteErrorBoundary";
import { usePrivateRouteRobots } from "@/hooks/usePrivateRouteRobots";
import { AnalyticsRouteTracker } from "@/components/AnalyticsRouteTracker";

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
const Pricing = lazy(() => import("./pages/Pricing"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const EarlyAccess = lazy(() => import("./pages/EarlyAccess"));
const DocumentUploads = lazy(() => import("@/components/documentuploads"));
const PricingAdjust = lazy(() => import("./pages/PricingAdjust"));
const StandardAgreement = lazy(() => import("./pages/StandardAgreement"));
const EmailActionRedirect = lazy(() => import("./pages/EmailActionRedirect"));
const AboutMargin = lazy(() => import("./pages/AboutMargin"));
const Research = lazy(() => import("./pages/Research"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const FoundingActivationStatus = lazy(() => import("./pages/FoundingActivationStatus"));
const DesignSimulate = lazy(() => import("./pages/designsimulate"));
const PlatformSimulate = lazy(() => import("./pages/platformsimulate"));
const DocumentSimulate = lazy(() => import("./pages/documentsimulate"));
const TimelineSimulation = lazy(() => import("./pages/TimelineSimulation"));
const ReadinessSimulate = lazy(() => import("./pages/ReadinessSimulate"));
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
const RejectionLoop = lazy(() => import("@/components/rejection-loop"));
const ReportGeneration = lazy(() => import("@/components/report-generation"));
const AccuracyScaling = lazy(() => import("@/components/accuracy-scaling"));
const FeedbackLearning = lazy(() => import("@/components/feedback-learning"));
const AuditableWorkspace = lazy(() => import("@/components/auditable-workspace"));
const AuditableOutputs = lazy(() => import("@/components/auditable-outputs"));
const EveryCase = lazy(() => import("@/components/every-case"));
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

const RouteSkeleton = () => (
  <div className="relative min-h-screen overflow-hidden bg-[#FAFAF7] p-6 text-[#182026]">
    <div className="pointer-events-none absolute inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_50%_0%,rgba(11,116,222,0.13),transparent_38%)]" />
    <div className="relative z-10 mx-auto flex min-h-[calc(100vh-48px)] max-w-4xl items-center">
      <div className="w-full space-y-5 rounded-[30px] border border-[#CFE0EA] bg-white p-6 shadow-[0_28px_90px_rgba(37,49,58,0.1)]">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#BFD8EA] border-t-[#0B74DE]" />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">Loading Margin</div>
            <div className="mt-1 text-sm text-[#66737F]">Preparing the next view.</div>
          </div>
        </div>
        <Skeleton className="h-8 w-1/3 bg-[#E4EDF1]" />
        <Skeleton className="h-4 w-2/3 bg-[#E4EDF1]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-[24px] bg-[#E4EDF1]" />
          <Skeleton className="h-40 w-full rounded-[24px] bg-[#E4EDF1]" />
        </div>
      </div>
    </div>
  </div>
);

import { SessionProvider } from '@/contexts/SessionContext';

// ... (route-level imports)

const RouteOverlays = () => {
  const location = useLocation();
  usePrivateRouteRobots(location.pathname);
  const hidePublicChat = ['/designsimulate', '/platformsimulate', '/documentsimulate', '/platformfly', '/accuracy-graph', '/scatterdesign', '/countdown', '/plane', '/closingcta', '/finality', '/finalpayoffsimulate', '/amazon-asks', '/evidence-chase', '/evidence-insight', '/launch-countdown', '/giving-up', '/results-scroll', '/supplier-chat', '/google-drive', '/intro-pain', '/action-simulate', '/rejection-screen', '/card-review', '/api-connection', '/evidence-analysis', '/rejection-loop', '/report-generation', '/accuracy-scaling', '/feedback-learning', '/auditable-workspace', '/auditable-outputs', '/every-case', '/margin-takes-over', '/margin-reads', '/evidence-before-asked', '/recovery-lifecycle', '/learning-recovery', '/audit-ready-history', '/AppealSimulate', '/appealsimulate', '/timeline-simulation', '/readiness-simulate'].includes(location.pathname);

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
                    <RouteErrorBoundary>
                      <Suspense fallback={<RouteSkeleton />}>
                        <AnalyticsRouteTracker />
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
                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/founding-500/status" element={<FoundingActivationStatus />} />
                        <Route path="/designsimulate" element={<DesignSimulate />} />
                        <Route path="/platformsimulate" element={<PlatformSimulate />} />
                        <Route path="/documentsimulate" element={<DocumentSimulate />} />
                        <Route path="/timeline-simulation" element={<TimelineSimulation />} />
                        <Route path="/readiness-simulate" element={<ReadinessSimulate />} />
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
                        <Route path="/rejection-loop" element={<RejectionLoop />} />
                        <Route path="/report-generation" element={<ReportGeneration />} />
                        <Route path="/accuracy-scaling" element={<AccuracyScaling />} />
                        <Route path="/feedback-learning" element={<FeedbackLearning />} />
                        <Route path="/auditable-workspace" element={<AuditableWorkspace />} />
                        <Route path="/auditable-outputs" element={<AuditableOutputs />} />
                        <Route path="/every-case" element={<EveryCase />} />
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
                        <Route path="/app" element={<TenantRedirect />} />
                        <Route path="/app/redirect" element={<EmailActionRedirect />} />
                        <Route path="/app/:tenantSlug" element={<FoundingActivationGate><Dashboard /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/dashboard" element={<FoundingActivationGate><Dashboard /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/reports" element={<Navigate to="../dashboard" replace />} />
                        <Route path="/app/:tenantSlug/export" element={<ExportCenter />} />
                        <Route path="/app/:tenantSlug/learning-insights" element={<LearningInsights />} />
                        <Route path="/app/:tenantSlug/sync" element={<Sync />} />
                        <Route path="/app/:tenantSlug/auth/callback" element={<FoundingActivationGate><OAuthCallback /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/auth/success" element={<FoundingActivationGate><OAuthSuccess /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/integrations-hub" element={<FoundingActivationGate><IntegrationsHub /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/recoveries" element={<Recoveries />} />
                        <Route path="/app/:tenantSlug/filing-pipeline" element={<FilingPipeline />} />
                        <Route path="/app/:tenantSlug/approved-reimbursements" element={<ApprovedReimbursements />} />
                        <Route path="/app/:tenantSlug/dispute-cases" element={<DisputeCases />} />
                        <Route path="/app/:tenantSlug/appeals" element={<Appeals />} />
                        <Route path="/app/:tenantSlug/cases/:caseId" element={<CaseDetail />} />
                        <Route path="/app/:tenantSlug/recoveries/:caseId" element={<CaseDetail />} />
                        <Route path="/app/:tenantSlug/resolve/:id" element={<ResolveCase />} />
                        <Route path="/app/:tenantSlug/history" element={<Navigate to="../billing" replace />} />
                        <Route path="/app/:tenantSlug/documents" element={<EvidenceLocker />} />
                        <Route path="/app/:tenantSlug/evidence-locker" element={<EvidenceLocker />} />
                        <Route path="/app/:tenantSlug/documents/:id" element={<DocumentDetail />} />
                        <Route path="/app/:tenantSlug/notifications" element={<NotificationHub />} />
                        <Route path="/app/:tenantSlug/settings" element={<Settings />} />
                        <Route path="/app/:tenantSlug/upcoming-payments" element={<Navigate to="../billing" replace />} />
                        <Route path="/app/:tenantSlug/reconnect-amazon" element={<FoundingActivationGate><ReconnectProvider /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/connect-amazon" element={<FoundingActivationGate><ConnectAmazonAccount /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/integrations/reconnect/amazon" element={<FoundingActivationGate><ReconnectProvider /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/billing" element={<FoundingActivationGate><Billing /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/api-access" element={<ApiAccess />} />
                        <Route path="/app/:tenantSlug/help" element={<Help />} />
                        <Route path="/app/:tenantSlug/whats-new" element={<WhatsNew />} />
                        <Route path="/app/:tenantSlug/evidence-onboarding" element={<FoundingActivationGate><EvidenceOnboarding /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/evidence-search" element={<EvidenceSearch />} />
                        <Route path="/app/:tenantSlug/margin-board" element={<MarginBoard />} />
                        <Route path="/app/:tenantSlug/data-upload" element={<FoundingActivationGate><DataUpload /></FoundingActivationGate>} />
                        <Route path="/app/:tenantSlug/pricing/standard-agreement" element={<StandardAgreement />} />
                        <Route path="/app/:tenantSlug/pricing-adjust" element={<PricingAdjust />} />
                        <Route path="/app/:tenantSlug/admin" element={<Admin />} />
                        <Route path="/app/:tenantSlug/admin/users-integrations" element={<AdminOnly><AdminUsersAndIntegrations /></AdminOnly>} />
                        <Route path="/app/:tenantSlug/admin/amazon-auth-test" element={<AdminOnly><AmazonAuthTest /></AdminOnly>} />
                        <Route path="/app/:tenantSlug/test/agent1" element={<Agent1Test />} />
                        <Route path="/app/:tenantSlug/revenue-model" element={<AdminOnly><RevenueModel /></AdminOnly>} />
                        <Route path="/app/:tenantSlug/admin/revenue-model" element={<AdminOnly><RevenueModel /></AdminOnly>} />
                        <Route path="/app/:tenantSlug/admin/revenue" element={<AdminOnly><AdminRevenue /></AdminOnly>} />
                        <Route path="/app/:tenantSlug/admin/queue" element={<AdminOnly><QueueDashboard /></AdminOnly>} />
                        <Route path="/app/:tenantSlug/admin/team" element={<AdminOnly><TeamManagement /></AdminOnly>} />
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

