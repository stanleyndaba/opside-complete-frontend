import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ClipboardList, ExternalLink, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { api } from '@/lib/api';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';

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

type StoredHandoff = HandoffDetails & {
  submittedAt: string;
  leadId?: string;
  uploadOpenedAt?: string;
  uploadConfirmedAt?: string;
  handoffToken?: string;
  idempotencyKey?: string;
};

const phaseClass = (active: boolean) => active ? 'bg-[#182026] text-white' : 'bg-[#F5F7F8] text-[#777A82]';

function readStoredHandoff(): StoredHandoff | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(HANDOFF_STORAGE_KEY);
    return stored ? JSON.parse(stored) as StoredHandoff : null;
  } catch {
    return null;
  }
}

export default function SellerAuditHandoff() {
  usePageMeta({
    title: 'Seller File Handoff | Margin',
    description: 'Give Margin the context it needs, then send your Amazon files for review.',
    url: `${SITE_META.url}/seller-audit`,
    image: SITE_META.image,
  });

  const { toast } = useToast();
  const storedHandoff = useMemo(readStoredHandoff, []);
  const [details, setDetails] = useState<HandoffDetails>({
    email: storedHandoff?.email || '',
    businessName: storedHandoff?.businessName || '',
    reportType: storedHandoff?.reportType || reportOptions[0],
  });
  const [submitted, setSubmitted] = useState(Boolean(storedHandoff?.submittedAt));
  const [leadId, setLeadId] = useState<string | null>(storedHandoff?.leadId || null);
  const [handoffToken, setHandoffToken] = useState<string | null>(storedHandoff?.handoffToken || null);
  const [idempotencyKey] = useState(() => storedHandoff?.idempotencyKey || (typeof window !== 'undefined' ? window.crypto.randomUUID() : 'server-render'));
  const [dropboxOpened, setDropboxOpened] = useState(Boolean(storedHandoff?.uploadOpenedAt));
  const [uploadConfirmed, setUploadConfirmed] = useState(Boolean(storedHandoff?.uploadConfirmedAt));
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof HandoffDetails, string>>>({});
  const [intakeError, setIntakeError] = useState<string | null>(null);
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

  const persistLocalHandoff = (next: Partial<StoredHandoff> = {}) => {
    const current: StoredHandoff = {
      ...details,
      email: details.email.trim(),
      businessName: details.businessName.trim(),
      submittedAt: new Date().toISOString(),
      ...(leadId ? { leadId } : {}),
      idempotencyKey,
      ...next,
    };
    window.localStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify(current));
  };

  const continueToUpload = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setIntakeError(null);
    const savedDetails = { ...details, email: details.email.trim(), businessName: details.businessName.trim() };
    setDetails(savedDetails);
    persistLocalHandoff();
    const response = await api.submitSellerAuditIntake({
      intake_type: 'seller_audit',
      idempotency_key: idempotencyKey,
      email: savedDetails.email,
      business_name: savedDetails.businessName,
      report_type: savedDetails.reportType,
      audit_period: 'Last 3 months or the period you want reviewed',
    });
    if (response.ok && response.data?.lead_id) {
      setLeadId(response.data.lead_id);
      window.localStorage.setItem(HANDOFF_STORAGE_KEY, JSON.stringify({ ...savedDetails, submittedAt: new Date().toISOString(), leadId: response.data.lead_id, handoffToken: response.data.handoff_token, idempotencyKey }));
      setHandoffToken(response.data.handoff_token || null);
      trackEvent(ANALYTICS_EVENTS.sellerAuditDetailsSubmitted, { source_page: '/seller-audit', lead_id: response.data.lead_id, report_type: savedDetails.reportType });
    } else {
      setIntakeError('Your details are saved on this device, but Margin’s intake service could not be reached. You can still upload your files; please keep this page open until you finish.');
      trackEvent(ANALYTICS_EVENTS.sellerAuditDetailsFailed, { source_page: '/seller-audit', error: response.error || 'intake_service_unavailable' });
    }
    setSubmitted(true);
    setIsSaving(false);
  };

  const openUpload = () => {
    const uploadWindow = DROPBOX_REQUEST_URL ? window.open(DROPBOX_REQUEST_URL, '_blank', 'noopener,noreferrer') : null;
    if (!uploadWindow) {
      setIntakeError('The upload page could not be opened. Please allow pop-ups for Margin and try again.');
      toast({ variant: 'destructive', title: 'Upload page did not open', description: 'Allow pop-ups for Margin, then try again.' });
      return;
    }
    const openedAt = new Date().toISOString();
    setDropboxOpened(true);
    setIntakeError(null);
    persistLocalHandoff({ uploadOpenedAt: openedAt });
    trackEvent(ANALYTICS_EVENTS.sellerAuditUploadOpened, { source_page: '/seller-audit', lead_id: leadId || null });
    if (leadId) {
      if (!handoffToken) return;
      void api.updateSellerAuditIntakeStatus(leadId, handoffToken, 'upload_opened').then((response) => {
        if (!response.ok) {
          setIntakeError('The upload page is open, but Margin could not update the intake status. You can still finish uploading.');
          trackEvent(ANALYTICS_EVENTS.sellerAuditUploadStatusFailed, { source_page: '/seller-audit', lead_id: leadId, status: 'upload_opened' });
        }
      });
    }
  };

  const confirmUpload = () => {
    const confirmedAt = new Date().toISOString();
    setUploadConfirmed(true);
    persistLocalHandoff({ uploadConfirmedAt: confirmedAt });
    trackEvent(ANALYTICS_EVENTS.sellerAuditUploadConfirmed, { source_page: '/seller-audit', lead_id: leadId || null });
    if (leadId) {
      if (!handoffToken) return;
      void api.updateSellerAuditIntakeStatus(leadId, handoffToken, 'upload_confirmed').then((response) => {
        if (!response.ok) {
          setIntakeError('Your confirmation is saved on this device, but Margin could not update the intake status.');
          trackEvent(ANALYTICS_EVENTS.sellerAuditUploadStatusFailed, { source_page: '/seller-audit', lead_id: leadId, status: 'upload_confirmed' });
        }
      });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#EAF1F5] font-sans text-[#182026]">
      <main className="relative mx-auto flex min-h-screen max-w-[860px] items-center px-3 py-4 sm:items-center sm:px-6 sm:py-8 lg:px-8">
        <div className="pointer-events-none absolute -right-36 -top-40 h-[520px] w-[520px] rounded-full border-[74px] border-white/45" />
        <div className="pointer-events-none absolute -bottom-56 -left-40 h-[500px] w-[500px] rounded-full border-[64px] border-[#C7DCE8]/55" />
        <div className="relative z-10 w-full">
          <div className="mb-5 flex items-center gap-2.5 px-1 sm:mb-6">
            <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto object-contain" />
            <span className="font-merriweather text-[15px] font-semibold tracking-[-0.02em] text-[#30343B]">Margin</span>
          </div>
          <section className="mx-auto max-w-2xl rounded-[12px] bg-white/90 px-3.5 py-4 font-google-sans shadow-[0_16px_48px_rgba(50,78,96,0.1)] backdrop-blur-sm sm:px-8 sm:py-8" aria-labelledby="handoff-title">
            <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]" aria-label={submitted ? 'Step 2 of 2' : 'Step 1 of 2'}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${phaseClass(!submitted)}`}>{submitted ? <Check className="h-3.5 w-3.5" /> : '1'}</span><span>Prepare</span><span className="h-px w-5 bg-[#D7D7D1]" />
              <span className={`flex h-6 w-6 items-center justify-center rounded-full ${phaseClass(submitted)}`}>{uploadConfirmed ? <Check className="h-3.5 w-3.5" /> : '2'}</span><span>Send files</span>
            </div>
            <div className="mx-auto border-b border-[#E4E6E8] pb-4 sm:pb-6">
              <h1 id="handoff-title" className="font-google-sans text-[25px] font-normal leading-[1.08] tracking-[-0.035em] text-[#30343B] sm:text-[40px]">{submitted ? 'Your upload is ready.' : 'Send your files to Margin.'}</h1>
              <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#595E68]">{submitted ? 'The next step opens Margin’s Dropbox file request. It is hosted by Dropbox, but the files go directly to the Margin Audit team.' : 'Add two quick details, then send the Amazon records you already have. You can send multiple files at once.'}</p>
            </div>
            {!submitted ? (
              <form className="mx-auto mt-4 max-w-xl space-y-3.5 sm:mt-6 sm:space-y-4" onSubmit={(event) => { event.preventDefault(); void continueToUpload(); }} noValidate>
                <div className="rounded-[9px] bg-[#F5F7F8] px-3 py-3 text-[13px] leading-5 text-[#595E68]">
                  <div className="flex items-start gap-2"><ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-[#3F51A8]" aria-hidden="true" /><div><p className="font-semibold text-[#30343B]">Send what you already have</p><p className="mt-1">You do not need to clean, rename, or organize a perfect package first. Partial records are okay; Margin will tell you if anything important is missing.</p></div></div>
                  <p className="mt-3 border-t border-[#E4E6E8] pt-3"><span className="font-semibold text-[#30343B]">Useful files:</span> settlement or payment reports, inventory / FBA reports, shipment or receiving reports, returns, refunds, and other Amazon exports. CSV, XLSX, PDF, and ZIP files are fine.</p>
                  <p className="mt-2 font-semibold text-[#30343B]">Preferred period: last 3 months, or the period you want reviewed.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handoff-email" className="text-[13px] font-semibold text-[#30343B]">Email <span className="text-[#A73549]">*</span></Label>
                  <div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777A82]" aria-hidden="true" /><Input id="handoff-email" type="email" autoComplete="email" placeholder="you@example.com" value={details.email} onChange={(event) => updateDetails('email', event.target.value)} className="h-10 rounded-[9px] border-[#D7D7D1] pl-10 text-[14px] focus-visible:ring-[#5165C7]" aria-invalid={Boolean(errors.email)} /></div>
                  {errors.email ? <p className="text-[12px] text-[#A73549]">{errors.email}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handoff-business" className="text-[13px] font-semibold text-[#30343B]">Seller / business name <span className="text-[#A73549]">*</span></Label>
                  <Input id="handoff-business" type="text" autoComplete="organization" placeholder="Acme Brands" value={details.businessName} onChange={(event) => updateDetails('businessName', event.target.value)} className="h-10 rounded-[9px] border-[#D7D7D1] px-3 text-[14px] focus-visible:ring-[#5165C7]" aria-invalid={Boolean(errors.businessName)} />
                  {errors.businessName ? <p className="text-[12px] text-[#A73549]">{errors.businessName}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handoff-report-type" className="text-[13px] font-semibold text-[#30343B]">What are you sending? <span className="font-normal text-[#777A82]">(optional)</span></Label>
                  <select id="handoff-report-type" value={details.reportType} onChange={(event) => updateDetails('reportType', event.target.value)} className="h-10 w-full rounded-[9px] border border-[#D7D7D1] bg-white px-3 text-[14px] text-[#191B20] outline-none transition-shadow focus:ring-2 focus:ring-[#5165C7]">
                    {reportOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <Button type="submit" disabled={!canSubmit || isSaving} className="h-10 w-full rounded-[9px] border border-[#C7DCE8] bg-[#EAF1F5] px-4 text-[13px] font-semibold text-[#182026] shadow-none hover:bg-[#DCE8EE] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto">{isSaving ? 'Saving your details…' : 'Continue to upload'} {!isSaving ? <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /> : null}</Button>
              </form>
            ) : (
              <div className="mx-auto mt-6 max-w-xl pt-1">
                <div className="rounded-[9px] bg-[#EEF8F2] px-3 py-3 text-[13px] leading-5 text-[#23623F]"><div className="flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B8F5A] text-white"><Check className="h-3 w-3" aria-hidden="true" /></span><div><p className="font-semibold text-[#23623F]">Your files stay under your control.</p><p className="mt-1">The files are used for Margin’s audit review only. They are not submitted to Amazon or used to pursue anything without your approval.</p></div></div></div>
                <div className="mt-4 rounded-[9px] border border-[#DCE8EE] bg-white px-3 py-3 text-[13px] leading-5 text-[#595E68]"><p className="font-semibold text-[#30343B]">Dropbox handoff</p><p className="mt-1">Dropbox hosts the upload screen. Your files are sent to Margin’s Audit request, and you can upload multiple files in one visit.</p><Button type="button" onClick={openUpload} className="mt-4 h-10 w-full rounded-[9px] border border-[#C7DCE8] bg-[#EAF1F5] px-4 text-[13px] font-semibold text-[#182026] shadow-none hover:bg-[#DCE8EE] sm:w-auto">{dropboxOpened ? 'Open upload page again' : 'Upload my files'} <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden="true" /></Button></div>
                {dropboxOpened && !uploadConfirmed ? <div className="mt-4 rounded-[9px] bg-[#F5F7F8] px-3 py-3 text-[13px] leading-5 text-[#595E68]"><p className="font-semibold text-[#30343B]">After you upload</p><p className="mt-1">Dropbox sends the files to Margin. You can close the upload page when you are done; returning here and marking it complete is optional, but it helps us track the handoff.</p><Button type="button" onClick={confirmUpload} className="mt-3 h-9 rounded-[8px] bg-[#3F51A8] px-3 text-[12px] font-semibold text-white shadow-none hover:bg-[#31418D]">Mark upload complete <Check className="ml-2 h-3.5 w-3.5" aria-hidden="true" /></Button></div> : null}
                {uploadConfirmed ? <div className="mt-4 rounded-[9px] bg-[#EEF8F2] px-3 py-3 text-[13px] leading-5 text-[#23623F]"><div className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span><strong>Upload marked complete.</strong> Your files were sent to Margin’s Dropbox request. The team will verify the upload, review the records, and send the audit result to <strong>{details.email}</strong> within one business day. If anything important is missing, we will contact you.</span></div></div> : null}
                {intakeError ? <p className="mt-3 text-[12px] leading-5 text-[#A73549]">{intakeError}</p> : null}
                <div className="mt-4 rounded-[9px] border border-[#E4E6E8] bg-white px-3 py-3 text-[12px] leading-5 text-[#595E68]"><p className="font-semibold text-[#30343B]">If the upload page does not open</p><p className="mt-1">Allow pop-ups for Margin and try again. If Dropbox still blocks the upload, <Link to="/contact" className="font-semibold text-[#3F51A8] underline underline-offset-2">contact Margin</Link> and include the business name you entered above.</p></div>
                <div className="mt-5 border-t border-[#E4E6E8] pt-4"><p className="text-[12px] font-semibold uppercase text-[#777A82]">What happens next</p><p className="mt-3 text-[13px] leading-6 text-[#595E68]">Margin will review the records, identify meaningful discrepancies, and send you the audit result so you can choose the next step. Nothing is submitted or pursued without your approval. Read the <Link to="/privacy" className="underline underline-offset-2 hover:text-[#30343B]">Margin Privacy Policy</Link>.</p></div>
              </div>
            )}
            {!submitted ? <p className="mx-auto mt-6 max-w-xl border-t border-[#E4E6E8] pt-4 text-[12px] leading-5 text-[#777A82]">After the upload, Margin will review the records and email the result within one business day. If anything else is needed, we will tell you exactly what to send. <Link to="/privacy" className="underline underline-offset-2 hover:text-[#30343B]">Privacy details</Link>.</p> : null}
          </section>
        </div>
      </main>
    </div>
  );
}
