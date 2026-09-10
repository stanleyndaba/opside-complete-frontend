import { useRef, useState } from "react";
import { Check, ChevronDown, FileText, LockKeyhole, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SITE_META } from "@/config/site";

type RequestedRecord = {
  name: string;
  purpose: string;
  accepted: string;
};

const requestedRecords: RequestedRecord[] = [
  {
    name: "FBA Inventory Ledger",
    purpose: "To reconcile inventory movements and determine whether units were actually accounted for.",
    accepted: "CSV",
  },
  {
    name: "Settlement Report",
    purpose: "To determine whether identified amounts were actually reflected in your Amazon financial records.",
    accepted: "CSV / TXT",
  },
  {
    name: "Relevant Amazon case documentation",
    purpose: "To establish what Amazon previously determined and what evidence was provided.",
    accepted: "PDF / TXT",
  },
];

const reviewSteps = ["Account connected", "Initial examination", "Additional records required", "Margin review", "Clear result"];
const nextSteps = [
  ["You send the records", "Upload the Amazon files requested above."],
  ["Margin examines them", "We’ll cross-check the records against the information already available to us."],
  ["We establish what the data supports", "We’ll determine what happened, what can be supported, and what remains unresolved."],
  ["We send you the result", "You’ll receive a clear summary of what we found and what, if anything, you can do about it."],
  ["You decide", "If there’s something worth recovering, you decide whether Margin handles it."],
];

