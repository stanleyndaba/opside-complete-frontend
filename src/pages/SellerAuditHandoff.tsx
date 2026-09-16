import { useMemo, useState } from 'react';
import { ArrowRight, Check, Mail, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const DROPBOX_REQUEST_URL = 'https://www.dropbox.com/request/95x4m4sm0z3ytpoant6r';

const reportOptions = [
  'Amazon reports',
  'Settlement / payment reports',
  'Inventory / FBA reports',
  'Returns / refunds',
  'Not sure — I’ll send what I have',
];

const HANDOFF_STORAGE_KEY = 'margin_seller_handoff';

type HandoffDetails = {
  email: string;
  businessName: string;
  reportType: string;
};

export default function SellerAuditHandoff() {
  usePageMeta({
    title: 'Seller File Handoff | Margin',
    description: 'Give Margin the context it needs, then send your Amazon files securely.',
    url: `${SITE_META.url}/seller-audit`,
    image: SITE_META.image,
  });

  const { toast } = useToast();
  const [details, setDetails] = useState<HandoffDetails>({ email: '', businessName: '', reportType: reportOptions[0] });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof HandoffDetails, string>>>({});

  const canSubmit = useMemo(() => Boolean(details.email.trim() && details.businessName.trim()), [details.email, details.businessName]);

  const updateDetails = (field: keyof HandoffDetails, value: string) => {
    setDetails((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof HandoffDetails, string>> = {};
    if (!details.email.trim()) nextErrors.email = 'Enter the email we should use for this audit.';
    else if (!/^\S+@\S+\.\S+$/.test(details.email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (!details.businessName.trim()) nextErrors.businessName = 'Enter the seller or business name.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const continueToUpload = () => {
    if (!validate()) return;

    const savedDetails = { ...details, email: details.email.trim(), businessName: details.businessName.trim() };
    localStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify({ ...savedDetails, submittedAt: new Date().toISOString() }));
    setDetails(savedDetails);
    setSubmitted(true);

  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-[#30343B]">
      <main className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mb-7 flex items-center gap-2.5 px-1">
          <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto object-contain" />
          <span className="font-merriweather text-[15px] font-semibold tracking-[-0.02em] text-[#30343B]">Margin</span>
        </div>
        <div>
          <section className="bg-white p-0 sm:p-2" aria-labelledby="handoff-title">
            <div className="max-w-2xl border-b border-[#E4E6E8] pb-6">
              <h1 id="handoff-title" className="font-lora text-[30px] font-normal leading-[1.08] tracking-[-0.02em] text-[#30343B] sm:text-[38px]">Let’s get your files to Margin.</h1>
              <p className="mt-3 max-w-xl text-[15px] leading-6 text-[#595E68]">Give us the small amount of context we need to connect your files to the right audit conversation.</p>
            </div>

            {!submitted ? (
              <form className="mt-7 max-w-xl space-y-5" onSubmit={(event) => { event.preventDefault(); continueToUpload(); }} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="handoff-email" className="text-[13px] font-semibold text-[#30343B]">Email <span className="text-[#A73549]">*</span></Label>
                  <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777A82]" aria-hidden="true" /><Input id="handoff-email" type="email" autoComplete="email" placeholder="you@example.com" value={details.email} onChange={(event) => updateDetails('email', event.target.value)} className="h-11 rounded-[10px] border-[#D7D7D1] pl-10 text-[14px] focus-visible:ring-[#5165C7]" aria-invalid={Boolean(errors.email)} /></div>
                  {errors.email ? <p className="text-[12px] text-[#A73549]">{errors.email}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handoff-business" className="text-[13px] font-semibold text-[#30343B]">Seller / business name <span className="text-[#A73549]">*</span></Label>
                  <div className="relative"><Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777A82]" aria-hidden="true" /><Input id="handoff-business" type="text" autoComplete="organization" placeholder="Acme Brands" value={details.businessName} onChange={(event) => updateDetails('businessName', event.target.value)} className="h-11 rounded-[10px] border-[#D7D7D1] pl-10 text-[14px] focus-visible:ring-[#5165C7]" aria-invalid={Boolean(errors.businessName)} /></div>
                  {errors.businessName ? <p className="text-[12px] text-[#A73549]">{errors.businessName}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="handoff-report-type" className="text-[13px] font-semibold text-[#30343B]">What are you sending? <span className="font-normal text-[#777A82]">(optional)</span></Label>
                  <select id="handoff-report-type" value={details.reportType} onChange={(event) => updateDetails('reportType', event.target.value)} className="h-11 w-full rounded-[10px] border border-[#D7D7D1] bg-white px-3 text-[14px] text-[#191B20] outline-none transition-shadow focus:ring-2 focus:ring-[#5165C7]">
                    {reportOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>

                <Button type="submit" disabled={!canSubmit} className="h-11 rounded-[10px] bg-[#3F51A8] px-5 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D] disabled:cursor-not-allowed disabled:opacity-45">Continue to upload <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
              </form>
            ) : (
              <div className="mt-7 max-w-xl rounded-[5px] border border-[#BFE7D8] bg-[#F1FBF7] p-5 sm:p-6">
                <div className="flex items-start gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#DDF7F0] text-[#0E766C]"><Check className="h-4 w-4" aria-hidden="true" /></span><div><h2 className="text-[17px] font-semibold text-[#191B20]">You’re ready to send your files.</h2><p className="mt-1 text-[14px] leading-5 text-[#595E68]">Upload the Amazon files you have. You can send multiple files at once.</p></div></div>
                <Button type="button" onClick={() => DROPBOX_REQUEST_URL ? window.open(DROPBOX_REQUEST_URL, '_blank', 'noopener,noreferrer') : toast({ variant: 'destructive', title: 'Upload link is being connected', description: 'The Dropbox File Request URL still needs to be configured.' })} className="mt-5 h-11 rounded-[10px] bg-[#3F51A8] px-5 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D]">Upload my files <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
                {!DROPBOX_REQUEST_URL ? <p className="mt-3 text-[12px] text-[#A73549]">Dropbox File Request URL is not configured yet.</p> : null}
              </div>
            )}

            <p className="mt-8 max-w-xl border-t border-[#E4E6E8] pt-5 text-[13px] leading-5 text-[#777A82]">If we need anything else for your review, Margin will reach out by email.</p>
          </section>
        </div>
      </main>
      <footer className="border-t border-[#E4E6E8] bg-white px-4 py-6 text-center sm:px-6"><p className="text-[12px] text-[#777A82]">Margin Agents can make mistakes. Check important information before relying on it.</p></footer>
    </div>
  );
}
