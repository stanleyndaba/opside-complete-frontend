import { Check } from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

type Source = {
  name: string;
  context: string;
  icon?: string;
  glyph?: string;
  checked?: boolean;
};

const sources: Source[] = [
  { name: 'QuickBooks Enterprise', context: 'cost basis', icon: '/quickbooks.png' },
  { name: 'Gmail', context: 'source correspondence', icon: '/gmailicon.png', checked: true },
  { name: 'Dropbox', context: 'document repository', icon: '/Dropbox_Icon.svg.png', checked: true },
  { name: 'Outlook', context: 'source correspondence', icon: '/outlookicon.webp', checked: true },
  { name: 'Amazon SP-API', context: 'orders + settlements', icon: '/amazon-logo-transparent-circle.png' },
  { name: 'SAP S/4HANA', context: 'inventory ledger', icon: '/integration-icons/sap-s4hana.png' },
  { name: 'Oracle NetSuite', context: 'GL + clearing', icon: '/integration-icons/netsuite.png' },
  { name: '3PL EDI', context: 'receiving events', glyph: 'EDI' },
  { name: 'Carrier events', context: 'movement evidence', glyph: '↗' },
  { name: 'Settlement files', context: 'payout activity', icon: '/gd.png' },
  { name: 'Amazon S3 / SFTP', context: 'controlled files', icon: '/integration-icons/amazons3.jpg' },
  { name: 'Xero', context: 'accounting records', icon: '/xero.png' },
];

const documents = [
  { type: 'PDF', icon: '/pdf-file-icon.webp', title: 'Amazon FBA settlement report · Apr 2026', meta: 'Gmail attachment · reimbursement settlement period 2026-04', status: 'Ingested' },
  { type: 'PDF', icon: '/pdf-file-icon.webp', title: 'FBA inbound receiving variance record', meta: 'Dropbox file · ONT8 · 60 dispatched / 46 received', status: 'Ingested' },
  { type: 'GMAIL', icon: '/gmailicon.png', title: 'Amazon FBA reimbursement correspondence', meta: 'Outlook thread · case response and evidence request', status: 'Ingested' },
  { type: 'PDF', icon: '/pdf-file-icon.webp', title: 'FBA carrier delivery and receiving record', meta: 'Dropbox file · shipment-linked source document', status: 'Ingested' },
  { type: 'CSV', icon: '/evidence-csv-mark.png', title: 'FBA inventory movement extract', meta: 'Gmail attachment · SKU and unit-level activity', status: 'Needs mapping', review: true },
];

function SourceIcon({ source }: { source: Source }) {
  if (source.icon) return <img src={source.icon} alt="" className="h-7 w-7 shrink-0 object-contain" />;
  return <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[7px] bg-[#F0F4F6] text-[10px] font-bold text-[#52636E]">{source.glyph}</span>;
}

function SourceRow({ source }: { source: Source }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-1 py-2.5">
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-[5px] ${source.checked ? 'bg-[#176FE5] text-white' : 'bg-[#F1F4F5] text-transparent'}`} aria-label={source.checked ? `Check ${source.name}` : `${source.name} not checked`}>
        {source.checked ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </span>
      <SourceIcon source={source} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-bold text-[#182026]">{source.name}</p>
        <p className="mt-0.5 text-[10px] text-[#8A969D]">{source.context}</p>
      </div>
    </div>
  );
}

function DocumentCard({ document }: { document: (typeof documents)[number] }) {
  return (
    <article className="grid grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 bg-transparent px-1 py-3.5">
      <img src={document.icon} alt={document.type} className="h-10 w-10 object-contain" />
      <div className="min-w-0">
        <p className="truncate text-[14px] font-bold tracking-[-0.01em] text-[#182026]">{document.title}</p>
        <p className="mt-1 truncate text-[11px] text-[#84929A]">{document.meta}</p>
      </div>
      <span className={`whitespace-nowrap rounded-[6px] px-2 py-1 text-[10px] font-bold ${document.review ? 'bg-[#FFF8E7] text-[#8A6719]' : 'bg-[#EDF9F1] text-[#26714A]'}`}>{document.status}</span>
    </article>
  );
}

export default function DocumentIngestion() {
  usePageMeta({
    title: 'Document Ingestion | Margin',
    description: 'Connect the source records Margin needs to establish an evidence-backed financial position.',
    url: `${SITE_META.url}/document-ingestion`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen bg-[#EDF2F4] font-google-sans text-[#182026]">
      <PublicNavbar variant="light" wide />
      <main className="overflow-x-auto bg-[linear-gradient(135deg,#F7FAFB_0%,#EDF3F5_100%)] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        <div className="mx-auto grid min-w-[1040px] grid-cols-[0.82fr_1.18fr] gap-8 rounded-[18px] border border-[#D7E2E7] bg-white/80 p-4 shadow-[0_24px_70px_rgba(36,62,74,0.12)] sm:min-w-[1180px] sm:p-7 lg:min-w-0 lg:max-w-[1420px]">
          <section className="p-0 sm:p-2" aria-labelledby="sources-title">
            <h1 id="sources-title" className="text-[18px] font-semibold leading-[1.08] tracking-[-0.03em]">9+ Sources</h1>
            <p className="mt-3 max-w-[560px] text-[14px] leading-6 text-[#66737F]">Select the records available for ingestion. Margin keeps each source tied to the financial event it supports.</p>
            <div className="mt-6 grid gap-2">
              {sources.map((source) => <SourceRow key={source.name} source={source} />)}
            </div>
          </section>
          <section className="px-0 py-3 sm:px-3 sm:py-7" aria-label="Incoming documents">
            <div className="grid gap-3">
              {documents.map((document) => <DocumentCard key={document.title} document={document} />)}
            </div>
          </section>
        </div>
      </main>
      <BrandFooter wide />
    </div>
  );
}
