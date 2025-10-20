import React from 'react';
import { CheckCircle, ArrowRight, Settings, Shield, Receipt, FileText, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

const steps = [
  { id: 1, title: 'Authentication & Connection', icon: Rocket, cta: { to: '/', label: 'Connect Amazon' }, bullets: [
    'OAuth handshake with Seller Central',
    'Dedicated tenant is provisioned',
    'One click, no CSV uploads'
  ]},
  { id: 2, title: 'Continuous Data Sync', icon: Settings, cta: { to: '/app', label: 'See Live Metrics' }, bullets: [
    'Background sync of FBA reports',
    'Normalization into Clario schema',
    'Always‑on radar'
  ]},
  { id: 3, title: 'Claim Detection', icon: Shield, cta: { to: '/recoveries', label: 'View Opportunities' }, bullets: [
    'Amazon rules + Clario intelligence',
    'Finds lost inventory, fee errors, more',
    'Confidence scoring (e.g. 0.93)'
  ]},
  { id: 4, title: 'Evidence Ingestion', icon: Receipt, cta: { to: '/evidence-locker', label: 'Open Evidence Locker' }, bullets: [
    'Connect Gmail, Outlook, Drive, Dropbox',
    'Metadata‑first, secure ingestion',
    'No manual uploads'
  ]},
  { id: 5, title: 'Document Parsing', icon: FileText, cta: { to: '/evidence-locker', label: 'See Parsed Docs' }, bullets: [
    'Regex → OCR → ML fallback pipeline',
    'Extract SKUs, invoice #, costs, dates',
    'Clean searchable metadata'
  ]},
  { id: 6, title: 'Evidence Matching Engine', icon: Shield, cta: { to: '/recoveries', label: 'Auto‑Submit High Confidence' }, bullets: [
    'Rules + ML matching',
    '≥0.85 auto‑submit; 0.5–0.85 prompt; <0.5 park',
    '80% zero clicks, 20% one‑tap'
  ]},
  { id: 7, title: 'Refund Engine', icon: Shield, cta: { to: '/recoveries', label: 'Track Case Status' }, bullets: [
    'Auto‑file via SP‑API',
    'Open → In Progress → Approved/Denied',
    'Resubmit if denied'
  ]},
  { id: 8, title: 'Recoveries Lifecycle', icon: CheckCircle, cta: { to: '/reports', label: 'Confirm Payouts' }, bullets: [
    'Approval → reimbursement scheduled',
    'Confirm funds credited',
    'Auto‑reconcile'
  ]},
];

export default function DemoOverlay() {
  return (
    <div className="fixed bottom-4 right-4 z-[999] hidden md:block">
      <div className="group relative">
        <input type="checkbox" id="demoToggle" className="peer hidden" />
        <label htmlFor="demoToggle" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 text-white font-medium shadow hover:bg-white/15 cursor-pointer">
          Quick Tour
          <ArrowRight className="h-4 w-4" />
        </label>
        <div className="absolute bottom-12 right-0 w-[360px] max-h-[70vh] overflow-y-auto p-3 rounded-lg border bg-[#0B1220]/95 text-gray-200 backdrop-blur-md shadow-xl opacity-0 pointer-events-none translate-y-2 transition-all duration-200 peer-checked:opacity-100 peer-checked:pointer-events-auto peer-checked:translate-y-0">
          <div className="text-sm text-gray-300 mb-2">Clario End‑to‑End Narrative</div>
          <ol className="space-y-3 text-[13px]">
            {steps.map((s) => {
              const Icon = s.icon as any;
              return (
                <li key={s.id} className="p-2 rounded border border-white/10 bg-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold">{s.id}. {s.title}</span>
                  </div>
                  <ul className="list-disc ml-5 text-gray-400">
                    {s.bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                  <div className="mt-2 text-right">
                    <Link to={s.cta.to} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-emerald-500 text-black font-semibold hover:bg-emerald-400">
                      {s.cta.label}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
