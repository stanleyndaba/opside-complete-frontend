import React, { useState } from 'react';
import { ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { api } from '@/lib/api';

type SalesForm = {
  name: string;
  email: string;
  company: string;
  role: string;
  gmv: string;
  accounts: string;
  process: string;
  objective: string;
  notes: string;
};

const containerClass = 'mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12';
const labelClass = 'font-google-sans text-[11px] font-semibold uppercase tracking-tight text-[#182026]';
const inputClass = 'h-12 rounded-[7px] border-[#D8E3EA] bg-white font-google-sans text-[14px] text-[#182026] placeholder:text-[#9AA8B2] focus-visible:border-[#0B74DE] focus-visible:ring-[#0B74DE]/10';
const buttonClass = 'h-12 rounded-[7px] bg-[#0B74DE] px-6 font-google-sans text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] transition-all hover:bg-[#095FB8]';

const operatingQuestions = [
  ['Coverage', 'Which accounts, marketplaces, periods, and SKU sets have actually been examined?'],
  ['Evidence', 'What source records prove the operational event and the related financial state?'],
  ['Materiality', 'Which unresolved issues are financially meaningful enough to justify action?'],
  ['Ownership', 'Who owns the next action, the decision, and the final reconciliation?'],
];

const engagementSteps = [
  ['01', 'Scope the operation', 'We establish the accounts, markets, reporting periods, and current recovery workflow that matter first.'],
  ['02', 'Set the evidence boundary', 'We identify the records required to distinguish verified outcomes from estimates, gaps, and assumptions.'],
  ['03', 'Produce the control view', 'You receive a clear view of what is verified, incomplete, financially material, and ready for a decision.'],
  ['04', 'Choose the operating model', 'Your team can own the work, ask Margin to handle a defined route, or continue with recurring control.'],
];

export default function Sales() {
  usePageMeta({
    title: 'Margin Enterprise — Recovery Control for High-GMV Amazon Businesses',
    description: 'Margin helps $1M+ Amazon businesses establish what was paid, missed, reversed, or left unresolved through evidence-led recovery assessment and control.',
    url: `${SITE_META.url}/sales`,
    image: SITE_META.image,
  });

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [form, setForm] = useState<SalesForm>({ name: '', email: '', company: '', role: '', gmv: '', accounts: '', process: '', objective: '', notes: '' });
  const update = (key: keyof SalesForm, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.company || !form.role || !form.gmv) {
      toast({ title: 'Required fields missing', description: 'Please fill in the required fields to request an assessment.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.createSalesLead(form);
      if (!response.ok || !response.data?.success) throw new Error(response.error || 'We could not save your assessment request.');
      setIsSubmitted(true);
      toast({ title: 'Assessment request saved', description: 'Your information is now with the Margin sales team for review.' });
    } catch (error: unknown) {
      toast({ title: 'Assessment request not saved', description: error instanceof Error ? error.message : 'Please try again in a moment.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sales-page landing-google-sans min-h-screen overflow-x-hidden bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/15 selection:text-[#182026]">
      <PublicNavbar variant="light" wide />
      <main>
        <section className="relative overflow-hidden border-b border-[#D8E3EA] bg-[#FAFAF7] pb-20 pt-36 sm:pb-28 sm:pt-44 lg:pb-32 lg:pt-48">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(11,116,222,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className={`${containerClass} relative`}>
            <p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">Enterprise recovery control</p>
            <h1 className="mt-5 max-w-[980px] font-google-sans text-[46px] font-normal leading-[0.98] tracking-[-0.055em] text-[#182026] sm:text-[68px] md:text-[82px] lg:text-[94px]">A clearer operating view of marketplace money.</h1>
            <p className="mt-8 max-w-[760px] text-[17px] leading-8 tracking-tight text-[#4D5B66] sm:text-[20px] sm:leading-9">Margin helps high-GMV Amazon businesses establish what was paid, missed, reversed, or left unresolved—and turn the evidence into an accountable recovery decision.</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="#assessment" className={buttonClass}>Request an Enterprise Assessment <ArrowRight className="ml-2 inline h-4 w-4" /></a>
              <a href="#operating-model" className="font-google-sans text-[14px] font-semibold text-[#182026] underline decoration-[#B8C8D1] underline-offset-4 hover:text-[#0B74DE]">See how it starts</a>
            </div>
            <div className="mt-12 flex flex-col gap-5 border-t border-[#D8E3EA] pt-6 text-[13px] text-[#4D5B66] sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#0B74DE]" /> Read-only by default. Your team approves the action.</span>
              <span className="font-google-sans text-[11px] font-semibold uppercase tracking-tight text-[#8C9BA6]">Multi-account · Evidence-led · Reconciled</span>
            </div>
          </div>
        </section>

        <section className="border-b border-[#D8E3EA] bg-white py-16 sm:py-24">
          <div className={`${containerClass} grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24`}>
            <div>
              <p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">The enterprise problem</p>
              <h2 className="mt-4 max-w-[520px] font-google-sans text-[36px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[52px]">Scale creates more unresolved financial surface area.</h2>
            </div>
            <div className="max-w-[700px] space-y-5 text-[16px] leading-8 text-[#4D5B66] sm:text-[18px] sm:leading-9">
              <p>At $1M+ in Amazon GMV, discrepancies move across accounts, marketplaces, warehouses, SKUs, reporting periods, and provider workflows.</p>
              <p>Finance and operations may know that something is wrong without having one defensible record of what happened, what is still open, and who owns the next action.</p>
              <p className="font-semibold text-[#182026]">Margin creates the evidence boundary and operating view required to make the next decision responsibly.</p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#D8E3EA] bg-[#F1F5F6] py-16 sm:py-24">
          <div className={containerClass}>
            <div className="max-w-[760px]">
              <p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">What enterprise teams need to know</p>
              <h2 className="mt-4 font-google-sans text-[36px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[52px]">One record. Four decisions.</h2>
            </div>
            <div className="mt-12 grid gap-x-10 gap-y-10 border-t border-[#D8E3EA] pt-8 md:grid-cols-2">
              {operatingQuestions.map(([title, copy]) => <div key={title} className="border-b border-[#D8E3EA] pb-8"><h3 className="font-google-sans text-[22px] font-normal tracking-[-0.03em] text-[#182026]">{title}</h3><p className="mt-3 max-w-[520px] text-[15px] leading-7 text-[#66737F]">{copy}</p></div>)}
            </div>
          </div>
        </section>

        <section id="operating-model" className="border-b border-[#D8E3EA] bg-[#FAFAF7] py-16 sm:py-24">
          <div className={containerClass}>
            <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
              <div><p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">How an engagement starts</p><h2 className="mt-4 font-google-sans text-[36px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[52px]">Start with a controlled assessment—not a platform migration.</h2></div>
              <div className="divide-y divide-[#D8E3EA] border-y border-[#D8E3EA]">
                {engagementSteps.map(([number, title, copy]) => <div key={number} className="grid gap-4 py-7 sm:grid-cols-[56px_220px_1fr] sm:items-start"><span className="font-google-sans text-[12px] font-semibold text-[#0B74DE]">{number}</span><h3 className="font-google-sans text-[18px] font-semibold text-[#182026]">{title}</h3><p className="text-[15px] leading-7 text-[#66737F]">{copy}</p></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#D8E3EA] bg-white py-16 sm:py-24">
          <div className={`${containerClass} grid gap-10 lg:grid-cols-2 lg:gap-24`}>
            <div><p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">Who this is for</p><h2 className="mt-4 font-google-sans text-[36px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[52px]">Built for operations where control matters.</h2></div>
            <div className="space-y-6 text-[16px] leading-8 text-[#4D5B66]"><p>Aggregators, agencies, high-volume brands, and cross-border operators need a common evidence and reconciliation standard across the business.</p><p>Margin is a strong fit when the cost of an unresolved discrepancy is larger than the cost of investigating it properly.</p><p className="font-semibold text-[#182026]">The $1M+ GMV threshold is a qualification signal, not a promise that every large account needs Margin.</p></div>
          </div>
        </section>

        <section id="assessment" className="bg-[#F1F5F6] py-16 sm:py-24">
          <div className={containerClass}>
            <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
              <div><p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">Enterprise assessment</p><h2 className="mt-4 font-google-sans text-[36px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[52px]">Bring the operation you need to understand.</h2><p className="mt-6 max-w-[480px] text-[16px] leading-8 text-[#4D5B66]">Tell us enough to scope a useful first conversation. No account connection, provider switch, or commitment is required.</p><div className="mt-8 space-y-3 text-[13px] text-[#4D5B66]"><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0B74DE]" /> No commitment required</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0B74DE]" /> No provider switch required</p><p className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0B74DE]" /> No account connection required</p></div></div>
              <div className="border-y border-[#D8E3EA] bg-white py-8 sm:py-10">
                {isSubmitted ? <div className="px-2 py-12 sm:px-8"><div className="flex items-start gap-3"><Check className="mt-1 h-5 w-5 shrink-0 text-[#0B74DE]" /><div><h3 className="font-google-sans text-[24px] font-normal text-[#182026]">Assessment request prepared.</h3><p className="mt-3 max-w-[520px] text-[15px] leading-7 text-[#66737F]">Your enterprise profile has been formatted for review. Please send the email from your client so our team can follow up.</p><button type="button" onClick={() => setIsSubmitted(false)} className="mt-8 font-google-sans text-[13px] font-semibold text-[#0B74DE] underline underline-offset-4">Start another request</button></div></div></div> : <form onSubmit={handleSubmit} className="space-y-7 px-2 sm:px-8">
                  <div className="grid gap-6 sm:grid-cols-2"><Field label="Full name"><Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Your name" className={inputClass} required /></Field><Field label="Work email"><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="name@company.com" className={inputClass} required /></Field><Field label="Company or brand group"><Input value={form.company} onChange={(e) => update('company', e.target.value)} placeholder="Legal entity or portfolio" className={inputClass} required /></Field><SelectField label="Your role" placeholder="Select role" value={form.role} onChange={(value) => update('role', value)} options={['Founder / CEO', 'CFO / Finance', 'Operations', 'Marketplace lead', 'Agency / Aggregator', 'Other']} /><SelectField label="Annual Amazon GMV" placeholder="Select range" value={form.gmv} onChange={(value) => update('gmv', value)} options={['$1M–$5M', '$5M–$25M', '$25M–$100M', '$100M+']} /><Field label="Accounts and marketplaces"><Input value={form.accounts} onChange={(e) => update('accounts', e.target.value)} placeholder="e.g. 3 accounts, 5 countries" className={inputClass} /></Field></div>
                  <div className="grid gap-6 sm:grid-cols-2"><SelectField label="Current recovery process" placeholder="Select process" value={form.process} onChange={(value) => update('process', value)} options={['Internal team', 'Provider', 'Spreadsheet/manual', 'Multiple providers', 'No consistent process', 'Other']} /><SelectField label="What are you trying to establish?" placeholder="Select objective" value={form.objective} onChange={(value) => update('objective', value)} options={['Unresolved recovery', 'Provider verification', 'Reversal/payout control', 'Multi-account reconciliation', 'Recurring recovery operations', 'Other']} /></div>
                  <Field label="Anything we should know before the assessment"><Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Describe marketplace coverage, operating complexity, current workflow, or unresolved concern." className="min-h-[120px] rounded-[7px] border-[#D8E3EA] bg-white font-google-sans text-[14px] text-[#182026] focus-visible:border-[#0B74DE] focus-visible:ring-[#0B74DE]/10" /></Field>
                  <Button type="submit" disabled={isSubmitting} className={`${buttonClass} w-full`}>{isSubmitting ? 'Preparing…' : 'Request Enterprise Assessment'} <ArrowRight className="ml-2 inline h-4 w-4" /></Button>
                </form>}
              </div>
            </div>
          </div>
        </section>
      </main>
      <BrandFooter wide />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className={labelClass}>{label}</span>{children}</label>;
}

function SelectField({ label, placeholder, value, onChange, options }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <Field label={label}><Select value={value} onValueChange={onChange}><SelectTrigger className={inputClass}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select></Field>;
}
