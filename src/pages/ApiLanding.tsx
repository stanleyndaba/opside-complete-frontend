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
const labelClass = 'text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE]';
const headingClass = 'mt-4 max-w-[920px] text-[34px] font-semibold leading-[1.02] tracking-[-0.055em] text-[#182026] sm:text-[42px] md:text-[64px]';
const bodyClass = 'mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:mt-6 md:text-[18px] md:leading-8';
const codeFontFamily = "'Fira Code', 'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

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
    detail: 'Start Amazon data syncs and keep recovery operations aligned with connected seller activity.',
  },
  {
    icon: SearchCheck,
    label: 'Detect opportunities',
    detail: 'List flagged reimbursement opportunities with claim type, confidence, value, and supporting context.',
  },
  {
    icon: FileCheck2,
    label: 'Create and manage cases',
    detail: 'Create reimbursement cases, update lifecycle state, and preserve the audit trail behind each move.',
  },
  {
    icon: CloudUpload,
    label: 'Upload missing documents',
    detail: 'Attach invoices, shipment records, carrier proof, and exception documents to unblock claims.',
  },
  {
    icon: ListChecks,
    label: 'Track status and recoveries',
    detail: 'Pull filing status, review state, payout truth, recovered amounts, and blocked reasons.',
  },
  {
    icon: Webhook,
    label: 'Push events outward',
    detail: 'Send recovery events into dashboards, workflow tools, partner systems, and finance reporting.',
  },
];

