'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

interface MatchHighlight {
  id: string;
  label: string;
  description: string;
  triggerLine: number;
}

const MATCH_HIGHLIGHTS: MatchHighlight[] = [
  {
    id: '1',
    label: 'Shipment Record',
    description: 'Shipment FBA17ACME001 shows 60 units shipped from ONT8.',
    triggerLine: 22,
  },
  {
    id: '2',
    label: 'Inbound Gap',
    description: 'Amazon received 46 units, creating a 14-unit shortage.',
    triggerLine: 48,
  },
  {
    id: '3',
    label: 'Case Ready',
    description: 'Inbound discrepancy is aligned to the claim path and ready for filing.',
    triggerLine: 75,
  },
];

type HighlightTone = 'purple' | 'green';

const highlightColors: Record<HighlightTone, string> = {
  purple: 'bg-[#EDE5FF]',
  green: 'bg-[#DDF4E5]',
};

function MetadataHighlight({
  active,
  children,
  tone,
}: {
  active: boolean;
  children: ReactNode;
  tone: HighlightTone;
}) {
  return (
    <span className="relative -mx-0.5 inline-flex overflow-hidden rounded-[2px] px-0.5">
      <motion.span
        initial={false}
        animate={{ scaleX: active ? 1 : 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`absolute inset-0 origin-left ${highlightColors[tone]}`}
      />
      <motion.span
        className="relative z-10"
        animate={active ? { color: '#182026', fontWeight: 600 } : { color: '#8A99A4', fontWeight: 400 }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function DocumentReference({ name, source, icon }: { name: string; source: string; icon: string }) {
  return <span className="mx-1 inline-flex max-w-full translate-y-[0.12em] items-center gap-1.5 rounded-[3px] bg-[#F1F3F4] px-1.5 py-0.5 align-baseline text-[10px] font-semibold leading-4 text-[#3B4650]" title={`${source}: ${name}`}><img src={icon} alt={source} className="h-3.5 w-3.5 shrink-0 object-contain" />{name}</span>;
}

function MatchAnalysisViz() {
  const [activeMatches, setActiveMatches] = useState<Set<string>>(new Set());
  const [buttonReady, setButtonReady] = useState(false);

  useEffect(() => {
    const highlightSequence = [
      ['r-gap', 520], ['r-summary', 940], ['r-found', 1480], ['r-ship-id', 1960],
      ['r-received', 2340], ['r-shipped', 2720], ['r-action', 3160], ['r-ont8', 3540],
      ['r-record', 3920], ['r-sp-api', 4340], ['r-sync', 4760], ['r-candidate', 5140],
      ['r-deadline', 5520], ['r-case-link', 5900],
    ] as const;
    const timeouts = highlightSequence.map(([id, delay]) => window.setTimeout(() => setActiveMatches((previous) => new Set(previous).add(id)), delay));
    const buttonTimeout = window.setTimeout(() => setButtonReady(true), 6350);
    return () => { timeouts.forEach((timeout) => window.clearTimeout(timeout)); window.clearTimeout(buttonTimeout); };
  }, []);
  const isActive = (id: string) => activeMatches.has(id);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 text-[12px] leading-6 text-[#4D5B66] sm:text-[13px]">
        <p>Within the reviewed enterprise account, the inbound population does not reconcile across Amazon receiving, custody, inventory, and settlement records. <MetadataHighlight active={isActive('r-summary')} tone="purple">18,420 dispatched, 17,968 received</MetadataHighlight> leaves a <MetadataHighlight active={isActive('r-gap')} tone="purple">452-unit variance at ONT8</MetadataHighlight> with an indicated exposure of $184,600 requiring financial attribution before closure. <DocumentReference source="Amazon" name="Receiving Event Register" icon="/amazon-logo-transparent-circle.png" /></p>
        <p>This is not an isolated warehouse exception. <MetadataHighlight active={isActive('r-found')} tone="purple">Margin has established a material control position</MetadataHighlight> across the shipment cohort, legal entity, settlement period, and related reimbursement activity, separating supported exposure from credits already accounted for and unresolved positions requiring executive review. <DocumentReference source="Excel" name="Inbound Variance Schedule" icon="/excel-icon-margin.png" /></p>
        <p>The operating position is ready for governed filing once evidence sufficiency, policy-window, materiality, and seller-approval controls are satisfied. <MetadataHighlight active={isActive('r-action')} tone="green">Next action: prepare the controlled recovery case</MetadataHighlight>. <DocumentReference source="Outlook" name="Evidence Request Correspondence" icon="/outlookicon.webp" /></p>
        <p>Margin is reconciling shipment, receipt, inventory, reimbursement, general-ledger, and settlement records so the claim basis remains attributable, non-duplicative, and reviewable by Finance across the account population. <DocumentReference source="Google Drive" name="Settlement Control Workbook" icon="/gd.png" /></p>
      </div>
      <div className="mt-4 pt-3">
        <div className="space-y-2 font-google-sans text-[11px] leading-5 text-[#25313A]">
          <p><span className="font-medium uppercase tracking-tight text-[#66737F]">Shipment population</span> Shipment <MetadataHighlight active={isActive('r-ship-id')} tone="purple">FBA26ONT8-004817</MetadataHighlight> · <MetadataHighlight active={isActive('r-shipped')} tone="purple">18,420 dispatched units</MetadataHighlight> · 1,842 SKUs across the Q1 control population.</p>
          <p><span className="font-medium uppercase tracking-tight text-[#66737F]">Receiving outcome</span> Amazon received <MetadataHighlight active={isActive('r-received')} tone="purple">17,968 units</MetadataHighlight> at <MetadataHighlight active={isActive('r-ont8')} tone="purple">ONT8</MetadataHighlight>; the unsupported balance is <MetadataHighlight active={isActive('r-gap')} tone="purple">452 units / $184,600</MetadataHighlight>.</p>
          <p><span className="font-medium uppercase tracking-tight text-[#66737F]">Control record</span> Record <MetadataHighlight active={isActive('r-record')} tone="purple">EVT-FBA-2026-0001847</MetadataHighlight> · Source <MetadataHighlight active={isActive('r-sp-api')} tone="purple">Amazon SP-API</MetadataHighlight> · Sync <MetadataHighlight active={isActive('r-sync')} tone="purple">NTH-US-Q1-2026-0904</MetadataHighlight> · Legal entity NTH-US-01.</p>
        </div>
        <div className="pt-2 font-google-sans text-[11px] leading-5 text-[#25313A]">
          <p><span className="font-medium uppercase tracking-tight text-[#66737F]">Control scope</span> Amazon US · merchant account NTH-US-01 · settlement period FY2026 Q1 · entity Northstar Commerce LLC · $2.84M approved account exposure under review · <DocumentReference source="Gmail" name="Amazon Case Decision Log" icon="/gmailicon.png" /> <DocumentReference source="OneDrive" name="Ledger and Valuation Workbook" icon="/onedriive.png" /></p>
          <p><span className="font-medium uppercase tracking-tight text-[#66737F]">Case readiness</span> <MetadataHighlight active={isActive('r-candidate')} tone="green">Supported recovery position</MetadataHighlight> · Deadline <MetadataHighlight active={isActive('r-deadline')} tone="green">02 April 2026</MetadataHighlight> · Case link <MetadataHighlight active={isActive('r-case-link')} tone="green">RFD-2026-004817</MetadataHighlight> · seller approval required before submission.</p>
        </div>
        <div className="mt-2 flex flex-col gap-2 pt-3">
          {buttonReady && <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-8 w-full rounded-[4px] bg-black font-google-sans text-[11px] font-medium tracking-tight text-white hover:bg-[#182026]" type="button">Evidence Match Confirmed</motion.button>}
        </div>
      </div>
    </div>
  );
}
type EvidenceMatchContentProps = { embedded?: boolean };

export function EvidenceMatchContent({ embedded = false }: EvidenceMatchContentProps) {
  const [scanProgress, setScanProgress] = useState(0);
  const [documentMatches, setDocumentMatches] = useState<Set<string>>(new Set());
  const activeHighlights = MATCH_HIGHLIGHTS.filter((card) => scanProgress >= card.triggerLine);

  useEffect(() => {
    if (scanProgress >= 100) return;

    const timeout = window.setTimeout(() => {
      setScanProgress((previous) => Math.min(previous + 0.5, 100));
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [scanProgress]);

  useEffect(() => {
    const highlightSequence = [
      ['l-gap', 300],
      ['l-units', 680],
      ['l-ont8', 1120],
      ['l-received', 1580],
      ['l-policy', 2140],
      ['l-order', 2620],
      ['l-shipment', 3080],
      ['l-sku', 3480],
      ['l-shortage', 3860],
      ['l-record', 4320],
      ['l-sp-api', 4740],
      ['l-sync', 5120],
      ['l-case', 5480],
      ['l-deadline', 5840],
      ['l-candidate', 6200],
    ] as const;

    const timeouts = highlightSequence.map(([id, delay]) =>
      window.setTimeout(() => {
        setDocumentMatches((previous) => new Set(previous).add(id));
      }, delay)
    );

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, []);

  const isDocumentMatch = (id: string) => documentMatches.has(id);

  return (
    <main className={`${embedded ? 'w-full bg-white p-0' : 'min-h-screen overflow-x-auto bg-[#FAFAF7] p-4 sm:p-6 lg:overflow-x-hidden lg:p-8'} font-google-sans text-[#182026] selection:bg-[#0B74DE]/16`}>
      <div className={`mx-auto flex ${embedded ? 'min-h-0 w-full' : 'min-h-[calc(100vh-4rem)] min-w-[760px]'} max-w-[1180px] items-center lg:min-w-0`}>
      <section className="grid min-h-[620px] w-full grid-cols-2 gap-0 overflow-hidden rounded-none border-0 bg-white shadow-none">
        <div className="relative flex min-h-0 flex-col overflow-hidden border-0 bg-white lg:border-r lg:border-[#DDE3E8]">
          <div className="z-10 flex items-center justify-between border-0 bg-white px-4 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#66737F]" />
              <span className="font-google-sans text-[10px] font-medium uppercase tracking-tight text-[#66737F]">
                Shipment_FBA17ACME001.pdf
              </span>
            </div>
            <div className="flex gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8EFF3]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8EFF3]" />
              <div className="h-1.5 w-1.5 rounded-full bg-[#E8EFF3]" />
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden p-5 sm:p-6">
            <div className="space-y-3 select-none text-[12.5px] leading-6 text-[#8A99A4]">
              <p>
                Inbound shipment record for the Q1 receiving population shows{' '}
                <MetadataHighlight active={isDocumentMatch('l-units')} tone="purple">18,420 units dispatched</MetadataHighlight>{' '}
                to{' '}
                <MetadataHighlight active={isDocumentMatch('l-ont8')} tone="purple">ONT8</MetadataHighlight>
                . Amazon receiving records show a material difference against the shipment population.{' '}
                <DocumentReference source="Amazon" name="Shipment Receiving Register" icon="/amazon-logo-transparent-circle.png" />
              </p>

              <p>
                <MetadataHighlight active={isDocumentMatch('l-received')} tone="purple">Amazon received 17,968 units</MetadataHighlight>
                , leaving a{' '}
                <MetadataHighlight active={isDocumentMatch('l-gap')} tone="purple">452-unit variance / $184,600 indicated exposure</MetadataHighlight>{' '}
                that must be attributed across the evidence trail and settlement population.{' '}
                <DocumentReference source="Excel" name="Receiving Variance Schedule" icon="/excel-icon-margin.png" />
                <DocumentReference source="PDF" name="Carrier Custody Record" icon="/pdf-file-icon.webp" />
              </p>

              <p>
                Amazon policy and reimbursement basis for{' '}
                <MetadataHighlight active={isDocumentMatch('l-policy')} tone="green">
                  FBA inventory reimbursement review
                </MetadataHighlight>{' '}
                is applied only when affected products, unit movement, custody, settlement, and reimbursement outcomes reconcile.{' '}
                <DocumentReference source="Outlook" name="Policy and Case Correspondence" icon="/outlookicon.webp" />
              </p>

              <p>
                Evidence fields include{' '}
                <MetadataHighlight active={isDocumentMatch('l-shipment')} tone="green">Shipment FBA26ONT8-004817</MetadataHighlight>
                , entity{' '}
                <MetadataHighlight active={isDocumentMatch('l-order')} tone="green">NTH-US-01</MetadataHighlight>
                , portfolio{' '}
                <MetadataHighlight active={isDocumentMatch('l-sku')} tone="green">1,842 active SKUs</MetadataHighlight>
                , and a{' '}
                <MetadataHighlight active={isDocumentMatch('l-shortage')} tone="green">$184,600 supported exposure</MetadataHighlight>.
                <DocumentReference source="Google Drive" name="Shipment Evidence Pack" icon="/gd.png" />
                <DocumentReference source="QuickBooks" name="Entity Ledger Extract" icon="/quickbooks.png" />
              </p>

              <p>
                Backend control record{' '}
                <MetadataHighlight active={isDocumentMatch('l-record')} tone="purple">EVT-FBA-2026-0001847</MetadataHighlight> from{' '}
                <MetadataHighlight active={isDocumentMatch('l-sp-api')} tone="purple">Amazon SP-API</MetadataHighlight> sync{' '}
                <MetadataHighlight active={isDocumentMatch('l-sync')} tone="purple">NTH-US-Q1-2026-0904</MetadataHighlight>. Case{' '}
                <MetadataHighlight active={isDocumentMatch('l-case')} tone="green">RFD-2026-004817</MetadataHighlight> is a{' '}
                <MetadataHighlight active={isDocumentMatch('l-candidate')} tone="green">supported recovery position</MetadataHighlight> before{' '}
                <MetadataHighlight active={isDocumentMatch('l-deadline')} tone="green">seller approval and controlled submission</MetadataHighlight>.{' '}
                <DocumentReference source="Gmail" name="Amazon Reimbursement Thread" icon="/gmailicon.png" />
                <DocumentReference source="OneDrive" name="Settlement Ledger Extract" icon="/onedriive.png" />
                <DocumentReference source="Dropbox" name="Executive Evidence Pack" icon="/Dropbox_Icon.svg.png" />
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden border-0 bg-white">
          <div className="flex items-center justify-between border-0 bg-white px-4 py-3">
            <div>
              <h1
                className="mt-1 font-google-sans text-[16px] font-semibold leading-tight tracking-[-0.035em] text-[#182026]"
              >
                Inbound shipment shortage
              </h1>
            </div>
            <div className="font-google-sans text-[10px] font-medium uppercase tracking-tight text-[#66737F]">
              Ready
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-4">
            <MatchAnalysisViz />
          </div>
        </div>
      </section>
      </div>

      <div className="hidden">
        {activeHighlights.length}
      </div>
    </main>
  );
}

export default function EvidenceMatch() {
  return <EvidenceMatchContent />;
}

const styleTag = typeof document !== 'undefined' ? document.createElement('style') : null;
if (styleTag) {
  styleTag.innerHTML = `
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
  `;
  document.head.appendChild(styleTag);
}
