import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  FileCheck2,
  GitBranch,
  KeyRound,
  Layers3,
  ListChecks,
  LockKeyhole,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Webhook,
} from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const containerClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8';
const labelClass = 'text-[10px] font-medium uppercase tracking-[0.18em] text-sky-100/52';
const headingClass = 'mt-4 max-w-[920px] text-[31px] font-light leading-[1.02] tracking-tight text-white sm:text-[36px] md:text-[62px]';
const bodyClass = 'mt-4 max-w-[760px] text-[15px] leading-7 text-white/62 md:mt-6 md:text-[18px] md:leading-8';

const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const capabilities = [
  {
    icon: RefreshCw,
    label: 'Connect account data',
    detail: 'Start or monitor Amazon data syncs and keep internal systems aligned with the recovery workflow.',
  },
  {
    icon: SearchCheck,
    label: 'Detect opportunities',
    detail: 'Trigger claim checks and list flagged reimbursement opportunities with confidence, value, and supporting context.',
  },
  {
    icon: FileCheck2,
    label: 'Create and manage cases',
    detail: 'Create reimbursement cases programmatically, update case state, and preserve a traceable audit trail.',
  },
  {
    icon: CloudUpload,
    label: 'Upload missing documents',
    detail: 'Attach proof, invoices, shipping records, and exception documents to unblock supportable claims.',
  },
  {
    icon: ListChecks,
    label: 'Track status and recoveries',
    detail: 'Pull filing status, Amazon review state, payout truth, recovered amounts, and blocked reasons.',
  },
  {
    icon: Webhook,
    label: 'Push events outward',
    detail: 'Send operational events into dashboards, workflow tools, partner systems, and finance reporting.',
  },
];

const useCases = [
  {
    label: 'Internal automation',
    detail: 'Let Margin power background checks, evidence requests, queueing, and status updates without manual dashboard work.',
  },
  {
    label: 'Partner integrations',
    detail: 'Give agencies, aggregators, and operations partners a controlled way to plug into recovery intelligence.',
  },
  {
    label: 'Embedded recovery products',
    detail: 'Support white-label or embedded reimbursement workflows while Margin handles claim logic and lifecycle state.',
  },
  {
    label: 'Finance reporting',
    detail: 'Move detected value, filed value, approved value, and paid-back value into the systems operators already trust.',
  },
];

const contractRows = [
  ['POST', '/v1/accounts/{account_id}/syncs', 'Start an Amazon account sync'],
  ['GET', '/v1/opportunities', 'List flagged reimbursement opportunities'],
  ['POST', '/v1/cases', 'Create a reimbursement case'],
  ['POST', '/v1/cases/{case_id}/documents', 'Upload missing evidence'],
  ['GET', '/v1/recoveries/summary', 'Fetch recovered amounts and payout status'],
];

const principles = [
  {
    icon: ShieldCheck,
    label: 'Truth first',
    detail: 'The API should expose what Margin can prove, what is blocked, and what still needs evidence.',
  },
  {
    icon: LockKeyhole,
    label: 'Partner-gated',
    detail: 'Early access stays internal and partner-facing before becoming a broad public developer platform.',
  },
  {
    icon: GitBranch,
    label: 'Workflow native',
    detail: 'Endpoints map to real recovery operations: sync, detect, document, file, review, and recover.',
  },
];

