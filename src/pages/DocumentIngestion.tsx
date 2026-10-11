import { useMemo, useState } from 'react';
import { Check, FileText, Link2, Paperclip } from 'lucide-react';


type Source = {
  id: string;
  name: string;
  detail: string;
  icon?: string;
  mark?: string;
  defaultChecked?: boolean;
};

type DocumentRecord = {
  type: 'PDF' | 'CSV' | 'GMAIL';
  title: string;
  source: string;
  status: 'Ingested' | 'Needs mapping' | 'Review';
};

const sources: Source[] = [
  { id: 'quickbooks', name: 'QuickBooks Enterprise', detail: 'cost basis', icon: '/quickbooks.png' },
  { id: 'gmail', name: 'Gmail', detail: 'source correspondence', icon: '/gmailicon.png', defaultChecked: true },
  { id: 'dropbox', name: 'Dropbox', detail: 'document repository', icon: '/Dropbox_Icon.svg.png', defaultChecked: true },
  { id: 'outlook', name: 'Outlook', detail: 'source correspondence', icon: '/outlookicon.webp', defaultChecked: true },
  { id: 'netsuite', name: 'Oracle NetSuite', detail: 'GL + clearing', icon: '/integration-icons/netsuite.png', defaultChecked: true },
  { id: 'settlements', name: 'Settlement files', detail: 'payout activity', mark: 'SF' },
  { id: 's3', name: 'Amazon S3 / SFTP', detail: 'controlled files', icon: '/integration-icons/amazons3.jpg' },
  { id: 'amazon', name: 'Amazon SP-API', detail: 'orders + settlements', icon: '/amazon-logo-transparent-circle.png' },
  { id: 'sap', name: 'SAP S/4HANA', detail: 'inventory ledger', icon: '/integration-icons/sap-s4hana.png' },
  { id: 'edi', name: '3PL EDI', detail: 'receiving events', mark: 'EDI' },
  { id: 'carrier', name: 'Carrier events', detail: 'movement evidence', mark: '↗' },
  { id: 'xero', name: 'Xero', detail: 'accounting records', icon: '/xero.png' },
];

const documents: DocumentRecord[] = [
  { type: 'PDF', title: 'Amazon FBA settlement report · Apr 2026', source: 'Gmail attachment · reimbursement settlement period 2026-04', status: 'Ingested' },
  { type: 'PDF', title: 'FBA inbound receiving variance record', source: 'Dropbox file · ONT8 · 60 dispatched / 46 received', status: 'Ingested' },
  { type: 'GMAIL', title: 'Amazon FBA reimbursement correspondence', source: 'Outlook thread · case response and evidence request', status: 'Ingested' },
  { type: 'PDF', title: 'FBA carrier delivery and receiving record', source: 'Dropbox file · shipment-linked source document', status: 'Ingested' },
  { type: 'CSV', title: 'FBA inventory movement extract', source: 'Gmail attachment · SKU and unit-level activity', status: 'Needs mapping' },
  { type: 'PDF', title: 'Oracle NetSuite clearing activity', source: 'NetSuite export · account and settlement matching', status: 'Review' },
  { type: 'PDF', title: 'Amazon payout activity statement', source: 'Settlement file · payout period and disbursement record', status: 'Ingested' },
  { type: 'CSV', title: 'Controlled transaction file', source: 'Amazon S3 / SFTP · reconciliation-ready extract', status: 'Review' },
];

function SourceMark({ source }: { source: Source }) {
  if (source.icon) return <img src={source.icon} alt="" className="h-4 w-4 shrink-0 object-contain opacity-80" />;
  return <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] bg-[#F3F5F6] text-[6px] font-semibold tracking-[-0.02em] text-[#7A8790]">{source.mark}</span>;
}

function DocumentMark({ type }: { type: DocumentRecord['type'] }) {
  if (type === 'GMAIL') return <img src="/gmailicon.png" alt="" className="h-4 w-4 object-contain opacity-80" />;
  if (type === 'CSV') return <span className="flex h-5 w-5 items-center justify-center rounded-[3px] bg-[#F4F6F7] text-[6px] font-semibold text-[#7A8790]">CSV</span>;
  return <img src="/pdf-file-icon.webp" alt="" className="h-5 w-5 object-contain opacity-75" />;
}

