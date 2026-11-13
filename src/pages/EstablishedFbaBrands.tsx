import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Check,
  CircleDollarSign,
  FileCheck2,
  Link2,
  PackageSearch,
  ReceiptText,
  SearchCheck,
  ShieldCheck,
  Truck,
  WalletCards,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const controlAreas = [
  {
    title: 'Trace financial events',
    body: 'Understand where an outcome originated and which subsequent transactions relate to it.',
    icon: Link2,
  },
  {
    title: 'Identify discrepancies',
    body: 'Find activity that does not reconcile with the expected financial result.',
    icon: SearchCheck,
  },
  {
    title: 'Establish the evidence',
    body: 'Connect findings to the available records and distinguish what is proven from what remains uncertain.',
    icon: FileCheck2,
  },
  {
    title: 'Understand recovery opportunities',
    body: 'Assess which unresolved discrepancies may still warrant action.',
    icon: CircleDollarSign,
  },
  {
    title: 'Follow through to resolution',
    body: 'Track authorised recovery work and establish whether the resulting financial outcome was accounted for.',
    icon: Check,
  },
];

const operatingSignals = [
  {
    title: 'Inventory and inbound movement',
    body: 'Receiving, shipment and movement records provide the starting point for understanding what entered the operation.',
    icon: Truck,
  },
  {
    title: 'Returns, fees and adjustments',
    body: 'Later events can change the expected outcome, create a variance or leave an earlier discrepancy unresolved.',
    icon: ReceiptText,
  },
  {
    title: 'Reimbursements and settlement',
    body: 'A credit or payout is not the end of the investigation until its value is attributed and accounted for.',
    icon: WalletCards,
  },
];

const controlHighlights = [
  {
    title: 'A connected financial picture',
    body: 'Margin connects shipments, inventory movements, adjustments, reimbursements and settlements around the underlying financial event.',
    icon: Link2,
  },
  {
    title: 'Evidence before action',
    body: 'Available records are tied to the finding so your team can distinguish a supported position from an unresolved question.',
    icon: ShieldCheck,
  },
  {
    title: 'Resolution that can be verified',
    body: 'Authorised recovery work remains connected to the resulting financial outcome, including what was paid, accounted for or left outstanding.',
    icon: Activity,
  },
];

