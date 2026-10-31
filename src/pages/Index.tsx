import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Landmark,
  Database,
  FileInput,
  MessagesSquare,
  Monitor,
  PlayCircle,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  Truck,
  UserCheck,
  Square,
} from "lucide-react";
import { BrandFooter } from "@/components/layout/BrandFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { DemoVideoModal } from "@/components/demo/DemoVideoModal";
import { CookieConsent } from "@/components/landing/CookieConsent";
import { PersonalRecoverySupportSection } from "@/components/landing/PersonalRecoverySupportSection";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { useNavigate, Link } from "react-router-dom";
import { EnterpriseOnboardingSection, RecoveryOfferSection, RecoveryOfferSectionDuplicate, RecoveryRoutingSection } from "@/components/landing/RecoveryDecisionSections";
import { AuditImageStackVisual } from "@/components/landing/AuditImageStackVisual";
import { FinalDelegationPreview } from "@/components/landing/FinalDelegationPreview";
import { useOnboardingCapacity } from "@/hooks/useOnboardingCapacity";
import { PUBLIC_ROUTE_META } from "@/config/seo";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ANALYTICS_EVENTS } from "@/lib/analyticsEvents";
import { trackEarlyAccessCtaClicked, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { MarginEngineSection } from "@/components/landing/MarginEngineSection";
import { GoogleMark } from "@/components/GoogleMark";

const DEMO_VIDEO_URL = "https://youtu.be/B0ksWTlYbRo";
const DEMO_VIDEO_THUMBNAIL_URL = "/margin-logo-reveal.gif";
const landingPrimaryCtaClass = "landing-pressable inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-[#635BFF] px-5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]/35 focus-visible:ring-offset-2";
const landingSecondaryCtaClass = "landing-pressable flex w-fit h-11 items-center justify-start gap-2 rounded-[7px] bg-white px-5 text-left text-[13px] font-semibold text-[#635BFF] transition-colors hover:bg-[#F1F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]/35 focus-visible:ring-offset-2 sm:inline-flex sm:justify-center";

const faqs = [
  {
    question: "Does Margin require Amazon account access for the initial review?",
    answer:
      "No Amazon account authorization is inherently required to begin a records-based review. Margin can examine the relevant records you provide and assess what they establish about your Amazon financial position. The scope of the review depends on the records available. If additional data or access is needed, Margin will explain what is required and why before proceeding.",
  },
  {
    question: "What can Margin read, change or submit?",
    answer:
      "The initial review is based on the records and access agreed for the engagement. Its purpose is to establish the financial position, identify unresolved exceptions, and determine what the available evidence supports. Any additional account permissions, integrations or operational actions are scoped separately. The access granted determines what Margin can technically access or do.",
  },
  {
    question: "Can Margin submit a recovery without authorization?",
    answer:
      "No. Margin's operating model requires seller approval before a recovery submission is made. Margin investigates the event, assembles the supporting evidence, and prepares the proposed action. The authorized representative retains the decision right over submission and other consequential actions within the agreed engagement.",
  },
  {
    question: "Where are records stored, who can access them, and how long are they retained?",
    answer:
      "Margin handles business records according to its applicable privacy and data-handling policies. Access, storage arrangements, retention periods and any third-party processing should be documented in the applicable security and privacy materials. Before providing sensitive records, you should be able to understand where they will be processed, which authorized personnel and service providers may access them, and how long they will be retained. For details applicable to your engagement, contact Margin before submitting records.",
  },
  {
    question: "Can I request deletion?",
    answer:
      "You can contact Margin to request deletion of records associated with your engagement. Requests are subject to applicable contractual obligations, legal requirements and any necessary retention obligations. Margin should confirm the scope of the request, explain any applicable exceptions, and communicate the outcome once the request has been assessed.",
  },
  {
    question: "Are third-party or AI processing services involved?",
    answer:
      "Margin uses software and technical systems to support financial analysis and recovery workflows. Whether a particular engagement involves third-party infrastructure or AI processing depends on the services actually used. Before processing begins, Margin should disclose relevant third-party processing arrangements, the categories of information involved, and applicable data-handling safeguards. Customer records should not be assumed to be excluded from third-party or AI processing unless the applicable arrangements establish that.",
  },
  {
    question: "What happens if the evidence is incomplete?",
    answer:
      "An incomplete evidence set does not automatically become a recovery claim. Margin identifies the missing information, assesses whether the available records support a conclusion, and distinguishes established findings from unresolved questions. Where further evidence is needed, the position remains qualified until it can be reassessed. Unsupported amounts are not presented as established recoveries. If the available evidence does not justify further action, Margin will explain the limitation and the options, if any, for proceeding.",
  },
  {
    question: "How are Recover Once and the Control Pilot scoped and priced?",
    answer:
      "Margin scopes engagements according to the financial exposure, number and complexity of events, evidence requirements, entities and marketplaces involved, integration needs, and level of operational responsibility required. Recover Once covers a defined financial exposure, from investigation and evidence preparation through authorized recovery work and financial outcome verification within the agreed scope. The Control Pilot addresses a broader or recurring control requirement. It establishes an agreed operating process for financial examination, exception ownership, authorized recovery actions, and reconciliation. Fees are proposed after the scope and deliverables have been established. You receive the proposed scope, fee and engagement terms before committing to paid work.",
  },
  {
    question: "How long does the review take, and which timelines depend on Amazon?",
    answer:
      "The review timeline depends on the completeness, quality and volume of the records provided, the scope of the examination, and whether additional evidence is required. Margin will communicate the expected review timeline and identify any dependencies before work begins. Where records are incomplete or clarification is needed, the review may take longer. Recovery submission, Amazon responses, appeals and payment or settlement timing are partly dependent on Amazon and other external parties. Margin manages the agreed follow-through and keeps outstanding actions and unresolved outcomes visible, but cannot guarantee when an external party will respond or release funds.",
  },
];

const supportedMarketplaces = [
  { country: "United States", code: "US", flagAsset: "us", region: "Americas" },
  { country: "Canada", code: "CA", flagAsset: "ca", region: "Americas" },
  { country: "Mexico", code: "MX", flagAsset: "mx", region: "Americas" },
  { country: "Brazil", code: "BR", flagAsset: "br", region: "Americas" },
  { country: "United Kingdom", code: "UK", flagAsset: "gb", region: "Europe" },
  { country: "Germany", code: "DE", flagAsset: "de", region: "Europe" },
  { country: "France", code: "FR", flagAsset: "fr", region: "Europe" },
  { country: "Italy", code: "IT", flagAsset: "it", region: "Europe" },
  { country: "Spain", code: "ES", flagAsset: "es", region: "Europe" },
  { country: "Netherlands", code: "NL", flagAsset: "nl", region: "Europe" },
  { country: "Belgium", code: "BE", flagAsset: "be", region: "Europe" },
  { country: "Poland", code: "PL", flagAsset: "pl", region: "Europe" },
  { country: "Sweden", code: "SE", flagAsset: "se", region: "Europe" },
  { country: "Australia", code: "AU", flagAsset: "au", region: "Asia-Pacific" },
  { country: "Japan", code: "JP", flagAsset: "jp", region: "Asia-Pacific" },
  { country: "India", code: "IN", flagAsset: "in", region: "Asia-Pacific" },
  { country: "United Arab Emirates", code: "AE", flagAsset: "ae", region: "Middle East" },
  { country: "Saudi Arabia", code: "SA", flagAsset: "sa", region: "Middle East" },
];

const containerClass = "mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12";
const sectionBodyClass =
  "mt-6 max-w-[740px] text-[17px] leading-8 text-[var(--margin-text-secondary)] md:text-[19px] md:leading-9";
const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: {
    duration: 0.55,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
};

function TypewriterPrompt({ text }: { text: string }) {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : "");
  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(text);
      return;
    }
    setVisibleText("");
    let index = 0;
    let interval: number | undefined;
    const startDelay = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));
        if (index >= text.length) {
          window.clearInterval(interval);
        }
      }, 34);
    }, 520);
    return () => {
      window.clearTimeout(startDelay);
      if (interval) window.clearInterval(interval);
    };
  }, [reduceMotion, text]);
  return (
    <span>
      {" "}
      {visibleText}{" "}
      <motion.span
        aria-hidden="true"
        className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[var(--margin-text-primary)]"
        animate={reduceMotion ? undefined : { opacity: [1, 0, 1] }}
        transition={{ duration: 0.86, repeat: Infinity, ease: "linear" }}
      />{" "}
    </span>
  );
}

const accountingSources = [
  { id: "amazon", name: "Amazon SP-API", context: "orders and settlements", src: "/amazon-logo-transparent-circle.png", icon: null },
  { id: "edi", name: "3PL EDI", context: "receiving events", src: null, icon: "edi" },
  { id: "carrier", name: "Carrier events", context: "movement evidence", src: null, icon: "carrier" },
  { id: "chatgpt", name: "ChatGPT", context: "AI systems", src: "/ai-logos/chatgpt.svg", icon: null },
  { id: "claude", name: "Claude", context: "AI systems", src: "/ai-logos/claude.svg", icon: null },
  { id: "settlements", name: "Settlement files", context: "payout activity", src: "/gd.png", icon: null },
  { id: "gmail", name: "Gmail", context: "source correspondence", src: "/gmailicon.png", icon: null },
  { id: "outlook", name: "Outlook", context: "finance correspondence", src: "/outlookicon.webp", icon: null },
  { id: "slack", name: "Slack", context: "team correspondence", src: "/slack-icon-2019.png", icon: null },
  { id: "linear", name: "Linear", context: "team planning", src: "/linear-icon.svg", icon: null },
  { id: "onedrive", name: "OneDrive", context: "evidence files", src: "/onedriive.png", icon: null },
  { id: "googledrive", name: "Google Drive", context: "shared records", src: "/Driveboy.png", icon: null },
  { id: "dropbox", name: "Dropbox", context: "recovery records", src: "/Dropbox_Icon.svg.png", icon: null },
  { id: "quickbooks", name: "QuickBooks", context: "accounting records", src: "/quickbooks.png", icon: null },
  { id: "xero", name: "Xero", context: "accounting records", src: "/xero.png", icon: null },
  { id: "sap", name: "SAP", context: "enterprise records", src: "/integration-icons/sap-standalone.png", icon: null },
  { id: "netsuite", name: "Oracle", context: "finance systems", src: "/integration-icons/oracle-standalone.png", icon: null },
  { id: "excel", name: "Excel", context: "finance workbooks", src: "/excel-icon-margin.png", icon: null },
  { id: "sftp", name: "S3 / SFTP", context: "controlled files", src: "/integration-icons/amazon-s3-logo.svg", icon: null },
];
const accountingIntegrationGroups = [
  { label: "Marketplace and settlement", sourceIds: ["amazon", "settlements"] },
  { label: "AI systems", sourceIds: ["chatgpt", "claude"] },
  { label: "Accounting and ERP", sourceIds: ["quickbooks", "xero", "sap", "netsuite", "excel"] },
  { label: "Communication and inboxes", sourceIds: ["gmail", "outlook", "slack", "linear"] },
  { label: "Files and collaboration", sourceIds: ["onedrive", "googledrive", "dropbox"] },
  { label: "Operations and logistics", sourceIds: ["edi", "carrier"] },
  { label: "Controlled data access", sourceIds: ["sftp"] },
] as const;