export default function InformationRequired() {
  usePageMeta({
    title: "Information Required | Margin",
    description: "Send Margin the Amazon records needed to complete your review.",
    url: `${SITE_META.url}/information-required`,
    image: SITE_META.image,
  });

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [files, setFiles] = useState<Record<string, string>>({});
  const [whyOpen, setWhyOpen] = useState(false);

  const chooseFile = (recordName: string) => inputRefs.current[recordName]?.click();
  const receiveFile = (recordName: string, file?: File) => {
    if (!file) return;
    setFiles((current) => ({ ...current, [recordName]: file.name }));
  };
  const receivedCount = Object.keys(files).length;

  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#34414A]">
      <header className="border-b border-[#DCE8ED]/70 bg-white/70 px-5 py-5 backdrop-blur-xl sm:px-8">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2.5 rounded-[6px] px-1.5 py-1 transition-colors hover:bg-[#F1F7FA]">
            <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
            <span className="font-merriweather text-lg tracking-tight text-[#34414A]">Margin</span>
          </Link>
          <span className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#64808D]">Your review continues</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1120px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16 md:pb-28 md:pt-20">
        <section className="grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-20" aria-labelledby="information-required-title">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">Information required</p>
            <h1 id="information-required-title" className="mt-5 max-w-[700px] font-lora text-[42px] leading-[1.02] tracking-[-0.045em] text-[#34414A] sm:text-[58px]" style={{ fontWeight: 400 }}>Give Margin the records. We&apos;ll do the digging.</h1>
            <p className="mt-6 max-w-[620px] text-[16px] leading-8 text-[#536872] sm:text-[18px]">We&apos;ve started examining your Amazon account. Some of the records we need to complete the review aren&apos;t available through your current connection.</p>
            <p className="mt-4 max-w-[620px] text-[16px] font-semibold leading-8 text-[#34414A] sm:text-[18px]">Send them to us. We&apos;ll examine the data, cross-check the records, and come back with a clear answer about what we can establish.</p>
          </div>

          <div className="rounded-[10px] border border-white/80 bg-[linear-gradient(145deg,rgba(217,238,245,0.88),rgba(255,255,255,0.78))] p-5 shadow-[0_18px_55px_rgba(72,103,122,0.10)] backdrop-blur-xl sm:p-7">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#64808D]">Your review</p>
            <div className="mt-5 space-y-4">
              {reviewSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-3 text-[13px] text-[#536872]">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${index < 2 ? "bg-[#0B74DE] text-white" : index === 2 ? "bg-[#D9EEF5] text-[#0B74DE] ring-1 ring-[#0B74DE]/30" : "bg-white/70 text-[#8AA0AA]"}`}>
                    {index < 2 ? <Check className="h-3.5 w-3.5" /> : index === 2 ? <span className="h-2 w-2 rounded-full bg-[#0B74DE]" /> : <span className="h-1.5 w-1.5 rounded-full bg-[#A8BBC3]" />}
                  </span>
                  <span className={index === 2 ? "font-semibold text-[#34414A]" : ""}>{index + 1}. {step}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 border-t border-[#DCE8ED] pt-12 md:mt-20" aria-labelledby="records-title">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">What we need from you</p>
              <h2 id="records-title" className="mt-3 font-lora text-[32px] leading-tight tracking-[-0.04em] text-[#34414A] sm:text-[42px]" style={{ fontWeight: 400 }}>We need {requestedRecords.length} records to complete your review.</h2>
            </div>
            <p className="text-[13px] font-medium text-[#64808D]">{receivedCount} of {requestedRecords.length} records received</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {requestedRecords.map((record) => (
              <article key={record.name} className="flex flex-col rounded-[8px] border border-white/80 bg-white/75 p-5 shadow-[0_10px_30px_rgba(72,103,122,0.06)] backdrop-blur-xl">
                <div className="flex items-start gap-3"><FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#0B74DE]" /><h3 className="text-[15px] font-semibold leading-5 text-[#34414A]">{record.name}</h3></div>
                <p className="mt-5 text-[13px] leading-6 text-[#536872]"><span className="font-semibold text-[#34414A]">Why we need it:</span> {record.purpose}</p>
                <p className="mt-4 font-mono text-[10px] font-semibold uppercase tracking-tight text-[#64808D]">Accepted: {record.accepted}</p>
                {files[record.name] && <p className="mt-4 truncate rounded-[5px] bg-[#EAF5F8] px-3 py-2 text-[11px] font-medium text-[#48677A]">✓ {files[record.name]}</p>}
                <input ref={(node) => { inputRefs.current[record.name] = node; }} type="file" accept={record.accepted.split(" /").map((type) => `.${type.toLowerCase()}`).join(",")} className="hidden" onChange={(event) => receiveFile(record.name, event.target.files?.[0])} />
                <button type="button" onClick={() => chooseFile(record.name)} className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] bg-[#0B74DE] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-[#0869C9]">{files[record.name] ? "Choose another file" : "Choose file"}</button>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]" aria-labelledby="next-title">
          <div className="rounded-[10px] bg-[#D9EEF5]/70 p-6 sm:p-8">
            <h2 className="font-lora text-[30px] leading-tight tracking-[-0.04em] text-[#34414A] sm:text-[38px]" style={{ fontWeight: 400 }}>You don&apos;t need to analyze these files.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[#536872]">Just send us the records we&apos;re asking for.</p>
            <p className="mt-2 text-[15px] font-semibold leading-7 text-[#34414A]">We&apos;ll do the examination.</p>
          </div>
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">What happens next</p>
            <div id="next-title" className="mt-5 divide-y divide-[#DCE8ED] border-y border-[#DCE8ED]">{nextSteps.map(([title, detail], index) => <div key={title} className="grid gap-2 py-4 sm:grid-cols-[170px_1fr] sm:gap-5"><span className="font-mono text-[11px] font-semibold text-[#0B74DE]">0{index + 1} — {title}</span><span className="text-[13px] leading-6 text-[#536872]">{detail}</span></div>)}</div>
          </div>
        </section>

        <section className="mt-14 rounded-[10px] border border-white/80 bg-white/65 p-6 shadow-[0_10px_35px_rgba(72,103,122,0.06)] backdrop-blur-xl sm:p-8">
          <button type="button" onClick={() => setWhyOpen((open) => !open)} className="flex w-full items-center justify-between text-left"><span><span className="block font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">Why we&apos;re asking</span><span className="mt-2 block font-lora text-[24px] tracking-[-0.03em] text-[#34414A] sm:text-[30px]" style={{ fontWeight: 400 }}>Why does Margin need additional records?</span></span><ChevronDown className={`h-5 w-5 shrink-0 text-[#64808D] transition-transform ${whyOpen ? "rotate-180" : ""}`} /></button>
          {whyOpen && <p className="mt-5 max-w-[800px] text-[14px] leading-7 text-[#536872]">Amazon exposes different parts of an account through different reports and connections. One record can show that something happened without explaining why it happened or where the money ultimately went. Margin uses multiple records to cross-check what happened rather than making a conclusion from a single data point. <strong className="text-[#34414A]">We&apos;d rather tell you we couldn&apos;t establish something than tell you something that isn&apos;t true.</strong></p>}
        </section>

        <section className="mt-14 grid gap-8 border-t border-[#DCE8ED] pt-10 sm:grid-cols-2" aria-label="Review assurances">
          <div><div className="flex items-center gap-2 text-[13px] font-semibold text-[#34414A]"><LockKeyhole className="h-4 w-4 text-[#0B74DE]" /> Your files are used for your Margin review.</div><p className="mt-3 text-[13px] leading-6 text-[#536872]">We only ask for records relevant to the examination. We don&apos;t need your Amazon password, payment-card information, or unrelated personal documents.</p></div>
          <div><p className="font-lora text-[24px] tracking-[-0.03em] text-[#34414A] sm:text-[30px]" style={{ fontWeight: 400 }}>Send the records to Margin.</p><p className="mt-2 text-[13px] leading-6 text-[#536872]">Once they&apos;re uploaded, our team will review them and complete the examination.</p><button type="button" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-[#0B74DE] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0869C9]"><UploadCloud className="h-4 w-4" /> Send to Margin</button><p className="mt-3 text-[12px] text-[#64808D]">Don&apos;t have one of these reports yet? You can come back and upload it later.</p></div>
        </section>
      </div>
    </main>
  );
}