const EstablishedFbaBrands = () => {
  usePageMeta({
    title: 'Established FBA Brands | Margin',
    description: 'Connected financial control for established Amazon FBA brands with recurring shipment volume and meaningful inventory exposure.',
    url: `${SITE_META.url}/established-fba-brands`,
    image: SITE_META.image,
  });

  return (
    <div className="team-page min-h-screen bg-[#F7F8F7] text-[#30343B]">
      <PublicNavbar variant="light" />

      <main>
        <section className="relative overflow-hidden bg-white pb-16 pt-32 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
          <div className="pointer-events-none absolute right-[-12%] top-[-14%] h-[520px] w-[520px] rounded-full bg-[#EDEFF0] blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.75fr)] md:items-end md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="relative max-w-[780px]">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">Established FBA brands</p>
              <h1 className="max-w-[780px] font-lora text-[45px] font-normal leading-[0.99] tracking-tight text-[#30343B] sm:text-[62px] md:text-[78px]">Your Amazon operation has grown. Your financial control needs to keep up.</h1>
              <p className="mt-7 max-w-[690px] text-[13px] leading-[1.5] text-[#667177] sm:text-[17px] sm:leading-8">As your brand moves more inventory through Amazon, every shipment, return, adjustment, fee and reimbursement creates another financial event to account for. At scale, the challenge is no longer simply managing activity. It is understanding how that activity affects your financial position.</p>
              <Link to="/review-consent" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#F05A3C] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#D9472D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">Establish your financial position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>

            <div className="relative overflow-hidden rounded-[4px] border border-[#DEE3E2] bg-[#F4F5F4] p-5 shadow-[0_22px_65px_rgba(48,52,59,0.08)] sm:p-6">
              <div className="flex items-center justify-between border-b border-[#DDE2E1] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#30343B]"><PackageSearch className="h-5 w-5" strokeWidth={1.6} /></div>
                  <div><p className="text-[12px] font-semibold text-[#30343B]">Amazon financial position</p><p className="mt-0.5 text-[10px] text-[#F05A3C]">Connected operating record</p></div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#4D7869]"><span className="h-1.5 w-1.5 rounded-full bg-[#4D7869]" /> In review</span>
              </div>
              <div className="space-y-2.5 pt-4">
                {[
                  ['Shipment and inventory events', 'Source records connected', Truck],
                  ['Reimbursement and adjustment history', 'Expected outcome tested', FileCheck2],
                  ['Settlement treatment', 'Outstanding variance visible', WalletCards],
                ].map(([label, detail, Icon]) => (
                  <div key={label as string} className="flex items-center gap-3 rounded-[3px] bg-white px-3.5 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2F0] text-[#4D7869]"><Icon className="h-4 w-4" strokeWidth={1.7} /></div>
                    <div className="min-w-0"><p className="truncate text-[12px] font-semibold text-[#30343B]">{label as string}</p><p className="mt-0.5 truncate text-[10px] text-[#F05A3C]">{detail as string}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 border-t border-[#DDE2E1] pt-4 text-[10px] leading-4 text-[#F05A3C]"><ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Evidence and financial outcomes remain connected.</div>
            </div>
          </div>
        </section>

        <section id="control" className="scroll-mt-24 border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[700px]">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">More activity. More financial exposure.</p>
              <h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-tight text-[#30343B] sm:text-[48px]">Greater need for control.</h2>
              <p className="mt-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[17px] sm:leading-8">Your Amazon operation generates activity across inventory movements, inbound shipments, returns, fees, reimbursements, adjustments and settlements. Those events do not always tell a complete story when viewed separately.</p>
            </div>
            <div className="mt-10 grid gap-3 sm:mt-14 md:grid-cols-3 md:gap-4">
              {operatingSignals.map(({ title, body, icon: Icon }) => (
                <article key={title} className="flex min-h-[260px] flex-col bg-white p-6 shadow-[0_1px_2px_rgba(48,52,59,0.04)] sm:p-7 md:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE2E5] bg-[#F4F6F6] text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div>
                  <div className="mt-auto pt-12"><h3 className="text-[16px] font-semibold tracking-tight text-[#30343B] sm:text-[17px]">{title}</h3><p className="mt-3 text-[13px] leading-[1.5] text-[#667177] sm:text-[14px] sm:leading-6">{body}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">Know what happened to your inventory and money</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-tight text-[#30343B] sm:text-[48px]">Move from isolated exceptions to a connected financial picture.</h2><p className="mt-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[17px] sm:leading-8">Margin connects the financial history behind an outcome, helping your team identify discrepancies, establish what the records support, track what remains unresolved and determine whether the expected financial outcome has actually been realised.</p></div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {controlHighlights.map(({ title, body, icon: Icon }) => <article key={title} className="bg-[#F4F5F4] p-5 sm:p-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="mt-10 text-[15px] font-semibold leading-5 text-[#30343B]">{title}</h3><p className="mt-3 text-[13px] leading-6 text-[#667177]">{body}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-24">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:gap-14 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[540px]"><p className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">Connected recovery control</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-tight text-[#30343B] sm:text-[48px]">A credit is not the same as a resolved financial event.</h2><p className="mt-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[17px] sm:leading-8">A shipment discrepancy should not become an isolated spreadsheet entry. A reimbursement should not be treated as resolved simply because Amazon issued a credit. A settlement should not be mistaken for proof that every underlying financial event has been accounted for.</p></div>
            <div className="relative overflow-hidden rounded-[4px] border border-[#DEE3E2] bg-white p-5 shadow-[0_16px_45px_rgba(48,52,59,0.06)] sm:p-7">
              <div className="absolute left-10 top-10 bottom-10 w-px bg-[#DDE2E1]" />
              <div className="relative space-y-7">
                {[
                  ['Source activity', 'Shipment, return, adjustment or fee enters the operating record.', Truck],
                  ['Financial position', 'Expected and accounted-for values are compared against the available evidence.', SearchCheck],
                  ['Resolution status', 'Authorised recovery work is tracked through payout and settlement treatment.', Check],
                ].map(([label, body, Icon]) => (
                  <div key={label as string} className="flex gap-4">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#DCE2E5] bg-[#F4F6F6] text-[#30343B]"><Icon className="h-4 w-4" strokeWidth={1.6} /></div>
                    <div className="pt-0.5"><p className="text-[13px] font-semibold text-[#30343B]">{label as string}</p><p className="mt-1 text-[13px] leading-6 text-[#667177]">{body as string}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-14">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">Built for brands with meaningful Amazon exposure</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-tight text-[#30343B] sm:text-[48px]">Your existing systems stay in place. Your financial picture becomes connected.</h2><p className="mt-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[17px] sm:leading-8">Margin is designed for established FBA brands with recurring shipment volumes, material inventory exposure and increasingly complex marketplace operations. Whether your team manages Amazon internally or works alongside external operators, Margin adds a connected layer of investigation, evidence, recovery management and financial control.</p></div>
              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                {[
                  ['Recurring volume', 'Keep recurring shipment and inventory exposure visible as the operation grows.', PackageSearch],
                  ['Material exposure', 'Understand which unresolved positions could affect the financial outcome.', CircleDollarSign],
                  ['Existing operations', 'Add control around your finance and operations systems without replacing them.', WalletCards],
                ].map(([title, body, Icon]) => <article key={title as string} className="bg-[#F4F5F4] p-5 sm:p-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="mt-10 text-[15px] font-semibold leading-5 text-[#30343B]">{title as string}</h3><p className="mt-3 text-[13px] leading-6 text-[#667177]">{body as string}</p></article>)}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><ShieldCheck className="h-6 w-6" strokeWidth={1.5} /></div><h2 className="mt-5 font-lora text-[34px] font-normal leading-[1.04] tracking-tight text-[#30343B] sm:text-[46px]">Know where your Amazon business stands.</h2><p className="mt-4 max-w-[600px] text-[13px] leading-[1.5] text-[#667177] sm:text-[16px] sm:leading-7">You have built an established operation. You should be able to explain what happened to the money moving through it.</p><Link to="/review-consent" className="mt-7 inline-flex items-center gap-2 rounded-[7px] bg-[#F05A3C] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(240,90,60,0.22)] transition-colors hover:bg-[#D9472D]">Establish your financial position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
        </section>
      </main>

      <BrandFooter wide />
    </div>
  );
};

export default EstablishedFbaBrands;