function AccountingIntegrationGrid() {
  return (
    <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="order-2 min-w-0 lg:order-1">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accountingIntegrationGroups.map((group, groupIndex) => {
          const sources = group.sourceIds.map((id) => accountingSources.find((source) => source.id === id)).filter(Boolean);
          return (
            <motion.div key={group.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.14 + groupIndex * 0.08 }} className="min-h-[142px] border border-[#DDE3E6] bg-white p-4 sm:min-h-[158px] sm:p-5">
              <p className="inline-block bg-[#F3F5F6] px-2 py-1 font-google-sans text-[9px] font-semibold uppercase tracking-tight text-[#71808A]">{group.label}</p>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                {sources.map((source) => source && (
                  <div key={source.id} className="flex h-12 w-12 items-center justify-center border border-[#E3E8EA] bg-white p-2" title={source.name} aria-label={source.name}>
                    {source.src ? <img src={source.src} alt={source.name} className={`h-full w-full object-contain ${source.id === "linear" ? "rounded-[5px]" : ""}`} /> : source.icon === "edi" ? <FileInput className="h-6 w-6 text-[#7C3AED]" aria-hidden="true" /> : <Truck className="h-6 w-6 text-[#D97706]" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
function AccountingEvidenceSection() {
  return (
    <section data-navbar-theme="light" className="context-audit-surface relative overflow-x-hidden bg-[#F6F8F9] py-10 md:py-16" aria-labelledby="accounting-section-title">
      <div className={`${containerClass} min-w-0`}>
        <div className="grid min-w-0 items-start gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-20 xl:gap-24">
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.18 }} className="order-1 min-w-0 lg:pt-1">
            <p className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#71808A]">MCP and native integrations</p>
            <h2 id="accounting-section-title" className="mt-4 max-w-[620px] font-google-sans text-[39px] leading-[0.98] tracking-[-0.045em] text-[#182026] sm:text-[50px] md:text-[60px]" style={{ fontWeight: 500 }}>
              <span className="heading-tone-dark">Get the answers without replacing the systems your team already relies on.</span>
            </h2>
            <p className="mt-6 max-w-[650px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">Margin brings relevant Amazon, ERP, warehouse, carrier and finance records into a connected examination while preserving their original systems as the sources of record. Integration and data-access paths can be designed around the records required for the engagement, allowing related events to be examined together without requiring your team to replace its existing operational stack.</p>
            <Link to="/contact" className="mt-7 inline-flex h-11 items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] no-underline transition-colors hover:bg-[#5148E5]">Discuss your integrations <ChevronRight className="h-4 w-4" /></Link>
            <div className="mt-12 max-w-[520px] border-t border-[#DDE3E6]">
              {["Records stay in their systems", "Read-only access by default, where supported by the connection.", "Integration paths designed around your operation."].map((item, index) => <div key={item} className="flex items-center gap-3 border-b border-[#DDE3E6] py-3 text-[13px] text-[#26353D]"><span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#182026]">{index === 0 ? <SearchCheck className="h-4 w-4" /> : index === 1 ? <Landmark className="h-4 w-4" /> : <Database className="h-4 w-4" />}</span>{item}</div>)}
            </div>
          </motion.div>
          <AccountingIntegrationGrid />
        </div>
      </div>
    </section>
  );
}

function IngestedDocumentsOutcomeSection() {
  return (
    <section className="relative overflow-hidden bg-white py-14 sm:py-20 md:py-24" aria-labelledby="ingested-documents-outcome-title">
      <div className={containerClass}>
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-16 xl:gap-20">
          <motion.div {...revealProps} className="min-w-0">
            <h2 id="ingested-documents-outcome-title" className="max-w-[620px] font-lora text-[35px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[54px]" style={{ fontWeight: 400 }}>
              <span className="heading-tone-dark">Be able to explain the number, not just report it.</span>
            </h2>
            <p className="mt-6 max-w-[570px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">Margin examines the underlying records behind a financial figure, tracing its contributing transactions, adjustments and downstream activity. It distinguishes directly supported matches from inferred relationships and unresolved differences, so a reported balance can be accompanied by the evidence and calculation that explain it.</p>
            <button type="button" className={`${landingPrimaryCtaClass} mt-6`} aria-label="See what the review produces">See what the review produces <ArrowRight className="h-4 w-4" /></button>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="min-w-0">
            <FinalDelegationPreview compactMobile mobileHeight="h-[390px]" src="/document-ingestion" title="Document Ingestion page preview" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const historicalVideoSections = [
  { id: "recovery-preview", label: "Recovery preview", title: "See exactly what supports a recovery before it reaches Amazon.", darkTitle: "See exactly what supports", mutedTitle: "a recovery before it reaches Amazon.", body: "Margin turns the first signal into a record you can understand, with the underlying activity and evidence kept in view.", videos: ["/Evidentiary.mp4", "/DocumentAnalysis.mp4"] },
  { id: "supporting-evidence-preview", label: "Supporting evidence", title: "Never have to rebuild the evidence behind a recovery.", darkTitle: "Never have to rebuild", mutedTitle: "the evidence behind a recovery.", body: "Supporting records, case preparation, and filing context remain connected instead of being rebuilt across separate tools.", videos: ["/superEvidence.mp4", "/CaseBuilding.mp4", "/CasesTable.mp4", "/Filing.mp4"] },
  { id: "replies-preview", label: "Replies preview", title: "Know what Amazon's answer means for the money you're still tracking.", darkTitle: "Know what Amazon's answer", mutedTitle: "means for the money you're still tracking.", body: "Responses, rejection context, and the next supported action stay attached to the recovery record.", videos: ["/Replies.mp4", "/2026-07-27__12_58_06_a_m_-Appeals_Scene.mp4"] },
  { id: "payout-reconciliation-preview", label: "Payout reconciliation", title: "Don't count a recovery as money received until the payout confirms it.", darkTitle: "Don't count a recovery as money received", mutedTitle: "until the payout confirms it.", body: "Margin keeps the case outcome connected to the payout record so approved value and actual settlement can be compared.", videos: ["/CasesTable.mp4", "/EvidenceCalibration.mp4"] },
] as const;

function DeferredVideo({ src, label, className }: { src: string; label: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || shouldLoad) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShouldLoad(true);
      observer.disconnect();
    }, { rootMargin: "600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldLoad]);

  return (
    <video
      ref={videoRef}
      className={className}
      src={shouldLoad ? src : undefined}
      autoPlay={shouldLoad}
      loop
      muted
      playsInline
      preload="none"
      aria-label={label}
    />
  );
}

function HistoricalVideoPreviewSections() {
  return (
    <>
      {historicalVideoSections.map((section, sectionIndex) => (
        <section key={section.id} aria-labelledby={`${section.id}-title`} className="relative overflow-hidden bg-white py-7 sm:py-8 md:py-11">
          <div className={containerClass}>
            <motion.div {...revealProps} className="max-w-[900px]">
              <h2 id={`${section.id}-title`} className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[54px]" style={{ fontWeight: 400 }}><span className="heading-tone-dark">{section.darkTitle}</span> <span className="heading-tone-muted">{section.mutedTitle}</span></h2>
              <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">{section.body}</p>
            </motion.div>
            <div className={`mt-10 grid gap-5 ${section.videos.length > 2 ? "sm:grid-cols-2" : "lg:grid-cols-2"}`}>
              {section.videos.map((video, videoIndex) => (
                <motion.div key={`${video}-${videoIndex}`} {...revealProps} transition={{ ...revealProps.transition, delay: videoIndex * 0.08 }} className="relative overflow-hidden rounded-[12px] bg-[#F3F7F8] sm:rounded-[16px]"><DeferredVideo className="block aspect-video w-full object-cover" src={video} label={`${section.label} demonstration ${videoIndex + 1}`} /></motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

const heroSwarmParticles = Array.from({ length: 2460 }, (_, index) => {
  const column = index % 60;
  const row = Math.floor(index / 60);
  const startX = 1 + column * 1.68 + ((row * 17) % 5);
  const startY = 2 + row * 2.25 + ((column * 11) % 4);
  const drift = ((index * 29) % 100) / 100;
  const current = ((index * 47) % 100) / 100;
  const currentWidth = 9 + (index % 5) * 2.2;
  const currentHeight = 8 + (index % 7) * 1.6;
  const wave = (index % 3) * 0.7;
  return {
    id: index,
    startX,
    startY,
    flowX: 10 + current * 78,
    flowY: 18 + drift * 66,
    flowWidth: currentWidth,
    flowHeight: currentHeight,
    wave,
    radius: index % 13 === 0 ? 0.18 : index % 5 === 0 ? 0.16 : 0.14,
    tone: index % 17 === 0 ? "#0B74DE" : index % 11 === 0 ? "#52616A" : index % 7 === 0 ? "#8A99A3" : "#182026",
    delay: ((index * 37) % 100) / 100 * 1.2,
  };
});

function HeroSwarmBackground({ reduceMotion: _reduceMotion }: { reduceMotion: boolean | null }) {
  return null;
}
function KineticHeroSection({
  onAuditCta,
  onReportCta,
  isFull,
  nextBatchHours,
}: {
  onAuditCta: () => void;
  isFull: boolean;
  nextBatchHours?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [notificationCycle, setNotificationCycle] = useState(0);
  const { scrollYProgress } = useScroll();
  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setNotificationCycle((cycle) => cycle + 1), 4420);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);
  const heroScale = useTransform(scrollYProgress, [0, 0.18], [1, 0.98]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0.82]);

  return (
    <motion.section
      style={{ scale: reduceMotion ? 1 : heroScale, opacity: reduceMotion ? 1 : heroOpacity }}
      data-navbar-theme="light"
      className="hero-section relative isolate flex min-h-svh overflow-hidden bg-white px-4 pb-16 pt-28 text-[#182026] sm:px-6 sm:pb-24 sm:pt-40 md:min-h-screen md:px-8 md:pb-44 md:pt-40"
      aria-labelledby="margin-hero-title"
    >
      <HeroSwarmBackground reduceMotion={reduceMotion} />
      <div
        aria-hidden="true"
        className="hero-gmail-visual pointer-events-none absolute inset-y-0 right-0 w-[70%] overflow-hidden"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, transparent 38%, black 68%, black 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, transparent 38%, black 68%, black 100%)",
        }}
      >
        <img
          src="/gmaillist.png"
          alt=""
          className="h-full w-full scale-[0.98] object-cover object-[60%_top] opacity-[0.92] mix-blend-multiply"
        />
        <div key={notificationCycle} className="contents">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -28, scaleX: 0.42, scaleY: 0.88 }}
          animate={{ opacity: 1, y: 0, scaleX: 1, scaleY: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.22, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "top right" }}
          className="absolute right-[3%] top-[27%] origin-top-right w-[min(480px,90%)] rounded-[10px] border border-white/80 bg-white/90 px-3 py-2 shadow-[0_18px_44px_rgba(24,32,38,0.14)] backdrop-blur-xl sm:px-3.5 sm:py-2.5"
        >
          <div className="flex items-start gap-2.5">
            <img src="/amazon-logo-transparent-circle.png" alt="Amazon" className="mt-0.5 h-[18.4px] w-[18.4px] shrink-0 object-contain" />
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-[#89969D]" aria-hidden="true" />
            <img src="/gmailicon.png" alt="Gmail" className="mt-0.5 h-[18.4px] w-[18.4px] shrink-0 object-contain" />
            <div className="min-w-0 flex-1 text-[9px] leading-4 tracking-tight text-[#46545B] sm:text-[10px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-[#263438]">Amazon correspondence</span>
                <span className="shrink-0">05/09/26, 11:16:00</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <div className="mt-0.5 text-[#263438]">Amazon decision · partial approval</div>
                <span className="shrink-0">Outbound</span>
              </div>
              <p className="truncate text-[#46545B]">[Case ID: 19822888381] Partial approval issued — $26,000 | $18,650 residual</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -28, scaleX: 0.42, scaleY: 0.88 }}
          animate={{ opacity: 1, y: 0, scaleX: 1, scaleY: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.50, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "top right" }}
          className="absolute right-[3%] top-[36%] origin-top-right w-[min(480px,90%)] rounded-[10px] border border-white/80 bg-white/90 px-3 py-2 shadow-[0_18px_44px_rgba(24,32,38,0.16)] backdrop-blur-xl sm:px-3.5 sm:py-2.5"
        >
          <div className="flex items-center gap-2.5">
            <img src="/favicon-margin.svg" alt="Margin" className="h-[18.4px] w-[18.4px] shrink-0" />
            <ArrowRight className="h-3 w-3 shrink-0 text-[#89969D]" aria-hidden="true" />
            <img src="/slack-icon-2019.png" alt="Slack" className="h-[18.4px] w-[18.4px] shrink-0 object-contain" />
            <div className="min-w-0 flex-1 text-[9px] leading-4 tracking-tight text-[#46545B] sm:text-[10px]">
              <div className="flex items-baseline justify-end gap-3"><span className="shrink-0">05/09/26, 13:24:17</span></div>
              <p className="truncate text-[#263438]">[Case ID: 19822888381] Residual evidence response prepared | $2,850</p>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -28, scaleX: 0.42, scaleY: 0.88 }}
          animate={{ opacity: 1, y: 0, scaleX: 1, scaleY: 1 }}
          transition={reduceMotion ? { duration: 0 } : { delay: 0.78, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "top right" }}
          className="absolute right-[3%] top-[45%] origin-top-right w-[min(480px,90%)] rounded-[10px] border border-white/80 bg-white/90 px-3 py-2 shadow-[0_18px_44px_rgba(24,32,38,0.16)] backdrop-blur-xl sm:px-3.5 sm:py-2.5"
        >
          <div className="flex items-start gap-2.5">
            <img src="/favicon-margin.svg" alt="Margin" className="mt-0.5 h-[18.4px] w-[18.4px] shrink-0" />
            <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-[#89969D]" aria-hidden="true" />
            <img src="/linear-icon.svg" alt="Linear" className="mt-0.5 h-[18.4px] w-[18.4px] shrink-0 rounded-[5px] object-contain" />
            <div className="min-w-0 flex-1 text-[9px] leading-4 tracking-tight text-[#46545B] sm:text-[10px]">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-[#263438]">Recovery review · residual exposure</span>
                <span className="shrink-0">05/09/26, 11:28:00</span>
              </div>
              <div className="mt-0.5 text-[#263438]">To: Sarah Mitchell · Business Lead</div>
              <p className="truncate text-[#46545B]">Amazon approved $26,000 — $19,240 remains open</p>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
      <div className="relative z-10 flex w-full items-center">
        <div className="max-w-[860px]">
          <div id="margin-hero-title" className="mt-5 max-w-[820px] font-google-sans text-[40px] leading-[0.98] tracking-[-0.045em] min-[390px]:text-[46px] sm:mt-7 sm:text-[60px] md:text-[74px] lg:text-[84px]" style={{ fontWeight: 400 }}>
            <motion.span className="block text-[#182026]" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}>Complex Amazon Fin-Ops, <span className="text-[#635BFF]">done for you.</span></motion.span>
          </div>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, delay: 0.58, ease: [0.22, 1, 0.36, 1] }} className="mt-5 max-w-[900px] font-google-sans text-[15px] leading-7 text-[#52616A] sm:mt-8 sm:text-[18px] sm:leading-8"><span className="hero-copy-desktop">Margin takes ownership of the financial work behind your Amazon operation — tracing discrepancies across records, establishing what happened, pursuing recoveries when the evidence supports them, and verifying where the financial outcomes land. Your team stays focused on the business. Margin handles the complexity behind it.</span><span className="hero-copy-mobile">Margin reconstructs the financial and operational sequence behind your Amazon business, investigates unexplained variances across charges, refunds, reversals, inventory movements, and settlements, and traces each event through its downstream financial impact.</span></motion.p>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.78, ease: [0.22, 1, 0.36, 1] }} className="mt-6 flex w-full flex-col items-stretch gap-3 font-google-sans sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
            <Button onClick={onAuditCta} aria-label="Send records for review" className="landing-pressable group relative h-[54px] min-w-0 w-full justify-center overflow-hidden rounded-[8px] bg-[#635BFF] px-2 font-google-sans text-[15px] font-bold text-white shadow-[0_18px_48px_rgba(99,91,255,0.24)] transition-[background-color,box-shadow] duration-200 hover:bg-[#5148E5] sm:h-[56px] sm:w-auto sm:flex-none sm:px-10 sm:text-[16px]"><div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" /><span className="whitespace-nowrap">Send records for review</span> <ArrowRight className="ml-2 h-5 w-5 shrink-0" /></Button>
            <Link to="/contact" className="inline-flex h-[54px] w-full min-w-0 self-center items-center justify-center gap-1 rounded-[8px] bg-[#E5E8EA] px-2 text-[15px] font-semibold text-[#30343B] transition-colors hover:bg-[#D9DEE1] sm:h-[56px] sm:w-auto sm:shrink-0 sm:self-auto sm:justify-center sm:gap-2 sm:rounded-none sm:bg-transparent sm:px-2 sm:text-[16px] sm:hover:bg-transparent sm:hover:text-[#52616A]"><img src="/outlookicon.webp" alt="" aria-hidden="true" className="h-6 w-6 shrink-0 object-contain sm:h-7 sm:w-7" /><span className="whitespace-nowrap">Talk to our team</span><ChevronRight className="h-5 w-5 shrink-0" /></Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 1 }} className="mt-4 flex w-full max-w-[780px] flex-col items-start justify-start gap-2 text-left font-google-sans text-[10px] font-medium text-[#66737F] sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1 sm:text-[11px]">
            <span className="inline-flex items-center gap-1.5"><span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#0B74DE] text-white" aria-hidden="true"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span><span>Complimentary initial review</span></span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#0B74DE] text-white" aria-hidden="true"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span><span>Read-only analysis</span></span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#0B74DE] text-white" aria-hidden="true"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span><span>You decide what happens next</span></span>
          </motion.div>
          {isFull ? <div className="mt-5 max-w-[430px] rounded-[8px] bg-[#F5F7F8] p-4 text-sm leading-6 text-[#52616A] shadow-[inset_0_0_0_1px_rgba(24,32,38,0.10)] backdrop-blur-xl"><div>We are onboarding a small batch of sellers right now.</div><div>Next batch opens in {nextBatchHours ?? 24} hours.</div></div> : null}
        </div>
      </div>
    </motion.section>
  );
}

function DuplicatePipelineDemoSection() {
  return (
    <section aria-label="Recovery operations demo" className="relative overflow-hidden bg-white pb-12 pt-10 sm:pb-16 sm:pt-12 md:pb-20 md:pt-16">
      <div className={containerClass}>
        <motion.div {...revealProps} className="mx-auto mb-8 max-w-[900px] text-center sm:mb-10">
          <h2 className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>Follow the recovery beyond Amazon&apos;s decision</h2>
          <p className="mt-5 max-w-[780px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">Margin follows a recovery from its originating transaction through the supporting evidence, Amazon&apos;s decision, the resulting reimbursement or adjustment, and its appearance in subsequent financial records. See which events have been connected, what outcome was recorded, and whether any part of the original discrepancy remains unresolved.</p>
          <button type="button" className={`${landingPrimaryCtaClass} mt-5`} aria-label="See a sample financial position">See a sample financial position <ChevronRight className="h-4 w-4" /></button>
        </motion.div>
        <motion.div
          {...revealProps}
          initial={{ opacity: 0, x: 46, y: 18, scale: 0.985 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-[5px] bg-[#E5F0F3] p-2 sm:p-4"
          style={{ background: 'radial-gradient(circle at 18% 12%, rgba(255,255,255,0.95), transparent 34%), linear-gradient(135deg, #EAF5F9 0%, #DCECF2 52%, #F6FAFB 100%)' }}
        >
          <div className="flex h-7 items-center gap-1.5 border-b border-white/55 bg-white/35 px-2 backdrop-blur-md" aria-label="Mac browser preview chrome">
              <span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" aria-hidden="true" />
          </div>
          <iframe
            title="Margin recovery operations demo"
            src="/duplicate-pipeline-preview"
            className="block h-[390px] w-full border-0 bg-white sm:h-[680px] lg:h-[780px]"
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  );
}


function OneRecoverySection() {
  return (
    <section className="relative overflow-hidden bg-[#F3F5F5] py-10 md:py-14">
      <div className={containerClass}>
        <div className="grid items-center gap-12 lg:grid-cols-1 xl:gap-24">
          <motion.div {...revealProps} className="order-1 lg:pt-2">
            <h2 className="max-w-[700px] font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
              <span className="heading-tone-dark">One Recovery Operation</span> <span className="heading-tone-muted">for Your Amazon Business</span>
            </h2>
            <div className="mt-5 max-w-[620px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
              <p>When something needs recovering, Margin takes it from finding the problem to getting the outcome.</p>
              <p className="mt-4 text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">
                You don&apos;t have to figure out what happened, build the case, chase Amazon, or keep checking whether the money came back.
              </p>
              <p className="mt-4 text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[17px] sm:leading-8">
                Margin handles the recovery.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const realityCheckStages = [
  {
    title: "Prove.",
    words: ["Found", "Verified", "Proven"],
  },
  {
    title: "Move.",
    words: ["Prepared", "Filed", "Followed up", "Defended"],
  },
  {
    title: "Resolve.",
    words: ["Resolved", "Reconciled", "Actually recovered"],
  },
];

const realityCheckWords = realityCheckStages.flatMap((stage) => stage.words);

function RealityCheckSection() {
  return (
    <section className="problem-surface relative overflow-hidden bg-[#F3F5F5] py-10 md:py-14">
      <div className={containerClass}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)] lg:gap-8">
        <div className="flex flex-col justify-center">
        <motion.div {...revealProps} className="flex max-w-[900px] flex-col justify-center">
          <h2 className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
            <span className="heading-tone-dark">Amazon can close the case. Your financial position still needs an answer.</span>
          </h2>
          <p className="mt-5 max-w-[780px] text-[15px] font-medium leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] md:text-[17px] md:leading-8">As Amazon activity accumulates across transactions, inventory movements, adjustments and settlement periods, the same financial event can appear differently across reports and systems. Margin examines those records together, establishes the relationships that can be supported, and separates explained activity from differences that still require investigation.</p>
          <p className="mt-6 max-w-[780px] text-[14px] leading-6 text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">Margin traces financial events across charges, refunds, reversals, credits and settlements, using available transaction references, dates, amounts and supporting records to establish how one event relates to another. Instead of asking Finance to manually reconstruct the sequence, Margin maintains the evidence and relationships behind the resulting financial position.</p>
          <Link to="/contact" className={`${landingPrimaryCtaClass} mt-6`}>See a sample financial position <ChevronRight className="h-4 w-4" /></Link>
        </motion.div>
        </div>
        <motion.div {...revealProps} className="relative min-w-0 overflow-hidden">
          <FinancialCertaintyNestedVisual />
        </motion.div>
      </div>
      </div>
    </section>
  );
}

function ReconstructionGapSection() {
  return (
    <section aria-labelledby="reconstruction-gap-title" className="reconstruction-gap-surface relative overflow-hidden bg-[#F6F8F9] py-10 md:py-14">
      <div className={containerClass}>
        <div className="grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
          <motion.div {...revealProps} className="order-1 max-w-[920px] border-l border-[#D8E3E8] pl-5 sm:pl-7 md:pl-10 lg:order-1">
            <h2 id="reconstruction-gap-title" className="max-w-[820px] font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[54px]" style={{ fontWeight: 400 }}>
              <span className="heading-tone-dark">Stop making Finance reconstruct the connections between transactions.</span>
            </h2>
            <div className="mt-6 max-w-[780px] space-y-5 text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">
              <p>Margin traces financial events across charges, refunds, reversals, credits and settlements, using available transaction references, dates, amounts and supporting records to establish how one event relates to another. Instead of asking Finance to manually reconstruct the sequence, Margin maintains the evidence and relationships behind the resulting financial position.</p>
              <p>Margin brings relevant Amazon, ERP, warehouse, carrier and finance records into a connected examination while preserving their original systems as the sources of record. Integration and data-access paths can be designed around the records required for the engagement, allowing related events to be examined together without requiring your team to replace its existing operational stack.</p>
            <button type="button" className={`${landingPrimaryCtaClass} mt-6`} aria-label="See how Margin proves the position">See how Margin proves the position <ChevronRight className="h-4 w-4" /></button>
            </div>
          </motion.div>
          <motion.div {...revealProps} className="relative order-2 min-w-0 overflow-hidden lg:order-2">
            <DiscrepancyModalVisual compactMobile />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FinancialWorkProofSection() {
  const proofPoints: Array<{ value: string; title: string; description?: string; details?: string[] }> = [
    {
      value: "28+",
      title: "hours saved per month",
      description: "Estimated time returned from the manual work of locating source records, tracing transaction relationships and assembling supporting evidence.",
    },
    {
      value: "SP-API",
      title: "Selling Partner Connector",
      details: [
        "Evidence and case workflows",
        "Payout reconciliation",
        "Seller approval before submission",
        "Tenant isolation",
      ],
    },
    {
      value: "26",
      title: "quantitative control models",
      description: "Purpose-built financial checks evaluate transaction and operational activity for conditions that may warrant investigation.",
    },
    {
      value: "11",
      title: "financial operation agents",
      description: "A coordinated agent architecture supports specialised stages of examination, evidence handling, recovery management and financial control.",
    },
  ];

  return (
    <section aria-labelledby="financial-work-proof-title" className="financial-work-proof-surface relative overflow-hidden bg-[#F1F3F2] py-8 text-[#182026] sm:py-10 md:py-16">
      <div className={containerClass}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:gap-20">
          <motion.div {...revealProps} className="max-w-[620px]">
            <h2 id="financial-work-proof-title" className="font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[56px]" style={{ fontWeight: 400 }}>
              See the work behind a financial conclusion.
            </h2>
            <p className="mt-4 max-w-[560px] text-[15px] leading-6 text-[#5F6D77] md:mt-5 md:text-[17px] md:leading-8">Margin combines transaction-level examination, cross-record investigation, evidence traceability, controlled recovery workflows and financial outcome verification. Each material finding can be inspected against its source records, calculation, supporting evidence and current status.</p>
            <p className="mt-3 max-w-[560px] text-[15px] leading-6 text-[#5F6D77] md:mt-4 md:text-[17px] md:leading-8">Your team can review the financial basis, approve consequential actions and monitor recovered, unresolved and reconciled value without having to assemble the investigation independently.</p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="border-t border-[#D8E3E8]">
            {proofPoints.map((point) => (
              <div key={point.title} className="grid gap-2 border-b border-[#D8E3E8] py-3 sm:grid-cols-[110px_minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-baseline sm:gap-5 sm:py-6">
                <span className={`${point.value === "SP-API" ? "text-[24px] sm:text-[28px]" : "text-[38px] sm:text-[44px]"} font-lora leading-none tracking-[-0.045em] text-[#182026]`} style={{ fontWeight: 500 }}>{point.value}</span>
                <h3 className="text-[16px] font-semibold leading-5 tracking-tight text-[#182026] sm:text-[17px]">{point.title}</h3>
                {point.details ? (
                  <ul className="grid gap-1 text-[13px] leading-5 text-[#66737F] sm:text-[14px] sm:leading-6">
                    {point.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                ) : (
                  <p className="text-[13px] leading-5 text-[#66737F] sm:text-[14px] sm:leading-6">{point.description}</p>
                )}
              </div>
            ))}
          </motion.div>
        </div>
        <button type="button" className={`${landingSecondaryCtaClass} mt-5 md:mt-8`} aria-label="See what the operating record contains">See what the operating record contains <ChevronRight className="h-4 w-4" /></button>
      </div>
    </section>
  );
}

const recoveryHarnessPoints = [
  {
    number: "01",
    title: "Don't let an uncertain financial position trigger the wrong action.",
    lead: "Margin records the source population, legal entity, potential exposure, evidence gaps, claim-window considerations and accountable owner for each control exception. It distinguishes a detected anomaly from a substantiated financial position before recovery work is prepared.",
  },
  {
    number: "02",
    title: "Never let a new outcome erase what happened before.",
    lead: "Margin records each rejection, response, reversal, credit or adjustment against the original event. It reassesses the supported, settled and residual position while preserving the decision history and evidence that led to the previous state.",
  },
  {
    number: "03",
    title: "Keep every recovery action within your approval rules.",
    lead: "Margin applies the relevant entity, recovery class, exposure threshold and approval policy to determine the required authorization route. It records the approving authority, approved scope and decision timestamp before consequential actions proceed.",
  },
];

function ApprovalNotificationOrderVisual() {
  const approvers = [
    { number: "1", role: "Finance / Operations Owner", name: "Michael Thompson", badge: "Primary authority", badgeClass: "bg-[#EEEAFB] text-[#65519C]", avatarClass: "bg-[#A9B8B0]", avatarSrc: "/approver-michael-thompson.jpg" },
    { number: "2", role: "Business Lead", name: "Sarah Mitchell", badge: "Delegated fallback", badgeClass: "bg-[#E9F8EC] text-[#4C9A62]", avatarClass: "bg-[#B4A99D]", avatarSrc: "/approver-sarah-mitchell.jpg" },
    { number: "3", role: "Executive Finance Authority", name: "Lena Cruz", badge: "Threshold escalation", badgeClass: "bg-[#FAF2E5] text-[#A67C3E]", avatarClass: "bg-[#B8B9C4]", avatarSrc: "/approver-lena-cruz.jpg" },
  ];
  const sequence = [
    { type: "approver", approver: approvers[0] },
    { type: "wait" },
    { type: "approver", approver: approvers[1] },
    { type: "wait" },
    { type: "approver", approver: approvers[2] },
  ] as const;
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;

    const runCarousel = () => {
      setVisibleSteps(0);
      timer = window.setTimeout(() => {
        if (cancelled) return;
        let step = 1;
        setVisibleSteps(step);

        const showNextStep = () => {
          if (cancelled) return;
          if (step < sequence.length) {
            timer = window.setTimeout(() => {
              step += 1;
              setVisibleSteps(step);
              showNextStep();
            }, 2000);
          } else {
            timer = window.setTimeout(runCarousel, 3000);
          }
        };

        showNextStep();
      }, 1500);
    };

    runCarousel();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [sequence.length]);

  return (
    <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[12px] border border-[#DCE3E6] bg-white p-3 shadow-[0_10px_28px_rgba(35,54,65,0.08)] sm:p-4" aria-label="Approval notification order">
      <div className="border-b border-[#EEF1F2] pb-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold leading-4 tracking-tight text-[#182026]">Approval follows policy, not inbox traffic</p>
          <p className="mt-0.5 text-[9px] leading-3.5 tracking-tight text-[#7A858B]">Margin routes the decision according to entity, materiality, recovery class, and delegated authority.</p>
        </div>
      </div>

      <div className="relative mt-3 pl-8">
        <span className="absolute left-[11px] top-5 bottom-5 border-l-2 border-dotted border-[#A6ADB3]" aria-hidden="true" />
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {sequence.slice(0, visibleSteps).map((step, index) => step.type === "wait" ? (
              <motion.div key={`wait-${index}`} initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="ml-3 w-fit rounded-[6px] bg-[#F5F7F8] px-2 py-1 text-[8px] font-medium tracking-tight text-[#7A858B]">Awaiting delegated approval</motion.div>
            ) : (
              <motion.div key={step.approver.number} initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="relative rounded-[10px] border border-[#E6EAEC] bg-white px-2.5 py-2 shadow-[0_5px_16px_rgba(35,54,65,0.05)]">
                <span className="absolute -left-[33px] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#2D56C9] text-[10px] font-semibold text-white shadow-[0_3px_8px_rgba(45,86,201,0.2)]">{step.approver.number}</span>
                <div className="flex items-center gap-2">
                  <img src={step.approver.avatarSrc} alt={`${step.approver.name} headshot`} className="h-8 w-8 shrink-0 rounded-[8px] object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold leading-3.5 tracking-tight text-[#182026]">{step.approver.role}</span>
                    <span className="mt-0.5 block text-[9px] leading-3 tracking-tight text-[#7A858B]">{step.approver.name}</span>
                  </span>
                  <span className={`shrink-0 rounded-[6px] px-1.5 py-0.5 text-[8px] font-semibold tracking-tight ${step.approver.badgeClass}`}>{step.approver.badge}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function GuardrailListVisual() {
  const items = [
          { title: "Potential fee variance · Evidence incomplete", detail: "Held until the assessed charge reconciles to supporting sources.", status: "Held", tone: "text-[#9A5A03]" },
          { title: "Reversed payment · Residual unresolved", detail: "Reversal must reconcile before the remaining position is classified.", status: "Review", tone: "text-[#52616A]" },
          { title: "Amazon rejection · Basis reassessment", detail: "Rejection remains attached while Margin strengthens evidence, escalates, or closes.", status: "Rework", tone: "text-[#7A5147]" },
  ];
  return (
    <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[4px] border-0 bg-white" aria-label="Guardrails evidence status list">
      <div className="relative flex h-full items-center justify-center p-3 sm:p-5">
        <div className="w-full max-w-[390px] space-y-2.5">
          {items.map(({ title, detail, status, tone }) => (
            <div key={title} className="rounded-[8px] bg-[#F1F3F3] px-3 py-2.5 shadow-[0_6px_16px_rgba(20,31,34,0.08)] sm:px-4 sm:py-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4FB879] text-white shadow-[0_3px_8px_rgba(31,119,76,0.22)]" aria-hidden="true"><Check className="h-3 w-3" strokeWidth={3} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                <span className="min-w-0 text-[11px] font-semibold leading-4 tracking-tight text-[#263438] sm:text-[12px]">{title}</span>
                <span className={`shrink-0 text-[9px] font-semibold leading-4 tracking-tight ${tone}`}>{status}</span>
                  </span>
                  <span className="mt-0.5 block text-[9px] leading-3.5 tracking-tight text-[#667177]">{detail}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function RecoveryHarnessSection() {
  function SettlementOutcomeVisual() {
    return (
      <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[4px] border border-[#BFC5C1] bg-[#D7D9D5]" aria-label="Settlement outcome record">
        <img src="/gmaillist.png" alt="Gmail case correspondence showing a recorded recovery outcome" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-x-2 bottom-3 rounded-[10px] bg-white px-3 py-2.5 shadow-[0_14px_30px_rgba(20,31,34,0.16)] backdrop-blur-xl sm:inset-x-3 sm:bottom-4 sm:px-4 sm:py-3">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[10px] font-semibold tracking-tight text-[#7B878D]">Outcome recorded</span>
            <span className="flex items-center gap-1 text-[9px] font-semibold tracking-tight text-[#2D7B59]"><Check className="h-3 w-3" strokeWidth={2.5} /> Control state updated</span>
          </div>
          <p className="mt-1 text-[11px] font-semibold leading-4 tracking-tight text-[#263438] sm:text-[12px]">Rejected → Reason classified → Evidence gap assigned → Position re-evaluated</p>
          <p className="mt-1 text-[9px] leading-3.5 tracking-tight text-[#667177]">The next review starts with the recorded outcome and current financial position—not from zero.</p>
        </div>
      </div>
    );
  }
  function FulfillmentReportVisual() {
    return (
      <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[4px] border border-[#BFC5C1] bg-[#D7D9D5]" aria-label="Fulfillment and settlement reconciliation report">
        <img src="/recovery-harness-fulfillment-report.jpg" alt="Settlement reconciliation report with fulfillment metadata and recovery amounts" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-x-2 bottom-2 min-h-[238px] rounded-[10px] bg-white/75 p-3 shadow-[0_14px_30px_rgba(20,31,34,0.18)] backdrop-blur-xl sm:inset-x-3 sm:bottom-3 sm:min-h-[250px] sm:p-4">
          <div className="mb-2 text-[10px] font-semibold tracking-tight text-[#52616A]">Evidence context</div>
          <div className="relative pl-7">
            <span className="absolute left-[9px] top-3 bottom-3 w-px bg-[#C7D0CC]" aria-hidden="true" />
            {[
              ['Record', 'bg-[#4FB879]'],
              ['Movement', 'bg-[#4FB879]'],
              ['Event', 'bg-[#C99A42]'],
              ['Settlement', 'bg-[#4FB879]'],
            ].map(([label, color], index) => (
              <div key={label} className="relative flex items-center gap-2 py-1">
                <span className={`absolute -left-7 flex h-[18px] w-[18px] items-center justify-center rounded-full ${color} text-white`}><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>
                <span className="text-[10px] font-semibold tracking-tight text-[#263438]">{label}</span>
                {index === 2 ? <span className="ml-auto text-[8px] font-semibold tracking-tight text-[#9A6A20]">1 unit unresolved</span> : null}
              </div>
            ))}
          </div>
          <p className="mt-3 border-t border-[#DCE3DF] pt-2 text-[9px] leading-3.5 tracking-tight text-[#52616A]">The record shows 12 units shipped and 11 accounted for. Margin connects the movement and return evidence to surface one unresolved unit before settlement is closed.</p>
          <div className="mt-2 flex items-center justify-between text-[8px] font-semibold tracking-tight"><span className="text-[#7B878D]">Reconciliation control</span><span className="text-[#2D7B59]">Evidence connected ✓</span></div>
        </div>
      </div>
    );
  }
  return (
    <section className="recovery-harness-surface relative overflow-hidden border-y border-[#D8E3EA] bg-white py-12 sm:py-14 md:py-20" aria-labelledby="recovery-harness-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[760px]">
          <h2 id="recovery-harness-title" className="font-lora text-[36px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
            <span className="heading-tone-dark">Evidence before action.</span> <span className="heading-tone-muted">Control before commitment.</span>
          </h2>
          <p className="mt-5 max-w-[720px] text-[16px] leading-7 text-[var(--margin-text-secondary)] sm:text-[18px] sm:leading-8">
            Margin evaluates each potential recovery against its source evidence, expected treatment, observed financial position, reconciliation status, materiality and applicable recovery controls. It identifies whether the event is supported for action, already accounted for, unresolved pending further evidence or unsuitable for recovery.
          </p>
        </motion.div>
        <div className="mt-10 grid gap-5 md:mt-14 md:grid-cols-3 md:gap-6">
          {recoveryHarnessPoints.map((point, index) => (
            <motion.article key={point.number} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className={`flex min-h-[330px] flex-col ${point.number === "01" ? "recovery-harness-card--guardrails bg-white" : "bg-transparent"}`}>
              {point.number === "01" ? <GuardrailListVisual /> : null}
              {point.number === "02" ? <SettlementOutcomeVisual /> : null}
              {point.number === "03" ? <ApprovalNotificationOrderVisual /> : null}
              <h3 className="mt-6 px-6 font-lora text-[25px] leading-[1.08] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:px-8 sm:text-[28px]">{point.title}</h3>
              <p className="mt-5 px-6 text-[15px] font-semibold leading-6 tracking-[-0.01em] text-[#294B61] sm:px-8">{point.lead}</p>
              {point.body ? <p className="mt-3 px-6 text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:px-8">{point.body}</p> : null}
              {point.outcome ? <p className="mt-auto px-6 pt-7 font-lora text-[17px] leading-6 tracking-[-0.02em] text-[var(--margin-text-primary)] sm:px-8">{point.outcome}</p> : null}
            </motion.article>
          ))}
        </div>
        <button type="button" className={`${landingPrimaryCtaClass} mt-8`} aria-label="See how Margin controls the next action">See how Margin controls the next action <ChevronRight className="h-4 w-4" /></button>
      </div>
    </section>
  );
}
function MarginLifecycleSection() {

  return (
    <section
      aria-labelledby="margin-lifecycle-title"
      className="relative overflow-hidden bg-white py-7 sm:py-8 md:py-11"
    >
      <div className={containerClass}>
        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        <motion.div {...revealProps} className="relative order-2 h-fit self-start lg:order-1">
          <FinalDelegationPreview compactMobile expandedMobile priority src="/report-generation" title="Report generation page preview" />
        </motion.div>
        <div className="order-1 flex flex-col justify-center lg:order-2">
        <motion.div {...revealProps} className="max-w-[980px]">
          <h2
            id="margin-lifecycle-title"
            className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]"
            style={{ fontWeight: 400 }}
          >
            <span className="heading-tone-dark">Follow every discrepancy beyond the moment Amazon closes the case.</span>
          </h2>
        </motion.div>

          <motion.p {...revealProps} className="mt-6 max-w-[780px] text-[14px] leading-6 tracking-[-0.01em] text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
            Margin maintains the connection between the original discrepancy, the evidence submitted, Amazon&apos;s responses and the resulting financial events. It can carry an authorized recovery through follow-ups, additional evidence, rejection handling and outcome verification, then identify whether the resulting adjustment is reflected in the relevant financial records.
          </motion.p>
          <motion.p {...revealProps} className="mt-5 max-w-[780px] text-[14px] leading-6 tracking-[-0.01em] text-[var(--margin-text-secondary)] md:text-[15px] md:leading-7">
            Finance retains control. Margin carries the investigative and authorized follow-through.
          </motion.p>
          <button type="button" className={`${landingPrimaryCtaClass} mt-6`} aria-label="See how Margin carries the work">See how Margin carries the work <ChevronRight className="h-4 w-4" /></button>
        </div>
        </div>
      </div>
    </section>
  );
}

const marginOperationAgents = [
  {
    number: "01",
    title: "Margin watches for losses",
    body: "Margin examines available Amazon financial and operational activity against defined control models to identify unusual charges, inventory discrepancies, missing adjustments and other events that may warrant investigation. Potential findings enter examination rather than being treated as confirmed losses.",
    outcome: "",
  },
  {
    number: "02",
    title: "Margin investigates what actually happened",
    body: "Margin brings together the originating transaction, relevant inventory or fulfilment activity, subsequent adjustments and associated financial records. It tests whether those events form a supported explanation or whether a genuine discrepancy remains.",
    outcome: "",
  },
  {
    number: "03",
    title: "Margin determines whether the recovery is worth pursuing",
    body: "Margin evaluates the evidence, potential recovery value, applicable rules, claim-window considerations and effort required. It distinguishes a recoverable position from a timing difference, an already-accounted-for event or an exception that needs more information.",
    outcome: "",
  },
  {
    number: "04",
    title: "Margin builds the evidence",
    body: "Margin assembles the source records, transaction references, calculations, supporting documents and investigation findings into a traceable evidence chain. Each material conclusion can be examined against the records that support it.",
    outcome: "",
  },
  {
    number: "05",
    title: "Margin prepares the case",
    body: "Margin structures the recovery around the originating event, the expected treatment, the observed discrepancy and the supporting evidence. The resulting case is prepared for review and approval rather than requiring your team to assemble the financial argument manually.",
    outcome: "",
  },
  {
    number: "06",
    title: "Margin moves the recovery forward",
    body: "Once authorized, Margin manages the approved recovery workflow, records submission details, tracks case status and maintains outstanding actions. The case retains its financial context as it progresses, rather than becoming a disconnected item in a spreadsheet or inbox.",
    outcome: "",
  },
  {
    number: "07",
    title: "Margin handles friction",
    body: "When Amazon requests additional information, rejects a submission or returns an outcome that needs examination, Margin connects the response to the existing evidence and financial position. It identifies what has changed, what further proof is needed and whether another action is justified.",
    details: ["Additional evidence", "Review", "Appeal", "Escalation", "Outcome reassessment"],
    outcome: "",
  },
  {
    number: "08",
    title: "Margin checks the result",
    body: "Margin tests the expected recovery against the actual recorded outcome, distinguishing approval from a recorded reimbursement, inventory adjustment or other financial treatment. It checks the relevant downstream records to establish whether the expected result appeared and what remains outstanding.",
    outcome: "",
    emphasis: true,
  },
  {
    number: "09",
    title: "Margin watches for reversals and incomplete outcomes",
    body: "Margin continues to evaluate the recovery against subsequent activity, including partial reimbursements, reversals, underpayments, replacement inventory and unresolved quantities or values. Where later activity changes the position, the recovery record is updated to reflect the new evidence rather than preserving an outdated success status.",
    details: ["Expected vs actual reimbursement", "Partial outcomes", "Underpayments", "Reversals", "Unresolved discrepancies"],
    outcome: "",
  },
];

function MarginOperationSection() {
  const reduceMotion = useReducedMotion();
  const operationScrollRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: operationScrollRef,
    offset: ["start start", "end end"],
  });
  const [activeAgent, setActiveAgent] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextAgent = Math.min(
      marginOperationAgents.length - 1,
      Math.floor(latest * marginOperationAgents.length),
    );
    setActiveAgent((current) => (current === nextAgent ? current : nextAgent));
  });

  return (
    <section ref={operationScrollRef} className="relative bg-[#FAFAF7] py-10 md:py-14">
      <div className={containerClass}>
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:h-fit">
            <motion.div {...revealProps}>
              <h2 className="font-lora text-[36px] leading-[0.99] tracking-[-0.05em] text-[#182026] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
                Your team doesn't have to coordinate every step of a recovery.
              </h2>
            </motion.div>
          </div>

          <div className="relative min-h-[560px] md:min-h-[620px]">
            <div className="sticky top-24 h-[min(500px,calc(100vh-8rem))] md:top-28 md:h-[min(540px,calc(100vh-10rem))]">
              <div className="relative h-full">
                {marginOperationAgents.map((agent, index) => {
                  const distance = index - activeAgent;
                  const isAhead = distance > 0;
                  const isBehind = distance < 0;
                  const isFeatured = agent.emphasis;

                  return (
                    <motion.article
                      key={agent.number}
                      initial={false}
                      animate={reduceMotion ? { opacity: index === activeAgent ? 1 : 0, y: 0, scale: 1 } : {
                        opacity: isBehind ? 0 : 1,
                        y: isBehind ? -48 : isAhead ? distance * 18 : 0,
                        scale: isBehind ? 0.94 : 1 - Math.min(distance, 7) * 0.018,
                      }}
                      transition={{ duration: reduceMotion ? 0 : 0.58, ease: [0.22, 1, 0.36, 1] }}
                      className={`absolute inset-0 overflow-hidden rounded-[22px] border p-4 shadow-[0_18px_54px_rgba(37,49,58,0.1)] backdrop-blur-xl sm:p-6 md:p-7 ${
                        isFeatured
                          ? "border-[#BFD8EA] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_52%,#EAF4FF_100%)]"
                          : index % 2 === 0
                            ? "border-[#D8E3EA] bg-white/90"
                            : "border-[#CFE0EA] bg-[#F8FAFC]/90"
                      }`}
                      style={{ zIndex: marginOperationAgents.length - index, pointerEvents: index === activeAgent ? "auto" : "none" }}
                    >
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top_right,_rgba(11,116,222,0.13),_transparent_62%)]" />
                      <div className="relative flex h-full flex-col">
                        <div className="flex items-center justify-between gap-3 border-b border-[#E4EDF1] pb-3">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#7A8994]">
                            Operation {agent.number}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-tight text-[#94A3B8]">
                            {String(index + 1).padStart(2, "0")} / {String(marginOperationAgents.length).padStart(2, "0")}
                          </span>
                        </div>
                        <h3 className="mt-4 max-w-[700px] font-lora text-[26px] leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[32px] md:text-[38px]" style={{ fontWeight: 400 }}>
                          {agent.title}
                        </h3>
                        <p className="mt-4 max-w-[620px] text-[13px] leading-[1.45] text-[#4D5B66] md:text-[14px] md:leading-6">
                          {agent.body}
                        </p>
                        {agent.details ? (
                          <div className="mt-5 flex flex-wrap gap-x-2.5 gap-y-1.5 border-t border-[#E4EDF1] pt-3">
                            {agent.details.map((detail) => (
                              <span key={detail} className="rounded-full border border-[#D8E3EA] bg-white/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">
                                {detail}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        {agent.outcome ? (
                          <p className={`mt-auto max-w-[620px] border-t border-[#E4EDF1] pt-3 font-lora text-[18px] leading-tight tracking-[-0.025em] sm:text-[21px] ${isFeatured ? "text-[#0B74DE]" : "text-[#66737F]"}`} style={{ fontWeight: 400 }}>
                            {agent.outcome}
                          </p>
                        ) : null}
                      </div>
                    </motion.article>
                  );
                })}
              </div>

              <div className="absolute -bottom-9 left-0 right-0 flex items-center justify-between gap-5">
                <div className="h-px flex-1 bg-[#D8E3EA]">
                  <motion.div
                    className="h-px origin-left bg-[#0B74DE]"
                    animate={{ scaleX: (activeAgent + 1) / marginOperationAgents.length }}
                    transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">
                  {String(activeAgent + 1).padStart(2, "0")} / {String(marginOperationAgents.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const controlPrinciples = [
  {
    title: "Read-only access",
    body: "Margin starts by examining your Amazon data without changing anything.",
  },
  {
    title: "Evidence before action",
    body: "Every recovery is grounded in the records that support it.",
  },
  {
    title: "You approve consequential actions",
    body: "Before Margin submits a recovery, you can see what happened, what supports it, and what Margin is going to do.",
  },
  {
    title: "Everything stays visible",
    body: "Evidence, decisions, case activity, Amazon responses, payments, and outcomes remain connected and visible.",
  },
];

function ControlSection() {
  const reduceMotion = useReducedMotion();
  const [activeControlStep, setActiveControlStep] = useState(0);

  const controlSteps = [
    { label: "Amazon activity", detail: "New recovery signal", tone: "signal" },
    { label: "Evidence ready", detail: "Records connected", tone: "evidence" },
    { label: "Seller review", detail: "Approval required", tone: "approval" },
    { label: "Margin handling", detail: "Submission and follow-up", tone: "handled" },
    { label: "Outcome visible", detail: "Response and payout tracked", tone: "outcome" },
  ];

  useEffect(() => {
    if (reduceMotion) {
      setActiveControlStep(controlSteps.length - 1);
      return;
    }
    const timer = window.setInterval(() => {
      setActiveControlStep((current) => (current + 1) % controlSteps.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const step = controlSteps[activeControlStep];
  const isApproval = step.tone === "approval";
  const isHandled = activeControlStep >= 3;

  return (
    <section className="relative overflow-hidden bg-[#FAFAF7] py-8 sm:py-10 md:py-12" aria-labelledby="control-section-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <motion.div {...revealProps} className="lg:sticky lg:top-28">
            <h2 id="control-section-title" className="max-w-[620px] font-lora text-[34px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[56px]" style={{ fontWeight: 400 }}>
              <span className="heading-tone-dark">Never lose track of what changed—or what that change left unresolved.</span>
            </h2>
            <p className="mt-6 max-w-[560px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              As Amazon responds, issues credits, reverses adjustments or changes the status of an event, Margin updates the associated recovery record and reassesses its financial implications. The investigation retains the previous state, the new evidence, the resulting change in value and any outstanding work, so each decision builds on the actual history rather than replacing it.
            </p>
            <p className="mt-4 max-w-[560px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[#48677A] md:text-[17px] md:leading-8"></p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="relative overflow-hidden">
            <FinalDelegationPreview compactMobile expandedMobile src="/filing-pipeline-preview" title="Recovery operations page preview" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function MarginStandardSection() {
  const reduceMotion = useReducedMotion();
  const standardSteps = [
    "Already accounted for",
    "Evidence insufficient",
    "Supported for recovery",
    "Attribution not established",
    "Controlled action ready",
  ];
  const [activeStandardStep, setActiveStandardStep] = useState(0);
  const [standardPhase, setStandardPhase] = useState<"typing" | "pause" | "deleting" | "empty">("typing");
  const [visibleStandardLength, setVisibleStandardLength] = useState(reduceMotion ? standardSteps[0].length : 0);
  const activeStandardText = standardSteps[activeStandardStep];
  const visibleStandardText = activeStandardText.slice(0, visibleStandardLength);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleStandardLength(activeStandardText.length);
      setStandardPhase("pause");
      return;
    }

    let delay = 0;
    if (standardPhase === "typing") {
      if (visibleStandardLength < activeStandardText.length) delay = 39;
      else {
        setStandardPhase("pause");
        return;
      }
    } else if (standardPhase === "pause") {
      delay = 1267;
    } else if (standardPhase === "deleting") {
      if (visibleStandardLength > 0) delay = 23;
      else {
        setStandardPhase("empty");
        return;
      }
    } else {
      delay = 187;
    }

    const timeout = window.setTimeout(() => {
      if (standardPhase === "typing") {
        setVisibleStandardLength((length) => Math.min(length + 1, activeStandardText.length));
      } else if (standardPhase === "pause") {
        setStandardPhase("deleting");
      } else if (standardPhase === "deleting") {
        setVisibleStandardLength((length) => Math.max(length - 1, 0));
      } else {
        setActiveStandardStep((current) => {
          const nextOptions = standardSteps.map((_, index) => index).filter((index) => index !== current);
          return nextOptions[Math.floor(Math.random() * nextOptions.length)];
        });
        setVisibleStandardLength(0);
        setStandardPhase("typing");
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [activeStandardText, reduceMotion, standardPhase, visibleStandardLength]);

  return (
    <section className="relative overflow-hidden bg-white py-7 sm:py-8 md:py-11" aria-labelledby="margin-standard-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
          <motion.div {...revealProps} className="order-1 max-w-[720px] lg:order-2">
            <h2 id="margin-standard-title" className="font-lora text-[34px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[58px]" style={{ fontWeight: 400 }}>
              <span className="heading-tone-dark">Don't put your business behind a claim the evidence cannot defend.</span>
            </h2>
            <p className="mt-6 max-w-[660px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">
              Margin tests a potential recovery against the original event, expected financial treatment, observed activity, source lineage, materiality and applicable recovery rules. It checks for alternative explanations, duplicate exposure, timing differences and insufficient evidence before recommending whether the position should proceed, remain on hold, be accounted for or be closed.
            </p>
            <p className="mt-4 max-w-[660px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">The result is a controlled decision — not a claim generated simply because a discrepancy was detected.</p>
          </motion.div>

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="order-2 border-t border-[var(--margin-border)] lg:order-1">
            <div className="relative flex min-h-[210px] items-center justify-start overflow-hidden border-b border-[var(--margin-border)] py-10 text-left sm:min-h-[260px] sm:px-5 sm:py-12" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={activeStandardText}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-[620px] self-start text-left font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#20252A] sm:text-[46px] md:text-[58px]"
                  style={{ fontFamily: '"Lora", serif', fontWeight: 500 }}
                >
                  {visibleStandardText || "\u00A0"}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FastLandingTypewriter({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : "");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(text);
      onCompleteRef.current?.();
      return;
    }
    setVisibleText("");
    let index = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));
        if (index >= text.length) {
          if (interval) window.clearInterval(interval);
          onCompleteRef.current?.();
        }
      }, 3);
    }, 70);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [reduceMotion, text]);

  return <>{visibleText}{!reduceMotion && visibleText.length < text.length ? <span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /> : null}</>;
}

function OneRecordAnalysisVisual() {
    const checks = [
      ['Event identity resolved', 'Shipment, SKU, ASIN, receiving node, carrier movement, and settlement period resolve to one canonical financial event.'],
      ['Expected versus received reconciled', '2,416 units were expected; 2,352 were received. The 64-unit variance remains open after the receiving window closed.'],
      ['Cross-system evidence agrees', 'Carrier delivery, 3PL intake, and Amazon receiving records support the same delivery window and custody trail.'],
      ['Offsets and timing noise excluded', 'Inventory adjustments, duplicate lines, and subsequent settlement activity do not clear or duplicate the variance.'],
      ['Materiality and ownership assessed', 'Supported exposure is $4,144.00 at a verified $64.75 unit cost; Finance Operations owns the decision.'],
      ['Decision package ready', 'The supported exposure is separated from unresolved items and ready for the next controlled action.'],
    ];
    const narrative = [
      'Northstar Commerce LLC · Review scope: 9,284 inbound shipments · 2.8M units · Amazon US · Q3 2026',
      "For this event, Amazon's receiving record shows 2,352 units received against a shipment plan for 2,416 units. The supported exposure is $4,144.00, based on a verified unit cost of $64.75.",
      'The 64-unit difference remains unresolved after the receiving window closed; it is not a timing difference, duplicate line, or immaterial posting variance.',
      "Carrier delivery and 3PL intake records agree with Amazon's receiving window, establishing custody while leaving the shortage inside Amazon's receiving trail.",
      'The inventory ledger and settlement activity do not clear the variance; no offsetting reimbursement credit is recorded for the reviewed period.',
      'Margin states the supported exposure, preserves the unresolved remainder, and routes the decision to Finance Operations with the evidence already assembled.',
    ];
    const reduceMotion = useReducedMotion();
    const visualRef = useRef<HTMLDivElement>(null);
    const isInView = useInView(visualRef, { once: true, amount: 0.28 });
    const [activeItem, setActiveItem] = useState(reduceMotion ? narrative.length : 0);

    useEffect(() => {
      if (reduceMotion) {
        setActiveItem(narrative.length);
        return;
      }
      if (!isInView || activeItem < narrative.length) return;
      const resetTimer = window.setTimeout(() => setActiveItem(0), 4000);
      return () => window.clearTimeout(resetTimer);
    }, [activeItem, isInView, reduceMotion]);

    const advance = () => {
      if (reduceMotion) return;
      setActiveItem((current) => Math.min(current + 1, narrative.length));
    };

    return (
      <div ref={visualRef} className="relative isolate max-h-[360px] overflow-y-auto bg-white sm:max-h-none sm:overflow-hidden">
        <div className="relative grid gap-3 bg-white p-3 sm:p-4 lg:grid-cols-[1.32fr_0.68fr] lg:gap-4">
          <div className="bg-white p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 pb-2"><div><p className="mt-0.5 font-lora text-[14px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[15px]">Inbound receiving variance · Amazon US · Q3 2026</p></div></div>
            <div className="mt-2.5 space-y-1.5 text-[11px] leading-5 text-[#4D5B66]" aria-live="polite" aria-atomic="false">
              {narrative.map((line, index) => {
                const visible = reduceMotion || index <= activeItem;
                const active = !reduceMotion && index === activeItem;
                const content = reduceMotion || index < activeItem ? line : active ? <FastLandingTypewriter text={line} onComplete={advance} /> : null;
                return <motion.div key={line} initial={false} animate={visible ? { opacity: 1, y: 0, height: "auto" } : { opacity: 0, y: -14, height: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">{content}</motion.div>;
              })}
            </div>
          </div>
          <div className="space-y-1.5 p-1 sm:p-2">
            <p className="mb-1 text-[11px] font-medium tracking-tight text-[#182026]">What the reconciliation establishes</p>
            {checks.map(([title, detail], index) => <motion.div key={title} initial={false} animate={reduceMotion || index < activeItem ? { opacity: 1, y: 0, height: "auto" } : { opacity: 0, y: -14, height: 0 }} transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"><div className="flex items-start gap-2 rounded-[7px] bg-[#F1F3F4] px-2 py-1.5 text-[#182026]"><span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#16866B] text-white" aria-hidden="true"><Check className="h-2 w-2" strokeWidth={3} /></span><span className="min-w-0"><span className="block text-[10px] font-semibold leading-3.5 tracking-tight text-[#182026]">{title}</span><span className="mt-0.5 block text-[9px] leading-3.5 text-[#4D5B66]">{detail}</span></span></div></motion.div>)}
            <motion.div animate={reduceMotion || activeItem >= narrative.length ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }} transition={{ duration: 0.35 }} className="mt-1 flex items-center justify-between pt-3 text-[11px] font-medium tracking-tight text-[#182026]"><span>Supported recovery basis</span><ArrowRight className="h-3.5 w-3.5 text-[#0B74DE]" aria-hidden="true" /></motion.div>
          </div>
        </div>
      </div>
    );
  }
  function RecoveryWorkStatement() {
  return (
    <section className="one-record-audit-surface relative overflow-hidden bg-white py-7 sm:py-8 md:py-11" aria-labelledby="trust-section-title">
      <div className={containerClass}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-10">
          <motion.div {...revealProps} className="flex flex-col justify-center">
            <h2 id="trust-section-title" className="mt-4 font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[#182026] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}><span className="heading-tone-dark">Know why a discrepancy exists before deciding what to do about it.</span></h2>
            <p className="mt-4 max-w-[780px] text-[14px] leading-6 text-[#4D5B66] md:text-[15px] md:leading-7">Margin investigates a discrepancy across its originating event and relevant downstream records, testing possible explanations such as reversals, adjustments, reimbursements, timing differences and duplicate entries. It establishes whether the difference is explained, remains unresolved or has evidence supporting a recovery — before the next action is recommended.</p>
            <button type="button" className={`${landingPrimaryCtaClass} mt-6`} aria-label="Start with your financial records">Start with your financial records <ArrowRight className="h-4 w-4" /></button>
            <p className="mt-4 max-w-[780px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[#52616A] md:text-[17px] md:leading-8">Your team reviews the established position. It doesn&apos;t have to rebuild the investigation.</p>
          </motion.div>
          <motion.div {...revealProps} className="relative">
            <OneRecordAnalysisVisual />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecoveryThreadSection({ onAuditCta }: { onAuditCta: (location: string) => void }) {
  const recoveryThreadCards = [
    {
      title: "See the population. Know its financial position.",
      copy: "Margin maintains a structured view of the recovery population, connecting each examined event to its source records, investigation status, supported exposure, accounted-for value and outstanding actions. Finance can distinguish active opportunities from resolved items and exceptions that still require attention.",
      visual: (
        <div className="relative isolate h-full overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-[#F7F9F8] shadow-[0_18px_60px_rgba(37,49,58,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,rgba(255,255,255,0.98),transparent_36%),linear-gradient(135deg,#F8FAF9_0%,#EEF3F1_54%,#F9FAF8_100%)]" />
          <motion.div aria-hidden="true" className="absolute -left-10 -top-10 h-36 w-36 rounded-full bg-[#D9EEE8]/75 blur-2xl" animate={{ x: [0, 16, 0], y: [0, 12, 0], scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div aria-hidden="true" className="absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-[#D8E8F4]/75 blur-2xl" animate={{ x: [0, -14, 0], y: [0, -10, 0], scale: [1.05, 0.92, 1.05] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
          <motion.div
            className="absolute left-[9%] right-[9%] top-[18%] -translate-y-1/2 lg:top-[7%]"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-2.5">
              {[
                "Inbound receiving · supported exposure",
                "Referral fee · expected rate variance",
                "Return credit · settlement shortfall",
                "Removal count · unresolved variance",
                "Warehouse damage · evidence pending",
              ].map((label, index) => (
                <div key={label} className={`flex items-center gap-3 rounded-[10px] border border-white/70 px-3 py-2.5 shadow-[0_12px_28px_rgba(56,74,82,0.08),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-lg sm:px-4 sm:py-3 ${index === 0 ? "bg-white/62" : index === 1 ? "bg-white/54" : index === 2 ? "bg-white/48" : "bg-white/42"}`}>
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${index === 0 || index === 2 ? "border-[#8DB8D0] bg-[#E8F3F8] text-[#0B74DE]" : "border-[#C8D0CD] bg-white/60"}`} aria-hidden="true">{(index === 0 || index === 2) && <Check className="h-3 w-3" strokeWidth={2.5} />}</span>
                  <span className="min-w-0 flex-1 truncate font-sans text-[11px] font-medium tracking-[-0.02em] text-[#344149] sm:text-[13px]">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      title: "The recovery record stays connected.",
      copy: "Margin keeps the relevant shipment, inventory, transaction, evidence, Amazon response and settlement references associated with the same underlying financial event. The investigation, case history and recorded outcome remain connected rather than scattered across separate operational records.",
      visual: (
        <div className="relative isolate h-full overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-[#F7F9F8] shadow-[0_18px_60px_rgba(37,49,58,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.98),transparent_38%),linear-gradient(135deg,#F8FAF9_0%,#EEF3F1_54%,#F9FAF8_100%)]" />
          <motion.div aria-hidden="true" className="absolute -right-12 -top-10 h-40 w-40 rounded-full bg-[#D8E8F4]/75 blur-2xl" animate={{ x: [0, -14, 0], y: [0, 12, 0], scale: [1, 1.1, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div aria-hidden="true" className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-[#D9EEE8]/70 blur-2xl" animate={{ x: [0, 16, 0], y: [0, -10, 0], scale: [1.05, 0.92, 1.05] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
          <motion.div
            className="absolute left-[6%] right-[6%] top-[25%] -translate-y-1/2"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative min-h-[190px]">
              <div className="absolute left-0 right-[8%] top-0 rounded-[11px] border border-white/85 bg-white/62 px-2.5 py-2.5 shadow-[0_16px_34px_rgba(56,74,82,0.12),inset_0_1px_0_rgba(255,255,255,0.96)] backdrop-blur-xl sm:px-3 sm:py-3">
                <div className="flex items-start justify-between gap-2 border-b border-[#D9E2E2]/80 pb-1.5">
                  <div>
                    <p className="font-mono text-[7px] font-semibold uppercase tracking-tight text-[#748188] sm:text-[8px]">Context</p>
                    <p className="mt-0.5 text-[10px] font-semibold leading-3.5 tracking-[-0.02em] text-[#26333A] sm:text-[11px]">Northstar Commerce LLC · Amazon US</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-tight text-[#859198]">Status</p>
                    <p className="mt-0.5 text-[9px] font-medium leading-3.5 text-[#26333A] sm:text-[10px]">Response under review</p>
                  </div>
                  <div>
                    <p className="font-mono text-[7px] uppercase tracking-tight text-[#859198]">Next milestone</p>
                    <p className="mt-0.5 text-[9px] font-medium leading-3.5 text-[#26333A] sm:text-[10px]">Submit reconciled recovery packet</p>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1.5 border-t border-[#D9E2E2]/80 pt-2">
                  <div className="rounded-[6px] bg-white/45 px-1.5 py-1">
                    <p className="font-mono text-[7px] uppercase tracking-tight text-[#859198]">Reversal watch</p>
                    <p className="mt-0.5 text-[9px] font-medium text-[#26333A] sm:text-[10px]">Monitored</p>
                  </div>
                  <div className="rounded-[6px] bg-white/45 px-1.5 py-1">
                    <p className="font-mono text-[7px] uppercase tracking-tight text-[#859198]">Appeal route</p>
                    <p className="mt-0.5 text-[9px] font-medium text-[#26333A] sm:text-[10px]">Available</p>
                  </div>
                </div>
              </div>
              <div className="relative z-10 ml-[22%] w-[78%] space-y-1.5 pt-3 sm:pt-4">
                <p className="mb-1 font-mono text-[7px] font-semibold uppercase tracking-tight text-[#748188] sm:text-[8px]">Next actions</p>
                <div className="flex items-center gap-2 rounded-[8px] border border-white/80 bg-white/64 px-2 py-2 shadow-[0_10px_22px_rgba(56,74,82,0.1),inset_0_1px_0_rgba(255,255,255,0.94)] backdrop-blur-lg sm:px-2.5">
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border border-[#C8D0CD] bg-white/70" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-[#344149] sm:text-[10px]">Validate receiving evidence</span>
                  <img src="/gd.png" alt="Google Drive" className="h-4 w-4 shrink-0 object-contain" />
                </div>
                <div className="flex items-center gap-2 rounded-[8px] border border-white/70 bg-white/54 px-2 py-2 shadow-[0_9px_20px_rgba(56,74,82,0.08)] backdrop-blur-lg sm:px-2.5">
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border border-[#C8D0CD] bg-white/64" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-[#46535A] sm:text-[10px]">Reconcile Amazon response</span>
                  <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 shrink-0 object-contain" />
                </div>
                <div className="flex items-center gap-2 rounded-[8px] border border-white/65 bg-white/46 px-2 py-2 shadow-[0_8px_18px_rgba(56,74,82,0.06)] backdrop-blur-md sm:px-2.5">
                  <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border border-[#C8D0CD] bg-white/58" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[9px] font-medium text-[#566167] sm:text-[10px]">Prepare controlled submission</span>
                  <img src="/logoimagetwo.png" alt="Margin" className="h-4 w-auto shrink-0 object-contain" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      ),
    },
    {
      title: "The next action stays accountable.",
      copy: "Each open position carries its current status, outstanding requirement, responsible owner and next justified action. Margin preserves the financial context as work moves between investigators, approvers and existing business systems, so handoffs do not lose the reason the action exists.",
      visual: (
        <div className="relative isolate h-full overflow-hidden rounded-[8px] border border-[#D8E2E8]/80 bg-[#F7F9F8] shadow-[0_18px_60px_rgba(37,49,58,0.08)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.96),transparent_36%),linear-gradient(135deg,#F8FAF9_0%,#EEF3F1_52%,#F9FAF8_100%)]" />
          <motion.div
            aria-hidden="true"
            className="absolute -left-8 -top-10 h-36 w-36 rounded-full bg-[#D9EEE8]/75 blur-2xl"
            animate={{ x: [0, 18, 0], y: [0, 12, 0], scale: [1, 1.12, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden="true"
            className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-[#DCE7F4]/80 blur-2xl"
            animate={{ x: [0, -16, 0], y: [0, -10, 0], scale: [1.05, 0.92, 1.05] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />
          <motion.div
            className="absolute left-[9%] right-[9%] top-[17%] -translate-y-1/2 lg:top-[3%]"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative flex items-center gap-3 rounded-[10px] border border-white/80 bg-white/62 px-3 py-2 shadow-[0_14px_32px_rgba(56,74,82,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl sm:px-4 sm:py-2.5">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#C8D0CD] bg-white/70" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="block truncate font-sans text-[12px] font-medium leading-tight tracking-[-0.02em] text-[#26333A] sm:text-[14px]">Reconcile Amazon response</span><span className="mt-0.5 block truncate font-sans text-[10px] leading-tight tracking-[-0.01em] text-[#667177] sm:text-[11px]">Response basis recorded</span></span>
              <img src="/gmailicon.png" alt="Gmail" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
            </div>
            <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-white/70 bg-white/48 px-3 py-1.5 shadow-[0_12px_28px_rgba(56,74,82,0.08),inset_0_1px_0_rgba(255,255,255,0.88)] backdrop-blur-lg sm:px-4 sm:py-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#C8D0CD] bg-white/62" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2 truncate font-sans text-[11px] font-medium leading-tight tracking-[-0.02em] text-[#3A474D] sm:text-[13px]">Validate receiving evidence <span className="h-3 w-3 shrink-0 rounded-full border-2 border-[#87949A]/35 border-t-[#66757C]" aria-label="Fetching in progress" /></span><span className="mt-0.5 block truncate font-sans text-[10px] leading-tight tracking-[-0.01em] text-[#667177] sm:text-[11px]">BOL, POD, and 3PL receipt matched</span></span>
              <img src="/gd.png" alt="Google Drive" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
            </div>
            <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-white/70 bg-white/42 px-3 py-1.5 shadow-[0_10px_24px_rgba(56,74,82,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-md sm:px-4 sm:py-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#C8D0CD] bg-white/56" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="flex items-center gap-2 truncate font-sans text-[11px] font-medium leading-tight tracking-[-0.02em] text-[#4A555B] sm:text-[13px]">Validate product-to-event lineage <span className="h-3 w-3 shrink-0 rounded-full border-2 border-[#87949A]/35 border-t-[#66757C]" aria-label="Validation in progress" /></span><span className="mt-0.5 block truncate font-sans text-[10px] leading-tight tracking-[-0.01em] text-[#667177] sm:text-[11px]">ASIN/FNSKU and inventory identity tied out</span></span>
              <img src="/outlookicon.webp" alt="Outlook" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
            </div>
            <div className="mt-2.5 flex items-center gap-3 rounded-[10px] border border-white/70 bg-white/38 px-3 py-1.5 shadow-[0_8px_20px_rgba(56,74,82,0.05),inset_0_1px_0_rgba(255,255,255,0.78)] backdrop-blur-md sm:px-4 sm:py-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border border-[#C8D0CD] bg-white/52" aria-hidden="true" />
              <span className="min-w-0 flex-1"><span className="block truncate font-sans text-[11px] font-medium leading-tight tracking-[-0.02em] text-[#566167] sm:text-[13px]">Route controlled action</span><span className="mt-0.5 block truncate font-sans text-[10px] leading-tight tracking-[-0.01em] text-[#667177] sm:text-[11px]">Finance owner and decision state recorded</span></span>
              <img src="/slack-icon-2019.png" alt="Slack" className="h-5 w-5 shrink-0 object-contain sm:h-6 sm:w-6" />
            </div>
          </motion.div>
        </div>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#FAFAF7] py-8 sm:py-10 md:py-12" aria-labelledby="recovery-thread-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[860px]">
          <h2 id="recovery-thread-title" className="max-w-[900px] font-lora text-[36px] leading-[1.01] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[46px] md:text-[56px]" style={{ fontWeight: 400 }}><span className="heading-tone-dark">Be able to trace what a recovery actually put back into the business.</span></h2>
    <p className="mt-5 max-w-[840px] font-sans text-[16px] font-normal leading-[1.6] tracking-[-0.01em] text-[#294B61]">Margin maintains a structured view of the recovery population, connecting each examined event to its source records, investigation status, supported exposure, accounted-for value and outstanding actions.</p>
        </motion.div>

        <div className="mt-10 grid gap-5 md:grid-cols-3 md:gap-6 lg:mt-12 lg:gap-8">
          {recoveryThreadCards.map((card, index) => (
            <motion.article key={card.title} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className="min-w-0 pt-4">
              <div className="relative aspect-[1.4] overflow-hidden rounded-[8px] bg-transparent shadow-none">{card.visual}</div>
              <h3 className="mt-2 font-lora text-[25px] leading-[1.06] tracking-[-0.035em] text-[var(--margin-text-primary)] sm:text-[29px]">{card.title}</h3>
              <p className="mt-3 text-[13px] leading-6 text-[var(--margin-text-secondary)] md:text-[14px] md:leading-7">{card.copy}</p>
            </motion.article>
          ))}
        </div>

      </div>
    </section>
  );
}

const nestedRecoveryBrowsers = {
  progress: { label: 'Progress review', path: '/progress-review' },
  evidence: { label: 'Evidence required', path: '/evidence-required' },
} as const;

function NestedRecoveryVisual({
  activeBrowser,
  onBrowserChange,
  progressPath = nestedRecoveryBrowsers.progress.path,
}: {
  activeBrowser: keyof typeof nestedRecoveryBrowsers;
  onBrowserChange: (browser: keyof typeof nestedRecoveryBrowsers) => void;
  progressPath?: string;
}) {
  const browsers = {
    ...nestedRecoveryBrowsers,
    progress: { ...nestedRecoveryBrowsers.progress, path: progressPath },
  };

  return (
    <motion.div {...revealProps} className="relative min-h-[620px] overflow-visible bg-transparent p-2 sm:min-h-[570px] sm:p-4">
      <div className="relative h-full min-h-[590px] sm:min-h-[538px]">
        {(Object.keys(browsers) as Array<keyof typeof browsers>).map((key) => {
          const isActive = activeBrowser === key;
          const browser = browsers[key];
          return (
            <div key={key} role="button" tabIndex={0} onClick={() => onBrowserChange(key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onBrowserChange(key); }} aria-label={`Show ${browser.label}`} className={`absolute overflow-hidden rounded-[10px] border text-left transition-all duration-500 ${key === 'progress' ? 'left-[1%] top-[3%] h-[78%] w-[92%] sm:left-[3%] sm:top-[5%] sm:h-[76%] sm:w-[78%]' : 'bottom-[2%] right-[1%] h-[76%] w-[92%] sm:bottom-[3%] sm:right-[3%] sm:h-[73%] sm:w-[78%]'} ${isActive ? 'z-20 border-white/95 shadow-[0_24px_48px_rgba(37,73,91,0.25)]' : 'z-10 border-white/65 shadow-[0_12px_30px_rgba(37,73,91,0.14)]'}`}>
              <div className="flex h-7 items-center gap-1.5 border-b border-white/55 bg-white/35 px-2 backdrop-blur-md"><span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" /><span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" /><span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" /></div>
              <iframe title={`${browser.label} live preview`} src={browser.path} className={`h-[calc(100%-28px)] w-full border-0 bg-[#FBFAF7] ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`} loading="lazy" />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

const financialCertaintyBrowsers = {
  issues: { label: 'Issues found', path: '/issues-found' },
  operations: { label: 'Recovery operations', path: '/filing-pipeline-preview' },
} as const;

function FinancialCertaintyNestedVisual() {
  const [activeBrowser, setActiveBrowser] = useState<keyof typeof financialCertaintyBrowsers>('issues');

  return (
    <div className="relative min-h-[620px] overflow-hidden rounded-[5px] bg-transparent p-2 sm:min-h-[570px] sm:p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.95),transparent_34%),linear-gradient(135deg,#EAF5F9_0%,#DCECF2_52%,#F6FAFB_100%)]" />
      <motion.div aria-hidden="true" className="absolute -left-14 -top-16 h-48 w-48 rounded-full bg-[#B9E0EF]/60 blur-3xl" animate={{ x: [0, 18, 0], y: [0, 14, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div aria-hidden="true" className="absolute -bottom-16 -right-12 h-52 w-52 rounded-full bg-[#C9D5F0]/65 blur-3xl" animate={{ x: [0, -16, 0], y: [0, -12, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="relative h-full min-h-[590px] sm:min-h-[538px]">
        {(Object.keys(financialCertaintyBrowsers) as Array<keyof typeof financialCertaintyBrowsers>).map((key) => {
          const browser = financialCertaintyBrowsers[key];
          const isActive = activeBrowser === key;
          const frameClass = key === 'issues'
            ? 'left-[1%] top-[3%] h-[78%] w-[92%] sm:left-[3%] sm:top-[5%] sm:h-[76%] sm:w-[78%]'
            : 'bottom-[2%] right-[1%] h-[76%] w-[92%] sm:bottom-[3%] sm:right-[3%] sm:h-[73%] sm:w-[78%]';
          return (
            <div key={key} role="button" tabIndex={0} onClick={() => setActiveBrowser(key)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setActiveBrowser(key); }} aria-label={`Show ${browser.label}`} className={`absolute overflow-hidden rounded-[10px] border text-left transition-all duration-500 ${frameClass} ${isActive ? 'z-20 border-white/95 shadow-[0_24px_48px_rgba(37,73,91,0.25)]' : 'z-10 border-white/65 shadow-[0_12px_30px_rgba(37,73,91,0.14)]'}`}>
              <div className="flex h-7 items-center gap-1.5 border-b border-white/55 bg-white/35 px-2 backdrop-blur-md"><span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" /><span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" /><span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" /></div>
              <iframe title={`${browser.label} page preview`} src={browser.path} className={`h-[calc(100%-28px)] w-full border-0 bg-[#FBFAF7] ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`} loading="lazy" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const reconstructionGapBrowsers = {
  progress: { label: 'Progress review', path: '/progress-preview' },
  evidence: { label: 'Evidence required', path: '/evidence-required' },
  amazonThread: { label: 'Amazon thread', path: '/amazon-thread-review' },
} as const;

function ReconstructionGapNestedVisual() {
  const [activeBrowser, setActiveBrowser] = useState<keyof typeof reconstructionGapBrowsers>('progress');

  return (
    <motion.div {...revealProps} className="relative min-h-[620px] overflow-hidden rounded-[12px] border border-[#C8DCE5]/80 bg-[#E5F0F3] p-2 shadow-[0_24px_70px_rgba(37,91,116,0.16)] sm:min-h-[570px] sm:p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.95),transparent_34%),linear-gradient(135deg,#EAF5F9_0%,#DCECF2_52%,#F6FAFB_100%)]" />
      <motion.div aria-hidden="true" className="absolute -left-14 -top-16 h-48 w-48 rounded-full bg-[#B9E0EF]/60 blur-3xl" animate={{ x: [0, 18, 0], y: [0, 14, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div aria-hidden="true" className="absolute -bottom-16 -right-12 h-52 w-52 rounded-full bg-[#C9D5F0]/65 blur-3xl" animate={{ x: [0, -16, 0], y: [0, -12, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="relative h-full min-h-[590px] sm:min-h-[538px]">
        {(Object.keys(reconstructionGapBrowsers) as Array<keyof typeof reconstructionGapBrowsers>).map((key) => {
          const browser = reconstructionGapBrowsers[key];
          const isActive = activeBrowser === key;
          const frameClass = key === 'progress'
            ? 'left-[1%] top-[3%] h-[78%] w-[92%] sm:left-[3%] sm:top-[5%] sm:h-[76%] sm:w-[78%]'
            : key === 'evidence'
              ? 'bottom-[2%] right-[1%] h-[76%] w-[92%] sm:bottom-[3%] sm:right-[3%] sm:h-[73%] sm:w-[78%]'
              : 'bottom-[1%] right-[0%] h-[40%] w-[72%] sm:bottom-[1%] sm:right-[1%] sm:h-[38%] sm:w-[62%]';
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => setActiveBrowser(key)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setActiveBrowser(key); }}
              aria-label={`Show ${browser.label}`}
              className={`absolute overflow-hidden rounded-[10px] border text-left transition-all duration-500 ${frameClass} ${isActive ? 'z-30 border-white/95 shadow-[0_24px_48px_rgba(37,73,91,0.25)]' : 'z-10 border-white/65 shadow-[0_12px_30px_rgba(37,73,91,0.14)]'}`}
            >
              <div className="flex h-7 items-center gap-1.5 border-b border-white/55 bg-white/35 px-2 backdrop-blur-md"><span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" /><span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" /><span className="h-2 w-2 rounded-full bg-[#B8C0C6]/80" /></div>
              <iframe title={`${browser.label} live preview`} src={browser.path} className={`h-[calc(100%-28px)] w-full border-0 bg-[#FBFAF7] ${isActive ? 'pointer-events-auto' : 'pointer-events-none'}`} loading="lazy" />
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function NestedRecoveryBrowsers() {
  const [activeBrowser, setActiveBrowser] = useState<keyof typeof nestedRecoveryBrowsers>('progress');
  const browsers = nestedRecoveryBrowsers;

  return (
    <section className="relative overflow-hidden border-t border-[#D8DEDA] bg-[#F4F8F8] py-8 sm:py-10 md:py-12" aria-labelledby="nested-recovery-title">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center lg:gap-14">
          <motion.div {...revealProps} className="order-1 lg:order-2">
            <h2 id="nested-recovery-title" className="max-w-[560px] font-lora text-[34px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[52px]" style={{ fontWeight: 400 }}><span className="heading-tone-dark">Don't hand Finance a closed case with an open financial question.</span></h2>
            <p className="mt-6 max-w-[560px] text-[15px] leading-7 text-[var(--margin-text-secondary)] md:text-[17px] md:leading-8">Margin brings the case evidence, Amazon decisions, recorded adjustments and settlement activity together to establish the recovery&apos;s financial result. It identifies what was recovered or otherwise resolved, what has been accounted for, and whether any residual difference remains between the expected and observed position.</p>
            <button type="button" className={`${landingPrimaryCtaClass} mt-6`} aria-label="View a recovery record">View a recovery record <ChevronRight className="h-4 w-4" /></button>
            <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Nested recovery pages">
              {(Object.keys(browsers) as Array<keyof typeof browsers>).map((key) => (
                <button key={key} type="button" role="tab" aria-selected={activeBrowser === key} onClick={() => setActiveBrowser(key)} className={`rounded-full px-3 py-1.5 text-[11px] font-medium tracking-tight transition-colors ${activeBrowser === key ? 'bg-[#DCEBF2] text-[#284B5B]' : 'bg-white/70 text-[#6A7D86] hover:bg-white'}`}>{browsers[key].label}</button>
              ))}
            </div>
          </motion.div>
          <NestedRecoveryVisual activeBrowser={activeBrowser} onBrowserChange={setActiveBrowser} />
        </div>
      </div>
    </section>
  );
}

function MarginStandardDeliverableSection() {
  return (
    <section className="margin-standard-deliverable-section relative overflow-hidden bg-white py-12 sm:py-16 lg:min-h-screen lg:py-20" style={{ backgroundColor: "#FFFFFF" }} aria-labelledby="margin-standard-deliverable-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="mx-auto max-w-[820px] text-center">
          <h2 id="margin-standard-deliverable-title" className="mx-auto mt-4 max-w-[760px] font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[60px]" style={{ fontWeight: 400 }}>
            <span className="heading-tone-dark">Give Finance the explanation behind every finding—not just the result.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-[15px] leading-7 text-[#5B6A72] md:text-[17px] md:leading-8">Margin presents each material finding with its originating records, expected financial treatment, observed outcome, supporting evidence, calculation and remaining variance. It distinguishes verified relationships from unresolved or insufficiently supported ones, allowing Finance to inspect how the conclusion was reached.</p>
          <p className="mx-auto mt-4 max-w-[700px] text-[15px] leading-7 text-[#5B6A72] md:text-[17px] md:leading-8">The finding can be challenged, approved or held for further investigation, with the decision and subsequent outcome retained in the financial record.</p>
          <p className="mx-auto mt-4 max-w-[700px] font-lora text-[20px] leading-[1.12] tracking-[-0.03em] text-[#315C70] sm:text-[24px]" style={{ fontWeight: 400 }}></p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="button" className={landingPrimaryCtaClass} aria-label="Inspect the financial basis">Inspect the financial basis <ChevronRight className="h-4 w-4" /></button>
            <button type="button" className={landingPrimaryCtaClass} aria-label="See the recovery operation model">See the recovery operation model <ChevronRight className="h-4 w-4" /></button>
          </div>
        </motion.div>
        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="mx-auto mt-8 w-full max-w-[1040px] sm:mt-10 lg:mt-12">
          <div className="h-[456px] overflow-hidden rounded-[10px] border border-[#D0D5D7] bg-[#E7E9EB] shadow-[0_20px_55px_rgba(37,73,91,0.12)] sm:h-[800px] lg:h-[min(72vh,820px)]">
            <iframe title="Representative Margin Audit deliverable" src="/margin-standard-deliverable" className="h-full w-full border-0 bg-[#E7E9EB]" style={{ backgroundColor: "#E7E9EB" }} loading="lazy" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function AutoSubmitSection() {
  return (
    <section className="auto-submit-section relative overflow-hidden bg-white py-12 sm:py-16 lg:py-20" aria-labelledby="auto-submit-title">
      <div className={containerClass}>
        <div className="grid items-center gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:gap-20">
          <motion.div {...revealProps} className="max-w-[660px]">
            <h2 id="auto-submit-title" className="mt-5 font-lora text-[34px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
              <span className="heading-tone-dark">Stop making your team carry every recovery through to its next step.</span>
            </h2>
            <p className="mt-6 max-w-[620px] text-[15px] leading-7 text-[#3F4C55] md:text-[17px] md:leading-8">
              Once a recovery meets the required evidence and approval conditions, Margin prepares the authorized submission, records the action and manages the case through Amazon&apos;s subsequent responses. It tracks outstanding requirements, identifies exceptions that need review and keeps the financial position connected to the recovery as it progresses.
            </p>
            <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-[#3F4C55] md:text-[17px] md:leading-8">
              Your team establishes the mandate and retains consequential decision authority. Margin carries the authorized operational work and its financial follow-through.
            </p>
            <button type="button" className={`${landingPrimaryCtaClass} mt-6`} aria-label="See controlled execution in action">See controlled execution in action <ChevronRight className="h-4 w-4" /></button>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="w-full shrink-0 lg:w-[360px]">
            <div className="mx-auto h-[330px] w-full max-w-[900px] overflow-hidden rounded-[10px] bg-[#E7E9EB] shadow-[0_20px_55px_rgba(37,73,91,0.12)] sm:h-[430px] lg:h-[min(54vh,560px)]">
              <iframe title="Auto Submit control" src="/auto-submit-preview" className="h-full w-full border-0 bg-[#E7E9EB]" loading="lazy" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FooterNestedRecoveryVisual() {
  const navigate = useNavigate();
  const [activeBrowser, setActiveBrowser] = useState<keyof typeof nestedRecoveryBrowsers>('progress');

  return (
    <section className="relative overflow-hidden bg-white py-10 sm:py-14 md:py-16" aria-label="Connected operational view visual">
      <div className={containerClass}>
        <h2 className="mb-7 text-center font-google-sans text-[22px] font-semibold leading-tight tracking-tight text-[#182026] md:hidden"><span className="heading-tone-dark">Keep the next financial action from getting lost between people.</span></h2>
        <NestedRecoveryVisual activeBrowser={activeBrowser} onBrowserChange={setActiveBrowser} />
        <div className="mx-auto mt-8 w-full max-w-[380px] text-[#182026] md:hidden">
          <p className="font-google-sans text-[20px] font-semibold leading-tight tracking-tight text-[#182026]">Every case, decision, evidence requirement and outstanding action remains connected to the financial event it concerns.</p>
          <p className="mt-3 font-google-sans text-[13px] leading-6 text-[#66737F]">Start with a free financial review. Margin establishes what the available records explain, what remains unresolved and whether further investigation or recovery is justified.</p>
          <p className="mt-3 font-google-sans text-[13px] leading-6 text-[#66737F]">If a material opportunity exists, you decide whether to delegate a defined recovery or establish an ongoing financial control process.</p>
          <div className="mt-5 flex flex-col gap-3">
            <Button type="button" onClick={() => navigate('/context-review')} className="h-10 w-full rounded-[6px] bg-[#635BFF] px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(99,91,255,0.18)] hover:bg-[#5148E5]">Start the Free Recovery Audit</Button>
            <p className="text-[11px] leading-5 text-[#66737F]">See the financial position before committing to paid recovery work.</p>
            <Button type="button" variant="outline" onClick={() => navigate('/sales')} className="h-10 w-full rounded-[6px] border-[#C8D6DF] bg-white px-4 text-[13px] font-semibold text-[#182026] hover:bg-[#F3F6F8]">Discuss Enterprise Control</Button>
          </div>
          <div className="mt-6 space-y-5 border-t border-[#E6EDF1] pt-5">
            <div>
              <p className="text-[13px] font-semibold leading-5 text-[#635BFF]">Pricing</p>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-[#182026]">Understand the engagement.</p>
              <p className="mt-1 text-[11px] leading-5 text-[#66737F]">Engagements are scoped according to the complexity of the financial examination, the evidence and investigation required, the recovery work involved and the level of ongoing financial responsibility Margin is expected to assume.</p>
              <Link to="/pricing" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#635BFF] no-underline transition-colors hover:text-[#5148E5]">How pricing works <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-5 text-[#635BFF]">Get Started</p>
              <p className="mt-1 text-[13px] font-semibold leading-5 text-[#182026]">Find out what your records can establish.</p>
              <p className="mt-1 text-[11px] leading-5 text-[#66737F]">Submit the Amazon records you already have. Margin examines the available evidence, traces the relevant financial activity and identifies what can be established, what remains unresolved and whether additional records or further action are justified.</p>
              <Link to="/audit-start" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#635BFF] no-underline transition-colors hover:text-[#5148E5]">Start a financial review <ChevronRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FullRecoveryLoopSection() {
  const reduceMotion = useReducedMotion();
  const [activeEvent, setActiveEvent] = useState(0);

  const desktopEvents = [
    { number: "01", label: "Amazon activity", x: "5%", y: "17%" },
    { number: "02", label: "Audit", x: "27%", y: "17%" },
    { number: "03", label: "Opportunity detected", x: "49%", y: "17%" },
    { number: "04", label: "Investigation", x: "71%", y: "17%" },
    { number: "05", label: "Evidence assembled", x: "14%", y: "46%" },
    { number: "06", label: "Recovery judgment", x: "34%", y: "46%" },
    { number: "07", label: "Case preparation", x: "54%", y: "46%" },
    { number: "08", label: "Filing", x: "74%", y: "46%" },
    { number: "09", label: "Amazon response", x: "92%", y: "46%" },
    { number: "10", label: "Evidence request", x: "73%", y: "69%", variant: "branch" },
    { number: "11", label: "Rejection", x: "84%", y: "69%", variant: "branch" },
    { number: "12", label: "Approval", x: "95%", y: "69%", variant: "branch" },
    { number: "13", label: "Follow-up / appeal / reassessment", x: "52%", y: "82%", variant: "branch" },
    { number: "14", label: "Outcome", x: "65%", y: "92%" },
    { number: "15", label: "Payout reconciliation", x: "81%", y: "92%" },
    { number: "16", label: "Recovery closed", x: "96%", y: "92%" },
  ] as const;

  useEffect(() => {
    if (reduceMotion) {
      setActiveEvent(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveEvent((current) => (current + 1) % desktopEvents.length);
    }, 1600);

    return () => window.clearInterval(interval);
  }, [reduceMotion, desktopEvents.length]);

  const eventIsActive = (index: number) => (reduceMotion ? index === 0 : activeEvent === index);

  return (
    <section
      aria-labelledby="full-recovery-loop-title"
      className="relative overflow-hidden bg-white py-10 md:py-[52px]"
    >
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[900px]">
          <h2
            id="full-recovery-loop-title"
            className="font-lora text-[30px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[48px]"
            style={{ fontWeight: 400 }}
          >
            <span className="heading-tone-dark">One Amazon event. Follow its financial consequences all the way through.</span>
          </h2>
        </motion.div>

        <motion.div {...revealProps} className="mt-8 md:mt-10">
          <div
            aria-label="A living orchestration of the full recovery loop"
            className="recovery-orchestra-canvas relative hidden overflow-hidden lg:block"
          >
            <svg
              aria-hidden="true"
              className="recovery-orchestra-lines pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 1200 560"
              preserveAspectRatio="none"
            >
              <path d="M45 96 C260 96 520 96 852 96" />
              <path d="M852 96 C1080 120 1065 220 1010 244 C850 300 470 205 168 244" />
              <path d="M168 244 C390 244 650 244 1104 244" />
              <path className="is-broken" d="M1104 244 C1060 300 935 318 876 360" />
              <path className="is-broken" d="M1104 244 C1110 300 1010 330 1008 360" />
              <path className="is-branch" d="M1104 244 C1160 300 1145 338 1140 360" />
              <path className="is-broken" d="M876 360 C790 420 690 432 624 454" />
              <path className="is-broken" d="M1008 360 C900 430 720 438 624 454" />
              <path className="is-branch" d="M1140 360 C1080 430 860 470 780 514" />
              <path d="M624 454 C640 486 710 505 780 514" />
              <path d="M780 514 C850 514 930 514 972 514" />
              <path d="M972 514 C1040 514 1100 514 1152 514" />
            </svg>

            <motion.span
              aria-hidden="true"
              className="recovery-orchestra-signal"
              animate={
                reduceMotion
                  ? { left: "5%", top: "17%", opacity: 0.35 }
                  : {
                      left: ["5%", "27%", "49%", "71%", "14%", "34%", "54%", "74%", "92%", "73%", "84%", "95%", "52%", "65%", "81%", "96%"],
                      top: ["17%", "17%", "17%", "17%", "46%", "46%", "46%", "46%", "46%", "69%", "69%", "69%", "82%", "92%", "92%", "92%"],
                      opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { duration: 25.6, repeat: Infinity, ease: "linear", times: desktopEvents.map((_, index) => index / (desktopEvents.length - 1)) }
              }
            />

            {desktopEvents.map((event, index) => (
              <div
                key={event.number}
                className={`recovery-event-unit ${event.variant === "branch" ? "recovery-event-unit--branch" : ""}`}
                data-active={eventIsActive(index)}
                style={{ left: event.x, top: event.y }}
              >
                <span className="recovery-event-number">{event.number}</span>
                <span className="recovery-event-label">{event.label}</span>
                <span className="recovery-event-check" aria-hidden="true">✓</span>
              </div>
            ))}
          </div>

          <div
            aria-label="The full recovery loop in a vertical orchestration"
            className="recovery-mobile-orchestra relative ml-2 border-l border-[var(--margin-border)] pl-7 lg:hidden"
          >
            <span className={`recovery-mobile-signal ${reduceMotion ? "recovery-mobile-signal--static" : ""}`} aria-hidden="true" />
            {desktopEvents.map((event, index) => (
              <div key={event.number} className={`recovery-mobile-event ${event.variant === "branch" ? "recovery-mobile-event--branch" : ""}`} data-active={eventIsActive(index)}>
                <span className="recovery-mobile-event-line" aria-hidden="true" />
                <div className="recovery-mobile-event-unit">
                  <span className="recovery-event-number">{event.number}</span>
                  <span className="recovery-event-label">{event.label}</span>
                  <span className="recovery-event-check" aria-hidden="true">✓</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...revealProps} className="mt-8 border-t border-[var(--margin-border)] pt-6 md:mt-10 md:pt-7">
          <p className="max-w-[700px] text-[17px] font-semibold leading-8 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[20px] sm:leading-9 md:text-[24px]">
            The original discrepancy, the recovery decision, Amazon's response and the resulting financial entries remain connected.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

const recoveryOutcomeStates = [
  {
    title: "Needs evidence",
    description: "More proof is required.",
    action: "Request the missing support",
    visualLabel: "Evidence request",
    visualValue: "Open case / proof gap",
    visualDetail: "The recovery remains active while the required evidence is assembled.",
  },
  {
    title: "Rejected",
    description: "The reason is recorded and the outcome can be reviewed.",
    action: "Review the rejection",
    visualLabel: "Decision recorded",
    visualValue: "Rejected / reason captured",
    visualDetail: "The original case, evidence, and Amazon response stay together for review.",
  },
  {
    title: "Recovery Outcome",
    description: "Underpaid, partially resolved, and reversed outcomes are different ways a recovery can fall short of the expected result—and each remains visible for follow-up.",
    action: "Compare expected to paid",
    visualLabel: "Recovery variance",
    visualValue: "Expected  /  actual",
    visualDetail: "The gap remains visible instead of being mistaken for a complete recovery.",
  },
  {
    title: "Appealable",
    description: "Where the rules and evidence support another path, the case can move into appeal or further action.",
    action: "Move into appeal",
    visualLabel: "Next path available",
    visualValue: "Appeal / reassess",
    visualDetail: "The case moves forward when the evidence and recovery rules support another action.",
  },
] as const;

function NeedsEvidenceImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img
          src="/emaillist.png"
          alt="Evidence request list"
          className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]"
        />
        <img
          src="/openmail.png"
          alt="Opened evidence request"
          className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]"
        />
      </div>
    </div>
  );
}

function RejectedImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img src="/resubmit.png" alt="Resubmission workspace" className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]" />
        <img src="/rejectedreason.png" alt="Rejected case reason" className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] -rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]" />
      </div>
    </div>
  );
}

function UnderpaidImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img src="/evidenceatt.png" alt="Evidence attached to an underpaid recovery" className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]" />
        <img src="/underpayemail.png" alt="Underpayment recovery email" className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]" />
      </div>
    </div>
  );
}

function AppealableImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img src="/financial.png" alt="Financial recovery record" className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]" />
        <img src="/realappeal.png" alt="Appeal record ready for review" className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]" />
      </div>
    </div>
  );
}

function FinancialClosureImageStack() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_78%_18%,rgba(11,116,222,0.05),transparent_35%),linear-gradient(145deg,#F7FBFC_0%,#FFFFFF_58%,#F2F6F7_100%)] p-4 sm:p-7 md:p-9">
      <div className="relative h-full w-full">
        <img
          src="/approved%20reimbursement.png"
          alt="Approved reimbursement record"
          className="absolute left-0 top-[12%] z-0 h-[76%] w-[76%] rotate-0 rounded-[5px] border border-white/15 object-cover object-left-top shadow-[0_20px_45px_rgba(0,0,0,0.28)] sm:top-[10%] sm:h-[78%] sm:w-[78%]"
        />
        <img
          src="/recoveryclose.png"
          alt="Recovery closeout record"
          className="absolute right-0 top-[4%] z-10 h-[86%] w-[78%] rotate-[0.5deg] rounded-[5px] border border-[#E4E2DC] bg-white object-cover object-left-top shadow-[0_24px_55px_rgba(0,0,0,0.34)] sm:h-[88%] sm:w-[80%]"
        />
      </div>
    </div>
  );
}

function OutcomeWorkspace({ state, index, reduceMotion }: { state: (typeof recoveryOutcomeStates)[number]; index: number; reduceMotion: boolean }) {
  return (
    <motion.div
      key={state.title}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col justify-between p-5 sm:p-7 md:p-9"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[var(--margin-border)] pb-4">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">
          Margin keeps it moving
        </span>
      </div>

      <div className="py-8 sm:py-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">
          {state.visualLabel}
        </p>
        <p className="mt-4 max-w-[520px] font-lora text-[30px] leading-[1.02] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[40px] md:text-[48px]" style={{ fontWeight: 400 }}>
          {state.visualValue}
        </p>
        <p className="mt-5 max-w-[470px] text-[14px] leading-7 text-[var(--margin-text-secondary)] sm:text-[15px]">
          {state.visualDetail}
        </p>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-4 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--margin-text-muted)]">
          <span>Next action</span>
          <span>{state.action}</span>
        </div>
        <div className="space-y-2 border-t border-[var(--margin-border)] pt-4">
          {[0.38, 0.62, 0.46].map((width, lineIndex) => (
            <div key={lineIndex} className="h-2 rounded-full bg-[#EEF1F2]">
              <motion.div
                initial={reduceMotion ? { scaleX: width } : { scaleX: 0 }}
                animate={{ scaleX: width }}
                transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : lineIndex * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="h-full origin-left rounded-full bg-[var(--margin-blue)]/45"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

const recoveryOperationStages = [
  "Find the discrepancy",
  "Trace what happened",
  "Prove what’s owed",
  "Build the recovery",
  "Handle the case",
  "Manage rejections",
  "Pursue appeals",
  "Reconcile the outcome",
];

function ProductReframeSection() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.26 });
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (reduceMotion || !sectionInView) {
      setActiveStage(0);
      return;
    }

    const interval = window.setInterval(() => {
      setActiveStage((current) => (current + 1) % recoveryOperationStages.length);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [reduceMotion, sectionInView]);

  const visibleStages = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const index = (activeStage + offset + recoveryOperationStages.length) % recoveryOperationStages.length;
    return { stage: recoveryOperationStages[index], offset, opacity: [0.1, 0.3, 0.6, 1, 0.6, 0.3, 0.1][offset + 3] };
  });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="product-reframe-title"
      className="relative overflow-hidden bg-white py-10 md:py-14"
    >
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[1040px]">
          <h2
            id="product-reframe-title"
            className="font-lora text-[36px] leading-[0.99] tracking-[-0.05em] text-[var(--margin-text-primary)] sm:text-[48px] md:text-[66px]"
            style={{ fontWeight: 400 }}
          >
            <span className="heading-tone-dark">Margin handles the work</span> <span className="heading-tone-muted">between a financial problem and its resolution.</span>
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:gap-20">
          <motion.div {...revealProps} aria-hidden="true" />

          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }}>
            <div className="relative flex min-h-[330px] items-center justify-start overflow-hidden py-2 sm:min-h-[430px] sm:justify-center sm:py-4 [mask-image:linear-gradient(to_bottom,transparent_0%,black_7%,black_93%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_7%,black_93%,transparent_100%)]">
            <div className="product-reframe-word-stack relative flex w-full max-w-[585px] flex-col items-start justify-center gap-1.5 text-left sm:items-center sm:gap-2.5 sm:text-center">
                {visibleStages.map(({ stage, offset, opacity }) => {
                  const isActive = offset === 0;
                  return (
                    <motion.div
                      key={`${stage}-${offset}`}
                      initial={false}
                      animate={{ opacity, scale: isActive ? 1.02 : 1 }}
                      transition={{ duration: reduceMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
                    className={`product-reframe-stage font-lora text-[32px] leading-[1.05] tracking-[-0.045em] sm:text-[48px] md:text-[60px] ${isActive ? "text-[var(--margin-text-primary)]" : "text-[var(--margin-text-muted)]"}`}
                    style={{ fontWeight: 500 }}
                    >
                      {stage}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function RiskSection() {
  return (
    <section aria-labelledby="amazon-thread-title" className="audit-palette-surface relative overflow-hidden bg-[#F6F8F9] py-7 sm:py-8 md:py-11">
      <div className={containerClass}>
        <div className="grid items-start gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-12">
          <motion.div {...revealProps} className="order-1 border-l border-[#D8DEDA] pl-4 md:pl-5">
          <h2 id="amazon-thread-title" className="max-w-[620px] font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[52px]" style={{ fontWeight: 400 }}><span className="heading-tone-dark">Know whether Amazon's response resolved the issue—or just changed it.</span></h2>
            <p className="mt-6 max-w-[560px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">Margin captures Amazon correspondence and connects each response to the relevant case, original evidence and financial event. It identifies requests for additional information, decisions, changed recovery values and outstanding actions, then updates the investigation to reflect what the response actually establishes.</p>
            <p className="mt-5 max-w-[560px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">The correspondence advances the case. The financial records establish the outcome.</p>
            <p className="mt-5 max-w-[560px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[#48677A] sm:text-[17px] sm:leading-8"></p>
            <Link to="/privacy" className="mt-7 inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#4F46E5] px-5 text-[13px] font-semibold tracking-tight text-white shadow-[0_12px_26px_rgba(79,70,229,0.18)] transition-colors hover:bg-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/35 focus-visible:ring-offset-2">Data Privacy &amp; Security <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.12 }} className="order-2 min-w-0 overflow-hidden">
            <iframe title="Amazon Thread Review page preview" src="/amazon-thread-review" className="block h-[520px] w-full rounded-b-[8px] border-0 bg-[#FBFAF7] sm:h-[600px]" loading="lazy" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function RecoveryOutcomeExplorer() {
  return (
    <section aria-labelledby="recovery-outcome-title" className="audit-palette-surface relative bg-[#F6F8F9] py-10 md:py-12">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <motion.div {...revealProps} className="order-1 lg:order-2 lg:sticky lg:top-28">
            <h2 id="recovery-outcome-title" className="max-w-[820px] font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[52px]" style={{ fontWeight: 400 }}><span className="heading-tone-dark">A rejection should never be the last explanation Finance receives.</span></h2>
            <p className="mt-6 max-w-[760px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">Margin compares a rejection with the original submission, Amazon&apos;s stated reasoning, the supporting evidence and the unresolved financial position. It identifies whether the decision exposes a correctable evidence gap, supports a further submission or appeal, requires monitoring, or indicates that the matter should be closed.</p>
            <p className="mt-5 max-w-[760px] text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[var(--margin-text-primary)] sm:text-[17px] sm:leading-8">A further action is recommended only when the evidence and applicable process justify it.</p>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="order-2 min-w-0 overflow-hidden lg:order-1">
            <FinalDelegationPreview compactMobile expandedMobile src="/appeals-review" title="Appeals Review page preview" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}


function FinancialReconciliationSection() {
  return (
    <section aria-labelledby="financial-reconciliation-title" className="relative overflow-hidden bg-white py-7 sm:py-8 md:py-11">
      <div className={containerClass}>
        <div className="grid items-start gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-center lg:gap-14">
          <motion.div {...revealProps} className="order-1 border-l border-[#D8DEDA] pl-4 md:pl-5">
            <h2 id="financial-reconciliation-title" className="max-w-[560px] font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[50px]" style={{ fontWeight: 400 }}><span className="heading-tone-dark">Make sure the recovery fits the financial records—not just the Amazon case.</span></h2>
            <p className="mt-6 max-w-[580px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">Margin traces an approved recovery into the relevant reimbursement or adjustment records, then checks its treatment in settlement activity and available payout records. Where accounting records have been provided or connected and are within scope, Margin can also examine how the outcome is reflected there.</p>
            <p className="mt-4 max-w-[580px] font-lora text-[20px] leading-[1.1] tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[24px]" style={{ fontWeight: 400 }}>The examination distinguishes what Amazon approved, what was actually recorded, what reached the relevant settlement or payout stage, and what remains unaccounted for.</p>
            <button type="button" className={`${landingPrimaryCtaClass} mt-6`} aria-label="See how Margin verifies the outcome">See how Margin verifies the outcome <ArrowRight className="h-4 w-4" /></button>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="order-2 min-w-0 overflow-hidden">
            <FinalDelegationPreview compactMobile expandedMobile src="/financial-reconciliation" title="Financial closeout page preview" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const enterpriseReviewCards = [
  {
    quote: "We stopped treating reimbursement work as a monthly fire drill. The team can see what is supported, what is waiting, and what needs a decision.",
    name: "Maya Chen",
    role: "VP Finance · Northline Home",
    mark: "N",
    tone: "bg-[#DCEAF0] text-[#31576B]",
  },
  {
    quote: "The useful part is not another dashboard. It is being able to return to a case and understand the evidence, the response, and the next action immediately.",
    name: "Daniel Ortiz",
    role: "Director of Operations · Harbor & Pine",
    mark: "H",
    tone: "bg-[#E9E3F1] text-[#65527A]",
  },
  {
    quote: "Our finance and operations teams now work from the same recovery record. There is less chasing and far less time spent rebuilding the history.",
    name: "Priya Shah",
    role: "Controller · Fieldstone Goods",
    mark: "F",
    tone: "bg-[#E5EFE2] text-[#4E6B4A]",
  },
  {
    quote: "When Amazon asks for more information, we know what was already sent, what is still missing, and who owns the next move.",
    name: "Evan Brooks",
    role: "Head of Marketplace · Alder Supply",
    mark: "A",
    tone: "bg-[#F1E7D9] text-[#806243]",
  },
];

function EnterpriseReviewsSection() {
  const reduceMotion = useReducedMotion();
  const cards = [...enterpriseReviewCards, ...enterpriseReviewCards];

  return (
    <section className="hidden relative overflow-hidden border-y border-[#DCE5E7] bg-[#F4F8F8] py-12 sm:py-14 md:py-16" aria-labelledby="enterprise-reviews-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="mx-auto max-w-[760px] text-center">
          <h2 id="enterprise-reviews-title" className="mt-3 font-lora text-[34px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[44px] md:text-[52px]" style={{ fontWeight: 400 }}><span className="heading-tone-dark">Recovery work</span> <span className="heading-tone-muted">that stays understandable.</span></h2>
          <p className="mt-4 text-[15px] leading-7 text-[var(--margin-text-secondary)] sm:text-[17px] sm:leading-8">A clearer operating record changes how finance, operations, and marketplace teams move through the work.</p>
        </motion.div>
      </div>
      <div className="relative mt-12 overflow-hidden sm:mt-14">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#F4F8F8] to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#F4F8F8] to-transparent sm:w-24" />
        <motion.div
          className="flex w-max gap-4 px-4 sm:gap-5 sm:px-8"
          animate={reduceMotion ? { x: -420 } : { x: [0, -1080] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {cards.map((review, index) => (
            <article key={`${review.name}-${index}`} className="relative flex w-[300px] flex-col overflow-hidden rounded-[12px] bg-white/18 p-5 shadow-[0_18px_40px_rgba(59,84,94,0.08)] backdrop-blur-xl sm:w-[390px] sm:p-6 md:w-[430px]">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[12px] border border-[#D8E3E5]/90 border-b-0 bg-gradient-to-b from-white/45 via-white/18 to-transparent" />
              <p className="relative z-10 min-h-[122px] text-[14px] leading-6 text-[#4D5B66] sm:text-[15px] sm:leading-7">“{review.quote}”</p>
              <div className="relative z-10 mt-6 flex items-center gap-3 border-t border-[#E5ECEC]/60 pt-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-lora text-[17px] ${review.tone}`}>{review.mark}</span>
                <div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[#26343B]">{review.name}</p><p className="truncate text-[11px] text-[#748188]">{review.role}</p></div>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}


function TypewriterText({ text, speed = 3, delay = 0, onComplete }: { text: string; speed?: number; delay?: number; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : '');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(text);
      return;
    }
    setVisibleText('');
    let index = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));
        if (index >= text.length) {
          if (interval) window.clearInterval(interval);
          onCompleteRef.current?.();
        }
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [delay, reduceMotion, speed, text]);
  return <span>{visibleText}{!reduceMotion && visibleText.length < text.length ? <span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /> : null}</span>;
}

const reconstructionProofSteps = [
  ['Settlement and fee records', 'Relevant settlement periods, fee events, reimbursements, reversals, offsets, and Amazon-recognized amounts within the defined scope.'],
  ['Fulfillment and inventory events', 'Shipment, receiving, inventory, return, removal, and fulfillment records tied to the affected financial events.'],
  ['Entity and marketplace context', 'Account, legal entity, marketplace, currency, reporting period, SKU, order, and shipment identifiers required to establish entitlement.'],
  ['Financial reconciliation records', 'Expected entitlement, Amazon response, payout activity, ledger treatment, and remaining variance required to establish the final position.'],
] as const;

const reconstructionFindingSteps = [
  ['Material exposure under review', '$184,220 indicated exposure · $96,480 currently supported'],
  ['Found on', 'Jan 21, 2026, 04:37 PM'],
  ['Amazon source / activity', 'Amazon settlement and financial records · Scope connected'],
  ['What Margin found', 'Margin isolated a material exposure across settlement, fulfillment, and finance records. · $184,220 indicated · $96,480 supported'],
  ['Financial position', 'Margin reconciled the marketplace activity, operating records, settlement position, and financial context to establish the supported exposure and remaining variance.'],
  ['Why unresolved', 'The evidence position is established; the remaining action is subject to the defined finance approval gate.'],
  ['Evidence used', 'US · CA · UK · DE · 3 entities · 8 reporting periods · Settlement and finance records connected'],
] as const;

function ReconstructionStep({ label, text, index, status, tone = 'default', onComplete }: { label: string; text: string; index: number; status: 'done' | 'active' | 'pending'; tone?: 'default' | 'accent'; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const isVisible = reduceMotion || status !== 'pending';
  const isActive = reduceMotion || status === 'active';
  return (
    <motion.div
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 8 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-3 py-2.5"
      aria-hidden={!isVisible}
    >
      <div className="relative flex w-3 shrink-0 justify-center">
        <motion.span
          initial={false}
          animate={{ scale: isVisible ? 1 : 0, opacity: isVisible ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          className={cn('relative z-10 mt-1.5 h-[5px] w-[5px] rounded-full ring-2 ring-white', tone === 'accent' ? 'bg-[#0B74DE]' : 'bg-[#6A8795]')}
          aria-hidden="true"
        />
        {index > 0 ? <span className={cn('absolute bottom-1/2 left-1/2 w-px -translate-x-1/2 bg-[#C9D6DE]', status === 'pending' ? 'h-0' : 'h-1/2')} aria-hidden="true" /> : null}
        {index < 20 ? <span className={cn('absolute left-1/2 top-3 h-[calc(100%+6px)] w-px -translate-x-1/2 bg-[#C9D6DE]', status === 'done' ? 'opacity-100' : 'opacity-0')} aria-hidden="true" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">{label}</p>
        <p className={cn('mt-1 text-[11px] leading-5', tone === 'accent' ? 'font-semibold text-[#0B74DE]' : 'text-[#4D5B66]')}>
          {isActive ? <TypewriterText text={text} speed={3} delay={70} onComplete={onComplete} /> : text}
        </p>
      </div>
    </motion.div>
  );
}

function DiscrepancyModalVisual({ compactMobile = false }: { compactMobile?: boolean }) {
  const [mode, setMode] = useState<'finding' | 'proof'>('proof');
  const isProof = mode === 'proof';
  const reduceMotion = useReducedMotion();
  const steps = isProof ? reconstructionProofSteps : reconstructionFindingSteps;
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    setActiveStep(0);
  }, [isProof]);
  const advanceStep = () => {
    if (reduceMotion) return;
    window.setTimeout(() => setActiveStep((current) => current + 1 >= steps.length ? 0 : current + 1), 420);
  };
  const headingText = isProof ? 'Evidence Margin will Assemble' : 'Cross-marketplace recovery exposure';
  const headingSubtext = isProof
    ? 'Margin will test the connected operating record across the defined marketplace and entity scope before requesting any additional evidence.'
    : 'A material recovery exposure has been isolated across settlement, fulfillment, and finance records. · $184,220 indicated exposure · $96,480 currently supported';

  return (
    <div className={`recognition-artifacts-visual relative ${compactMobile ? 'max-h-[80vh] overflow-y-auto overscroll-contain touch-pan-y sm:max-h-none sm:overflow-visible' : 'overflow-hidden'}`}>
      <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.16)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#E9E9EC] px-4 pb-2.5 pt-3">
          <div>
            <p className="text-[10px] text-[#8A99A5]">{isProof ? 'Proof required' : 'Finding detail'}</p>
            <h3 className={`mt-1 font-normal leading-tight tracking-tight ${isProof ? 'whitespace-nowrap text-[18px] sm:text-[20px]' : 'text-[20px]'}`}>{headingText}</h3>
            <p className="mt-1 max-w-[610px] text-[10px] leading-4 tracking-tight text-[#6B7280]"><TypewriterText key={headingSubtext} text={headingSubtext} speed={3} /></p>
          </div>
          <button type="button" aria-label="Close preview" className="text-[18px] leading-none text-[#9CA3AF]">×</button>
        </div>
        <div className="flex border-b border-[#E9E9EC] bg-[#FAFAFB] px-4 py-2">
          <button type="button" onClick={() => setMode('finding')} className={`mr-4 border-b-2 pb-1 text-[11px] font-medium tracking-tight ${!isProof ? 'border-[#0B74DE] text-[#0B74DE]' : 'border-transparent text-[#66737F]'}`}>View finding</button>
          <button type="button" onClick={() => setMode('proof')} className={`border-b-2 pb-1 text-[11px] font-medium tracking-tight ${isProof ? 'border-[#0B74DE] text-[#0B74DE]' : 'border-transparent text-[#66737F]'}`}>Proof needed</button>
        </div>
        <div className="border-b border-[#E9E9EC] bg-white px-4 py-2"><p className="text-[10px] leading-4 tracking-tight text-[#66737F]">Review basis: <strong className="font-semibold text-[#182026]">Cross-marketplace entitlement and settlement reconciliation</strong> · Scope: <strong className="font-semibold text-[#182026]">US · CA · UK · DE · 3 entities · 8 reporting periods</strong></p></div>
        {isProof ? (
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-[#E9E9EC] px-4 py-3 lg:border-b-0 lg:border-r">
              <div className="mb-3"><p className="mb-2 max-w-[560px] text-[10px] leading-4 tracking-tight text-[#98A5AE]">Settlement and entitlement review · 4 marketplaces · 3 entities · 8 reporting periods · REC-2026-0147 · Cross-marketplace recovery exposure</p><div className="flex gap-2"><span className="rounded-[10px] border-0 bg-[#EEF1F2] px-2 py-1 text-[10px] text-[#182026]">Cross-marketplace exposure</span><span className="rounded-[10px] border-0 bg-[#EEF1F2] px-2 py-1 text-[10px] font-medium text-[#182026]">Evidence under review</span></div></div>
              <p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Required documentation</p>
              <div className="mt-2 border-y border-[#E9E9EC] py-1">{reconstructionProofSteps.map(([label, text], index) => <ReconstructionStep key={label} label={label} text={text} index={index} status={reduceMotion ? 'done' : index < activeStep ? 'done' : index === activeStep ? 'active' : 'pending'} onComplete={index === activeStep ? advanceStep : undefined} />)}</div>
              <div className="mt-3 border-t border-[#E9E9EC] pt-3"><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">What Margin already found</p><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]"><TypewriterText text="Margin connected the exposure across US, CA, UK, and DE marketplace activity, three operating entities, settlement periods, fulfillment records, and finance data." /></p></div>
            </div>
            <div className="px-4 py-3"><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Evidence context</p><p className="mt-2 text-[11px] leading-5 text-[#4D5B66]"><TypewriterText text="The evidence record preserves source lineage, operating scope, policy basis, and financial responsibility across the recovery position." /></p></div>
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-[#E9E9EC] px-4 py-3 lg:border-b-0 lg:border-r">
              <div className="relative py-1">{reconstructionFindingSteps.map(([label, text], index) => <ReconstructionStep key={label} label={label} text={text} index={index} status={reduceMotion ? 'done' : index < activeStep ? 'done' : index === activeStep ? 'active' : 'pending'} onComplete={index === activeStep ? advanceStep : undefined} tone={index === 0 ? 'accent' : 'default'} />)}</div>
            </div>
            <div className="px-4 py-3"><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Evidence context</p><p className="mt-2 text-[11px] leading-5 text-[#4D5B66]"><TypewriterText text="The connected operating record establishes a supported exposure position and identifies the remaining variance for controlled review." /></p></div>
          </div>
        )}
      </div>
    </div>
  );
}

function FounderNoteSection() {
  return (
    <section
      className="relative overflow-hidden bg-[#EAF1F5] py-14 sm:py-16 md:py-20"
      aria-labelledby="founder-note-title"
    >
      <div className={containerClass}>
        <motion.div
          {...revealProps}
          className="relative overflow-hidden rounded-[4px] border border-[#8B6DFF]/45 bg-[#3120A9] bg-cover bg-center px-5 py-6 text-white shadow-[0_24px_70px_rgba(49,32,169,0.24)] sm:px-10 sm:py-10 md:px-16 md:py-14"
          style={{ backgroundImage: "url('/founder-note-indigo-strips-a.png')" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_22%_48%,rgba(13,8,78,0.24),transparent_54%),radial-gradient(ellipse_at_76%_52%,rgba(13,8,78,0.12),transparent_62%)]" aria-hidden="true" />
          <div className="relative grid gap-6 drop-shadow-[0_2px_10px_rgba(13,8,78,0.34)] sm:gap-8 md:grid-cols-[minmax(180px,0.38fr)_minmax(0,1fr)] md:gap-14">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-white/75">A note from the founder</p>
              <h2 id="founder-note-title" className="mt-3 max-w-[260px] font-lora text-[30px] font-normal leading-[1.02] tracking-[-0.045em] text-white sm:mt-4 sm:text-[36px] sm:leading-[1.08]">
                At scale, nobody should have to guess where the money went.
              </h2>
            </div>
            <div className="max-w-[720px] text-[15px] leading-6 text-white/88 sm:text-[16px] sm:leading-8">
              <p>High transaction volumes create relationships that are difficult to reconstruct manually across reporting periods, operational records and financial systems. Margin is built to trace those relationships, preserve the evidence behind material findings and carry justified recovery work through to its recorded financial outcome.</p>
              <p className="mt-4 sm:mt-5">The objective is to give Finance an explainable position and a traceable investigation without requiring the team to reconstruct every event from the beginning.</p>
              <p className="mt-4 font-lora text-[21px] leading-6 tracking-[-0.025em] text-white sm:mt-5 sm:text-[24px] sm:leading-8">The objective is simple: give Finance a defensible position without making the team rebuild every investigation itself.</p>
              <button type="button" className={`${landingSecondaryCtaClass} mt-6`} aria-label="Speak with the founder">Speak with the founder <ChevronRight className="h-4 w-4" /></button>
              <p className="mt-6 border-t border-white/30 pt-3 text-[12px] font-semibold tracking-tight text-white/75 sm:mt-7 sm:pt-4">— Founder &amp; CEO<br /><span className="mt-1 inline-flex items-center gap-1.5 !text-white"><img src="/logoimagetwo.png" alt="Margin" className="h-4 w-auto object-contain brightness-0 invert sm:h-5" /><span className="brand-wordmark font-merriweather text-base tracking-tight !text-white sm:text-lg">Margin</span></span></p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SecuritySection() {
  const cards = [
    {
      title: "Access the Amazon records needed for the work.",
      body: "Margin can examine seller-provided Amazon reports first. Where those records do not establish the required financial position, Margin can request separately authorized, read-only Selling Partner API access to obtain the additional Amazon data justified by the investigation.",
      visual: (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#DCE2E5] bg-[#F4F6F6]">
          <img src="/amazon-logo-transparent-circle.png" alt="Amazon" className="h-9 w-9 object-contain" />
        </div>
      ),
    },
    {
      title: "Keep automated analysis inside a controlled process.",
      body: "Margin combines purpose-built financial workflows and quantitative controls with AI-assisted analysis and explanation. The analysis operates within the investigation and evidence process; material findings and consequential actions remain subject to the applicable validation and approval controls.",
      visual: (
        <div className="flex items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#DCE2E5] bg-[#F4F6F6] p-4"><img src="/ai-logos/chatgpt.svg" alt="OpenAI" className="h-full w-full object-contain" /></div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#DCE2E5] bg-[#F4F6F6] p-4"><img src="/ai-logos/claude.svg" alt="Anthropic Claude" className="h-full w-full object-contain" /></div>
        </div>
      ),
    },
    {
      title: "Control what Margin can access and what it can change.",
      body: "Margin is designed around seller-authorized access, tenant-level data separation, traceable evidence and controlled action permissions. Read access and permission to submit recovery actions are distinct: providing records does not automatically authorize a claim or other consequential action.",
      visual: (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#DCE2E5] bg-[#F4F6F6] text-[#30343B]">
          <ShieldCheck className="h-8 w-8" strokeWidth={1.5} aria-hidden="true" />
        </div>
      ),
    },
  ];

  return (
    <section className="relative overflow-hidden border-y border-[#E1E5E5] bg-[#F4F5F4] py-12 sm:py-16 md:py-20" aria-labelledby="security-section-title">
      <div className={containerClass}>
        <motion.div {...revealProps} className="max-w-[760px]">
          <h2 id="security-section-title" className="font-lora text-[34px] leading-[1.03] tracking-[-0.045em] text-[#30343B] sm:text-[46px] md:text-[56px]" style={{ fontWeight: 400 }}>Give Margin access to the records it needs. Keep control of everything else.</h2>
          <p className="mt-5 max-w-[700px] text-[15px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin is designed around permissioned data access, seller-controlled authorization, evidence traceability and approval before consequential recovery actions. The records used, access granted and actions authorized remain bounded by the agreed engagement and applicable permissions.</p>
        </motion.div>
        <div className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4 lg:mt-14">
          {cards.map((card, index) => (
            <motion.article key={card.title} {...revealProps} transition={{ ...revealProps.transition, delay: index * 0.08 }} className="flex min-h-[310px] flex-col bg-white p-6 shadow-[0_1px_2px_rgba(48,52,59,0.04)] sm:p-7 md:p-8">
              <div className="flex min-h-16 items-center">{card.visual}</div>
              <div className="mt-auto pt-12">
                <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{card.title}</h3>
                <p className="mt-3 text-[14px] leading-6 text-[#667177]">{card.body}</p>
              </div>
            </motion.article>
          ))}
        </div>
        <Link to="/security" className="mt-7 inline-flex items-center gap-2 text-[13px] font-semibold text-[#30343B] underline decoration-[#AEB8BC] underline-offset-4 transition-colors hover:text-[#635BFF] hover:decoration-[#635BFF]">More about security <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

function ConsumerRecoverySection({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-12 sm:py-10 md:py-12" aria-labelledby="consumer-recovery-title">
      <div className={containerClass}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:gap-14">
          <motion.div {...revealProps} role="link" tabIndex={0} onClick={onCta} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onCta(); }} className="group relative flex min-h-[360px] cursor-pointer items-center justify-center overflow-hidden rounded-[4px] p-8 shadow-[0_24px_60px_rgba(72,103,122,0.14)] outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--margin-blue)] sm:min-h-[420px] sm:p-10" style={{ background: 'radial-gradient(ellipse at 18% 18%, rgba(184, 247, 250, 0.72) 0%, transparent 42%), radial-gradient(ellipse at 82% 82%, rgba(82, 64, 244, 0.8) 0%, transparent 52%), linear-gradient(135deg, #8DE8F1 0%, #78BDF2 42%, #5A48F5 100%)' }}>
            <div className="absolute inset-0 bg-white/5" />
              {/* Noise texture overlay */}
              <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.6%22/%3E%3C/svg%3E")', backgroundSize: '120px 120px' }} />
            <div className="relative z-10 flex flex-col items-center text-center text-white">
              <img src="/logoimagetwo.png" alt="Margin" className="h-16 w-auto object-contain brightness-0 invert sm:h-20" />
              <p className="mt-4 font-lora text-[24px] leading-tight tracking-[-0.04em] sm:text-[30px]">Consumer Recovery</p>
            </div>
            <p className="absolute bottom-6 left-6 right-6 z-10 mx-auto max-w-[420px] text-center text-[11px] leading-5 text-white/75 sm:bottom-8 sm:text-[12px]">For the initial Early Access program, Margin focuses on high-value Amazon consumer claims where the potential recovery justifies a managed investigation. Each claim is assessed against the available evidence and applicable recovery route before action is taken.</p>
            <span className="absolute bottom-3 right-5 z-10 text-[11px] font-semibold text-white/90 transition-colors group-hover:text-white sm:bottom-5 sm:right-7">Read more <ArrowRight className="ml-1 inline h-3 w-3" /></span>
          </motion.div>
          <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="max-w-[620px]">
            <h2 id="consumer-recovery-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[50px]" style={{ fontWeight: 400 }}>
              <span className="heading-tone-dark">When a company owes you money, you shouldn't have to chase it alone.</span>
            </h2>
            <p className="mt-4 max-w-[580px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">Margin investigates qualifying high-value consumer claims, examines the supporting purchase and transaction records, assembles the evidence and manages the authorized recovery process. It tracks the claim&apos;s progress and subsequent response, keeping the consumer informed of what has been established, what is outstanding and what happens next.</p>
            <p className="mt-4 text-[15px] font-medium leading-7 text-[var(--margin-text-primary)] sm:text-[17px]">Starting with high-value Amazon consumer claims.</p>
            <Button type="button" onClick={onCta} className={`${landingPrimaryCtaClass} mt-6`}>Join Early Access <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <p className="mt-3 text-[11px] leading-5 text-[var(--margin-text-muted)]">Early access opens late November 2026.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  usePageMeta(PUBLIC_ROUTE_META['/']);
  const navigate = useNavigate();
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const { isFull, nextBatchHours } = useOnboardingCapacity();

  const [isBusy, setIsBusy] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleClaimAccessClick = (location: string) => {
    trackEarlyAccessCtaClicked(location);
    navigate('/audit-start');
  };
  return (
    <div className="landing-google-sans min-h-screen bg-[var(--margin-canvas)] selection:bg-[var(--margin-blue)]/16 selection:text-[var(--margin-text-primary)]">
      <PublicNavbar variant="light" wide />

      <main>
        {/* Recognition — Is this my problem? */}
        <KineticHeroSection onAuditCta={() => { trackEarlyAccessCtaClicked("hero_connect_amazon"); navigate("/review-consent"); }} isFull={isFull} nextBatchHours={nextBatchHours} />

        {/* First proof — show the financial position before the deeper diagnosis. */}
        <DuplicatePipelineDemoSection />

        {/* Problem — Why is the financial position difficult to establish? */}
        <RealityCheckSection />
        <ReconstructionGapSection />

        {/* Financial position — What does the evidence establish? */}
        <AccountingEvidenceSection />
        <IngestedDocumentsOutcomeSection />
        <RecoveryWorkStatement />


        {/* Operating method — How does Margin decide and act? */}
        <MarginEngineSection />
        <MarginLifecycleSection />
        <MarginStandardSection />
        <ControlSection />

        {/* Outcome — How does the position remain controlled through resolution? */}
        <RecoveryThreadSection onAuditCta={() => handleClaimAccessClick("recovery_thread_audit")} />
        <RiskSection />
        <RecoveryOutcomeExplorer />
        <FinancialReconciliationSection />
        <NestedRecoveryBrowsers />

        {/* Accountability — Who explains the current position? */}
        <PersonalRecoverySupportSection />
        <FounderNoteSection />

        {/* Enterprise proof — Can this operate at scale without losing control? */}
        <RecoveryHarnessSection />
        <FinancialWorkProofSection />
        <AutoSubmitSection />
        <MarginStandardDeliverableSection />
        <EnterpriseReviewsSection />
        <EnterpriseOnboardingSection onAuditCta={(location) => { trackEarlyAccessCtaClicked(location); navigate("/sales"); }} />

                {/* Marketplace coverage — compact trust signal before final delegation */}
        <section className="relative bg-[var(--margin-canvas)] py-12 sm:py-16 md:py-20" aria-labelledby="marketplace-scope-title">
          <div className={containerClass}>
            <div className="grid gap-8 border-y border-[var(--margin-border)] py-8 md:grid-cols-[0.72fr_1.28fr] md:gap-12 md:py-10">
              <motion.div {...revealProps} className="max-w-[520px]">
                <h2 id="marketplace-scope-title" className="mt-3 max-w-[520px] font-lora text-[30px] font-normal leading-[1.06] tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[38px] md:text-[44px]">Stop treating each Amazon marketplace as a separate financial picture.</h2>
                <p className="mt-4 max-w-[500px] text-[14px] leading-6 text-[var(--margin-text-secondary)] sm:text-[15px] sm:leading-7">Margin examines available financial and operational records across the supported Amazon marketplaces, applying a consistent investigation and recovery structure to each relevant seller account. It connects marketplace activity to its supporting evidence, outstanding discrepancies and recorded outcomes, giving Finance a consolidated view without obscuring the underlying marketplace, entity or currency.</p>
              </motion.div>
              <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.08 }} className="grid border-t border-[var(--margin-border)] sm:grid-cols-2 sm:border-t-0 lg:grid-cols-3">
                {supportedMarketplaces.map((marketplace, index) => (
                  <div key={marketplace.code} className={cn("flex items-center gap-3 py-3.5 sm:px-4", index > 0 ? "border-t border-[var(--margin-border)] sm:border-t-0" : "", index % 2 === 1 ? "sm:border-l sm:border-[var(--margin-border)]" : "", index >= 2 ? "sm:border-t sm:border-[var(--margin-border)]" : "", index % 3 !== 0 ? "lg:border-l lg:border-[var(--margin-border)]" : "lg:border-l-0", index >= 3 ? "lg:border-t lg:border-[var(--margin-border)]" : "lg:border-t-0")}>
                    <img src={`/flags/${marketplace.flagAsset}.svg`} alt={`${marketplace.country} flag`} className="h-[23px] w-[34px] shrink-0 rounded-[2px] object-cover" />
                    <span className="min-w-0"><span className="block truncate text-[13px] font-semibold tracking-[-0.02em] text-[var(--margin-text-primary)]">{marketplace.country}</span><span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-tight text-[var(--margin-text-muted)]">{marketplace.region} · {marketplace.code}</span></span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
        <SecuritySection />

        {/* Engagement — What should happen next? */}
        <RecoveryOfferSectionDuplicate onAuditCta={handleClaimAccessClick} />
        <RecoveryOfferSection onAuditCta={handleClaimAccessClick} />
        <RecoveryRoutingSection onAuditCta={(location) => { trackEarlyAccessCtaClicked(location); navigate("/audit-start"); }} />
        <ConsumerRecoverySection onCta={() => { trackEarlyAccessCtaClicked("homepage_consumer_recovery"); navigate("/early-access"); }} />

        {/* Section 14 — Trust / FAQ */}
        <section className="trust-faq-section relative bg-white py-10 md:py-14" aria-labelledby="trust-faq-title">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <h2 id="trust-faq-title" className="font-lora text-[34px] font-medium leading-tight tracking-[-0.045em] text-[var(--margin-text-primary)] sm:text-[42px] md:text-[46px]" style={{ fontWeight: 400 }}>
                <span className="heading-tone-dark">Know exactly what you're agreeing to before Margin gets involved.</span>
              </h2>
            </motion.div>
            <div className="mt-10 md:mt-14 max-w-4xl">
              <Accordion
                type="single"
                collapsible
                className="w-full border-t border-[var(--margin-border)]"
              >
                {faqs.slice(0, showAllFaqs ? faqs.length : 3).map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="border-b border-[var(--margin-border)] px-0"
                  >
                    <AccordionTrigger className="faq-trigger py-6 text-left text-[18px] font-semibold tracking-[-0.035em] text-[var(--margin-text-primary)] hover:no-underline md:py-7 md:text-[22px] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[var(--margin-text-muted)]">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="faq-answer pb-7 pr-10 text-[15px] leading-7 text-[#3F4650] md:text-[17px] md:leading-8">
                      <p>{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <Button
                type="button"
                onClick={() => setShowAllFaqs((current) => !current)}
                className={`faq-more-button ${landingPrimaryCtaClass} mt-7`}
              >
                {showAllFaqs ? "Show fewer answers" : "More answers to your questions"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button type="button" className="landing-pressable mt-6 flex h-11 w-fit items-center justify-start gap-2 bg-transparent px-0 text-left text-[13px] font-semibold text-[#635BFF] transition-colors hover:bg-transparent hover:text-[#5148E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]/35 focus-visible:ring-offset-2" aria-label="Talk to Margin about your account">Still have a question about your account? Talk to Margin <ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
          <section className="relative overflow-hidden bg-[var(--margin-canvas)] py-12 sm:py-10 md:py-12" aria-label="Financial control handoff">
            <div className={containerClass}>
              <div className="flex flex-col items-start gap-8 pt-8 sm:pt-10 lg:pt-16">

                <div className="flex w-full flex-col items-start gap-8 lg:flex-row lg:gap-10">

                {/* Left label */}
                <motion.div {...revealProps} className="w-full shrink-0 lg:w-[360px]">
                  <p className="max-w-[360px] text-[15px] leading-7 text-[var(--margin-text-secondary)] sm:text-[17px] sm:leading-8">Start with the free Audit. Margin examines your available Amazon records, establishes what can be explained, identifies unresolved financial differences and determines whether the evidence justifies further action.</p>
                  <p className="mt-4 max-w-[360px] text-[14px] leading-6 text-[var(--margin-text-secondary)]">You decide whether to delegate a defined recovery, establish ongoing financial control or take no further action. You approve submissions and material decisions; Margin carries the authorized investigation, evidence work, follow-through and outcome verification.</p>
                  <p className="mt-4 max-w-[360px] font-lora text-[21px] leading-tight tracking-[-0.03em] text-[var(--margin-text-primary)] sm:text-[24px]" style={{ fontWeight: 400 }}>Know who is responsible for what happens to the financial outcome.</p>

                </motion.div>

                {/* Two cards */}
                <div className="grid w-full flex-1 grid-cols-1 gap-3 md:grid-cols-2">

                  {/* Card 1 — warm aurora */}
                  <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-[4px] p-6 sm:min-h-[420px] sm:p-10" style={{ background: 'radial-gradient(ellipse at 20% 80%, #d4956a 0%, transparent 55%), radial-gradient(ellipse at 70% 20%, #c9a0c4 0%, transparent 50%), radial-gradient(ellipse at 40% 40%, #d4b896 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, #e8c4a0 0%, transparent 45%), linear-gradient(145deg, #cba4b8 0%, #d5b8a0 40%, #c9a888 100%)' }}>
                    <h3 className="text-[22px] font-semibold tracking-tight text-white leading-tight sm:text-[24px]">
                      Find out what your Amazon financial records actually support.
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/80 font-medium">
                      Start with a free Audit. Margin examines the records you provide, traces the relevant financial activity and distinguishes explained transactions from unresolved differences and evidence-supported recovery opportunities.
                    </p>
                    <div className="mt-auto pt-10 sm:pt-16">
                      <Button onClick={() => { trackEarlyAccessCtaClicked("homepage_closing_cta_audit"); navigate("/audit-start"); }} className="landing-pressable h-11 rounded-[4px] bg-white/20 backdrop-blur-sm text-white font-semibold text-[13px] px-5 hover:bg-white/30 flex items-center gap-2 w-fit border border-white/20 shadow-sm">
                        Start the free Audit <ArrowRight className="h-4 w-4 text-white/60" />
                      </Button>
                    </div>
                  </motion.div>

                  {/* Card 2 — cool sage earth */}
                  <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.2 }} className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-[4px] p-6 sm:min-h-[420px] sm:p-10" style={{ background: 'radial-gradient(ellipse at 30% 70%, #4a5e3a 0%, transparent 55%), radial-gradient(ellipse at 75% 25%, #8a9a7e 0%, transparent 50%), radial-gradient(ellipse at 50% 30%, #b0b8a8 0%, transparent 50%), radial-gradient(ellipse at 20% 20%, #c4c8be 0%, transparent 45%), linear-gradient(145deg, #b8bdb0 0%, #8a9680 40%, #5a6e4a 100%)' }}>
                    <h3 className="text-[22px] font-semibold tracking-tight text-white leading-tight sm:text-[24px]">
                      Stop carrying unresolved recovery work from one reporting period to the next.
                    </h3>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/75 font-medium">
                      Margin maintains the investigation and recovery workflow across discrepancies, evidence requirements, submissions, Amazon responses, follow-ups and financial outcome checks. Outstanding items retain their status, ownership and next action instead of having to be reconstructed each reporting period.
                    </p>
                    <div className="mt-auto pt-10 sm:pt-16">
                      <Button onClick={() => { trackEarlyAccessCtaClicked("homepage_closing_cta_handled"); navigate("/contact"); }} className="landing-pressable h-11 rounded-[4px] bg-white/20 backdrop-blur-sm text-white font-semibold text-[13px] px-5 hover:bg-white/30 flex items-center gap-2 w-fit border border-white/20 shadow-sm">
                        Talk to Margin about your account <ArrowRight className="h-4 w-4 text-white/60" />
                      </Button>
                    </div>
                  </motion.div>

                </div>

                </div>

                <div className="w-full">
                  <div className="mt-6 hidden w-full max-w-[380px] p-0 text-[#182026] md:block lg:max-w-none">
                    <div className="lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.25fr)] lg:gap-10">
                      <div>
                        <p className="text-[24px] font-semibold leading-tight tracking-tight text-[#182026]">Every case, decision, evidence requirement and outstanding action remains connected to its underlying financial position. Margin maintains the current status, accountable owner and next required step as work moves through investigation, approval, recovery and reconciliation.</p>
                        <p className="mt-3 text-[14px] leading-6 text-[#66737F]">You do not need to diagnose the problem or connect your Amazon account before starting.</p>
                        <p className="mt-3 text-[14px] leading-6 text-[#66737F]">If a material opportunity exists, you can decide whether to delegate a defined recovery or establish an ongoing control process.</p>
                        <div className="mt-5 space-y-3">
                          <Button type="button" onClick={() => navigate('/context-review')} className="h-10 w-full rounded-[6px] bg-[#635BFF] px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(99,91,255,0.18)] hover:bg-[#5148E5]">Start the Free Recovery Audit</Button>
                          <p className="text-[11px] leading-5 text-[#66737F]">See the financial position before committing to paid recovery work.</p>
                          <Button type="button" variant="outline" onClick={() => navigate('/sales')} className="h-10 w-full rounded-[6px] border-[#C8D6DF] bg-white px-4 text-[13px] font-semibold text-[#182026] hover:bg-[#F3F6F8]">Discuss Enterprise Control</Button>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-5 border-t border-[#E6EDF1] pt-5 lg:mt-0 lg:grid-cols-2 lg:gap-8 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                        <div>
                          <p className="text-[13px] font-semibold leading-5 text-[#635BFF]">Pricing</p>
                          <p className="mt-1 text-[13px] font-semibold leading-5 text-[#182026]">Understand the engagement.</p>
                          <p className="mt-1 text-[11px] leading-5 text-[#66737F]">See how Margin engagements are scoped and priced according to the complexity of the examination and the financial responsibility involved.</p>
                          <Link to="/pricing" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#635BFF] no-underline transition-colors hover:text-[#5148E5]">How pricing works <ChevronRight className="h-3.5 w-3.5" /></Link>
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold leading-5 text-[#635BFF]">Get Started</p>
                          <p className="mt-1 text-[13px] font-semibold leading-5 text-[#182026]">Find out what your records can establish.</p>
                          <p className="mt-1 text-[11px] leading-5 text-[#66737F]">Submit your available Amazon records. Margin examines the evidence, establishes what can be accounted for, and identifies where further action may be justified.</p>
                          <Link to="/audit-start" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#635BFF] no-underline transition-colors hover:text-[#5148E5]">Start a financial review <ChevronRight className="h-3.5 w-3.5" /></Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </section>
      </main>
        <FooterNestedRecoveryVisual />

      <DemoVideoModal
        open={isDemoOpen}
        onOpenChange={setIsDemoOpen}
        videoUrl={DEMO_VIDEO_URL}
        title="Margin recovery walkthrough"
        description="Watch how Margin keeps Amazon reimbursement proof tied together after discrepancies are identified, from deadline review and evidence matching to rejection handling and payout reconciliation."
        analyticsLocation="homepage_demo_section"
        videoName="margin_demo"
      />
      <BrandFooter wide />
      <CookieConsent />
    </div>
  );
}