function ApiCodePreview() {
  const lines = [
    'POST /v1/cases',
    '{',
    '  "opportunity_id": "opp_inbound_shortage_7421",',
    '  "claim_type": "inbound_shipment_shortage",',
    '  "action": "prepare_for_filing",',
    '  "evidence_policy": "require_supporting_documents"',
    '}',
    '',
    '202 Accepted',
    '{',
    '  "case_id": "case_8F4H2",',
    '  "status": "needs_proof",',
    '  "blocked_reason": "carrier_invoice_missing",',
    '  "estimated_recovery": { "amount": 1271.82, "currency": "USD" }',
    '}',
  ];

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(7,9,12,0.96)_100%)] shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-400/70" />
          <span className="h-2 w-2 rounded-full bg-yellow-300/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-300/70" />
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/34">Contract Preview</div>
      </div>
      <pre className="overflow-x-auto p-5 text-[12px] leading-6 text-sky-50/72 md:p-6 md:text-[13px]">
        <code>
          {lines.map((line, index) => (
            <span key={`${line}-${index}`} className="block whitespace-pre">
              {line}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

export default function ApiLanding() {
  const navigate = useNavigate();

  usePageMeta({
    title: 'Margin API | Partner Recovery Intelligence Layer',
    description:
      'Margin API is the partner-facing action layer for reimbursement cases, claim checks, evidence uploads, status tracking, and recovery intelligence.',
    url: `${SITE_META.url}/developer-api`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] font-sans text-white selection:bg-sky-400/25 selection:text-white">
      <PublicNavbar />

      <main className="relative">
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(56,189,248,0.055)_0%,transparent_26%,transparent_68%,rgba(148,163,184,0.045)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090909] via-[#050505] to-[#040404]" />

        <section className="relative pt-28 md:pt-40">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.72fr)] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className={labelClass}>Margin API</div>
                <h1 className="mt-5 max-w-[900px] text-[38px] font-light leading-[0.98] tracking-tight text-white sm:text-[46px] md:text-[76px]">
                  The action layer for recovery intelligence.
                </h1>
                <p className="mt-5 max-w-[740px] text-[16px] leading-7 text-white/62 md:mt-7 md:text-[19px] md:leading-8">
                  Margin API is being shaped as the interface behind claims, status, documents, and recovery intelligence. It is not the Amazon API. It is Margin's own partner-facing layer for turning reimbursement work into programmable operations.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {['Private partner layer', 'No public keys yet', 'Built after launch'].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium text-white/62"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex w-full max-w-[440px] flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => navigate('/waitlist?intent=api')}
                    className="inline-flex h-11 items-center justify-between rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 transition-colors hover:bg-sky-300/[0.13] sm:min-w-[184px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                  >
                    Join API Waitlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>

                  <Link
                    to="/sales"
                    className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white transition-colors hover:bg-white/[0.04] sm:min-w-[184px] md:h-12 md:px-6 md:text-sm"
                  >
                    Talk to Sales
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.08 }}
                className="min-w-0"
              >
                <ApiCodePreview />
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative mt-14 border-y border-white/8 bg-white/[0.02] md:mt-20">
          <div className={containerClass}>
            <div className="grid gap-0 md:grid-cols-3">
              {principles.map((item) => (
                <div key={item.label} className="border-b border-white/8 py-6 md:border-b-0 md:border-r md:border-white/8 md:px-6 md:last:border-r-0">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-sky-100/54" />
                    <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/58">{item.label}</div>
                  </div>
                  <p className="mt-3 max-w-[340px] text-[13px] leading-6 text-white/46">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>What It Exposes</div>
              <h2 className={headingClass}>
                The API should expose the same machine that powers the product: detect, document, file, track, and recover.
              </h2>
              <p className={bodyClass}>
                The first version should stay narrow and useful. It should serve internal automation and selected partners before Margin opens a broader public developer platform.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(7,9,12,0.96)_100%)] md:mt-16 md:grid-cols-2 xl:grid-cols-3">
              {capabilities.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.03 }}
                  className="min-h-[190px] bg-[#070707] p-5 md:p-6"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-[6px] border border-white/10 bg-white/[0.035] text-sky-100/70">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-5 text-[18px] font-medium tracking-tight text-white">{item.label}</h3>
                  <p className="mt-3 text-[14px] leading-6 text-white/50">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-[#07090c] py-16 md:bg-transparent md:py-32">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1fr] lg:items-start">
              <motion.div {...revealProps}>
                <div className={labelClass}>Endpoint Shape</div>
                <h2 className={headingClass}>
                  A small, opinionated contract is stronger than a sprawling API surface.
                </h2>
                <p className={bodyClass}>
                  These are preview endpoints for the story and product direction. The backend can ship behind partner access after launch without overpromising broad public availability today.
                </p>
              </motion.div>

              <motion.div {...revealProps} className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(7,9,12,0.96)_100%)]">
                <div className="grid grid-cols-[76px_minmax(0,1fr)] border-b border-white/8 px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-white/34 md:grid-cols-[96px_minmax(0,1fr)_220px]">
                  <span>Method</span>
                  <span>Path</span>
                  <span className="hidden md:block">Purpose</span>
                </div>
                {contractRows.map(([method, path, purpose]) => (
                  <div
                    key={`${method}-${path}`}
                    className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 border-b border-white/8 px-4 py-4 last:border-b-0 md:grid-cols-[96px_minmax(0,1fr)_220px]"
                  >
                    <span className="text-[11px] font-semibold tracking-tight text-sky-100/72">{method}</span>
                    <span className="min-w-0 break-all font-mono text-[12px] text-white/76">{path}</span>
                    <span className="col-span-2 text-[12px] leading-5 text-white/44 md:col-span-1">{purpose}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>Best Use Cases</div>
              <h2 className={headingClass}>
                Useful now for automation. Powerful later for partners, embedded products, and white-label recovery.
              </h2>
            </motion.div>

            <div className="mt-10 border-t border-white/8 md:mt-14">
              {useCases.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-white/8 py-6 md:grid-cols-[260px_minmax(0,1fr)] md:gap-8 md:py-8"
                >
                  <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.16em] text-sky-100/50">
                    <CheckCircle2 className="h-4 w-4" />
                    {item.label}
                  </div>
                  <p className="max-w-[760px] text-[15px] leading-7 text-white/62 md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-16 md:py-36">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="grid gap-8 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(5,7,10,0.98)_100%)] px-6 py-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-10 md:py-12"
            >
              <div>
                <div className={labelClass}>Access</div>
                <h2 className="mt-4 max-w-[720px] text-[28px] font-light leading-[1.05] tracking-tight text-white md:text-[42px]">
                  Start private. Prove the contract. Open the platform when the workflow is ready.
                </h2>
                <p className="mt-4 max-w-[720px] text-[14px] leading-7 text-white/56 md:text-[16px]">
                  Early API access should be for selected operators, agencies, and partners who need claims, evidence, and recovery status in their own systems.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Link
                  to="/waitlist?intent=api"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 transition-colors hover:bg-sky-300/[0.13]"
                >
                  Request API Access
                  <KeyRound className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/about-margin"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white transition-colors hover:bg-white/[0.04]"
                >
                  How Margin Works
                  <Layers3 className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