export default function DocumentIngestion() {
  const [selected, setSelected] = useState(() => new Set(sources.filter((source) => source.defaultChecked).map((source) => source.id)));
  const selectedCount = useMemo(() => selected.size, [selected]);

  const toggleSource = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="min-h-screen overflow-x-auto bg-[#EEF2F3] text-[#182026]">
      <div className="mx-auto grid min-w-[1180px] max-w-[1180px] grid-cols-[minmax(0,1fr)_minmax(420px,1.15fr)]">
          <section className="px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-20 lg:px-10" aria-labelledby="sources-title">
            <h1 className="max-w-[360px] font-google-sans text-[22px] font-normal leading-[1.08] tracking-[-0.045em]">
              Record sources
            </h1>
            <p className="mt-2 max-w-[380px] text-[11px] leading-5 tracking-tight text-[#66737F]">
              Select the enterprise records available for ingestion. Margin keeps each source tied to the financial event it supports.
            </p>
            <p className="mt-2 max-w-[380px] text-[10px] leading-5 tracking-tight text-[#98A4AC]">
              Connect only the systems and controlled files that can strengthen the operating record.
            </p>
            <div className="mt-8 flex items-center gap-3 text-[11px] tracking-tight text-[#7A8790]">
              <span className="inline-flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5" />{selectedCount} sources selected</span>
              <span className="text-[#C2C9CD]">·</span>
              <span>Read-only by design</span>
            </div>
            <div className="mt-7 divide-y divide-[#EEF1F2] border-y border-[#EEF1F2]">
              {sources.map((source) => {
                const isSelected = selected.has(source.id);
                return (
                  <button key={source.id} type="button" onClick={() => toggleSource(source.id)} className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[#FBFCFC]">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border transition-colors ${isSelected ? 'border-[#2877D8] bg-[#2877D8] text-white' : 'border-[#E7EBED] bg-[#FAFBFB] text-transparent'}`} aria-hidden="true"><Check className="h-3 w-3" strokeWidth={3} /></span>
                    <SourceMark source={source} />
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-semibold tracking-tight text-[#26333A]">{source.name}</span>
                      <span className="mt-0.5 block truncate text-[10px] tracking-tight text-[#8B969D]">{source.detail}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="document-pack-title" className="relative self-start overflow-hidden border-l border-[#E7EBED] bg-white px-5 py-6 sm:px-7 sm:py-8">
            <div className="pointer-events-none absolute -right-3 top-8 select-none font-google-sans text-[62px] font-semibold leading-none tracking-[-0.09em] text-[#F1F3F4] sm:text-[88px]">PACK</div>
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-medium tracking-tight text-[#8A969E]"><Paperclip className="h-3.5 w-3.5" />Document pack</div>
                  <h2 id="document-pack-title" className="mt-3 max-w-[360px] font-google-sans text-[22px] font-normal leading-[1.08] tracking-[-0.045em] text-[#26333A]">Ingested SOP Records</h2>
                  <p className="mt-2 max-w-[380px] text-[11px] leading-5 tracking-tight text-[#89959D]">A compact operating set for evidence, reconciliation, and controlled follow-through.</p>
                </div>
                <FileText className="hidden h-7 w-7 shrink-0 text-[#C6D0D5] sm:block" strokeWidth={1.1} />
              </div>
              <div className="mt-7 divide-y divide-[#EEF1F2] border-y border-[#EEF1F2]">
                {documents.map((document) => (
                  <div key={document.title} className="flex items-center gap-3 py-3.5">
                    <DocumentMark type={document.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold tracking-tight text-[#26333A]">{document.title}</p>
                      <p className="mt-0.5 truncate text-[10px] tracking-tight text-[#8A969E]">{document.source}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-semibold tracking-tight ${document.status === 'Ingested' ? 'bg-[#F0F7F2] text-[#4F8067]' : document.status === 'Review' ? 'bg-[#F5F6F7] text-[#71808A]' : 'bg-[#FBF5E9] text-[#9A762D]'}`}>{document.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
      </div>
    </main>
  );
}