const useCases = [
  {
    label: 'Internal automation',
    detail: 'Power background claim checks, evidence requests, queue movement, and status updates outside the dashboard.',
  },
  {
    label: 'Partner integrations',
    detail: 'Give agencies, aggregators, and operations partners controlled access to recovery workflows.',
  },
  {
    label: 'Embedded recovery products',
    detail: 'Embed reimbursement workflows while Margin handles claim logic, evidence state, and lifecycle tracking.',
  },
  {
    label: 'Finance reporting',
    detail: 'Move detected, filed, approved, and paid-back value into the reporting stack your team already uses.',
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
    detail: 'Every response carries the proof state, blocker, evidence gap, and recovery status Margin can verify.',
  },
  {
    icon: LockKeyhole,
    label: 'Partner-gated',
    detail: 'Access stays private for selected operators and partners while the contract matures around real workflows.',
  },
  {
    icon: GitBranch,
    label: 'Workflow native',
    detail: 'Endpoints map to actual recovery operations: sync, detect, document, file, review, and recover.',
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
    <div className="relative overflow-hidden rounded-[28px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.12)]">
      <div className="flex items-center justify-between border-b border-[#E4EDF1] bg-[#F8FAFC] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#D96B6B]/70" />
          <span className="h-2 w-2 rounded-full bg-[#D9B45C]/70" />
          <span className="h-2 w-2 rounded-full bg-[#2E7D5B]/70" />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66737F]">Margin API Preview</div>
      </div>
      <pre className="overflow-x-auto bg-[#101820] p-5 text-[12px] leading-6 text-[#DCEBFF] md:p-6 md:text-[13px]" style={{ fontFamily: codeFontFamily }}>
        <code style={{ fontFamily: codeFontFamily }}>
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
    title: 'Margin API | Recovery Operations Layer',
    description:
      'Margin API gives selected partners a programmable layer for reimbursement cases, claim checks, evidence uploads, status tracking, and recovery intelligence.',
    url: `${SITE_META.url}/developer-api`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />
      </div>

      <PublicNavbar variant="light" />

      <main className="relative z-10">
        <section className="relative pt-32 md:pt-44">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.72fr)] lg:items-center">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center rounded-full border border-[#DCE8EE] bg-white/78 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE] shadow-[0_14px_40px_rgba(37,49,58,0.06)] backdrop-blur">
                  Margin API
                </div>
                <h1 className="mt-5 max-w-[900px] text-[42px] font-semibold leading-[0.98] tracking-[-0.065em] text-[#182026] sm:text-[52px] md:text-[78px]">
                  Recovery operations, programmable.
                </h1>
                <p className="mt-5 max-w-[740px] text-[16px] leading-7 text-[#4D5B66] md:mt-7 md:text-[19px] md:leading-8">
                  Margin API is the action layer behind cases, evidence, status, and recovered value. It gives selected teams a controlled way to connect account data, create claims, attach proof, and track payout truth from their own systems.
                </p>

                <div className="mt-7 flex flex-wrap gap-2">
                  {['Private access', 'Case lifecycle', 'Evidence aware'].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#DCE8EE] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#66737F]"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex w-full max-w-[460px] flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => navigate('/waitlist?intent=api')}
                    className="inline-flex h-12 items-center justify-center rounded-full bg-[#0B74DE] px-6 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] transition-colors hover:bg-[#0869C9] sm:min-w-[190px]"
                  >
                    Join API Waitlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>

                  <Link
                    to="/contact"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-6 text-[13px] font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC] sm:min-w-[184px]"
                  >
                    Contact Support
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

        <section className="relative mt-14 border-y border-[#D8E3E8] bg-white/50 md:mt-20">
          <div className={containerClass}>
            <div className="grid gap-0 md:grid-cols-3">
              {principles.map((item) => (
                <div key={item.label} className="border-b border-[#D8E3E8] py-6 md:border-b-0 md:border-r md:px-6 md:last:border-r-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#EAF4FF] text-[#0B74DE]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#182026]">{item.label}</div>
                  </div>
                  <p className="mt-3 max-w-[340px] text-[13px] leading-6 text-[#66737F]">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#D8E3E8] py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>What It Does</div>
              <h2 className={headingClass}>
                Create cases, attach proof, and track recovery status from the systems your team already uses.
              </h2>
              <p className={bodyClass}>
                The first release is a focused partner API for real workflows: syncs, opportunities, cases, documents, events, and recovery reporting.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-4 md:mt-16 md:grid-cols-2 xl:grid-cols-3">
              {capabilities.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.03 }}
                  className="min-h-[190px] rounded-[28px] border border-[#CFE0EA] bg-white p-5 shadow-[0_24px_80px_rgba(37,49,58,0.08)] md:p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#CFE0EA] bg-[#F8FAFC] text-[#0B74DE]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-5 text-[18px] font-semibold tracking-[-0.025em] text-[#182026]">{item.label}</h3>
                  <p className="mt-3 text-[14px] leading-6 text-[#66737F]">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#D8E3E8] bg-[#F6F9FC] py-16 md:py-32">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.78fr_1fr] lg:items-start">
              <motion.div {...revealProps}>
                <div className={labelClass}>Preview Contract</div>
                <h2 className={headingClass}>
                  A focused contract for reimbursement work.
                </h2>
                <p className={bodyClass}>
                  These preview endpoints show the shape of the private API: account syncs, flagged opportunities, case creation, document uploads, and recovery summaries.
                </p>
              </motion.div>

              <motion.div {...revealProps} className="overflow-hidden rounded-[28px] border border-[#CFE0EA] bg-white shadow-[0_24px_80px_rgba(37,49,58,0.08)]">
                <div className="grid grid-cols-[76px_minmax(0,1fr)] border-b border-[#E4EDF1] bg-[#F8FAFC] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66737F] md:grid-cols-[96px_minmax(0,1fr)_220px]">
                  <span>Method</span>
                  <span>Path</span>
                  <span className="hidden md:block">Purpose</span>
                </div>
                {contractRows.map(([method, path, purpose]) => (
                  <div
                    key={`${method}-${path}`}
                    className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 border-b border-[#E4EDF1] px-4 py-4 last:border-b-0 md:grid-cols-[96px_minmax(0,1fr)_220px]"
                  >
                    <span className="text-[11px] font-semibold tracking-tight text-[#0B74DE]">{method}</span>
                    <span className="min-w-0 break-all font-mono text-[12px] text-[#25313A]">{path}</span>
                    <span className="col-span-2 text-[12px] leading-5 text-[#66737F] md:col-span-1">{purpose}</span>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#D8E3E8] py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>Where It Fits</div>
              <h2 className={headingClass}>
                Built for automation, partner workflows, embedded recovery products, and finance reporting.
              </h2>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
              {useCases.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-6 md:grid-cols-[260px_minmax(0,1fr)] md:gap-8 md:py-8"
                >
                  <div className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">
                    <CheckCircle2 className="h-4 w-4" />
                    {item.label}
                  </div>
                  <p className="max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#D8E3E8] py-16 md:py-36">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="grid gap-8 overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white px-6 py-8 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-10 md:py-12"
            >
              <div>
                <div className={labelClass}>Access</div>
                <h2 className="mt-4 max-w-[720px] text-[30px] font-semibold leading-[1.05] tracking-[-0.045em] text-[#182026] md:text-[46px]">
                  Request access when your workflow needs recovery data outside the dashboard.
                </h2>
                <p className="mt-4 max-w-[720px] text-[14px] leading-7 text-[#66737F] md:text-[16px]">
                  Early access is for selected operators, agencies, and partners who need claims, evidence, and recovery status in their own systems.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Link
                  to="/waitlist?intent=api"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-[#0B74DE] px-6 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.2)] transition-colors hover:bg-[#0869C9]"
                >
                  Request API Access
                  <KeyRound className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/about-margin"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-6 text-[13px] font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC]"
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
