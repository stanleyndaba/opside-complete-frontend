import { ArrowRight, Check, CircleAlert, FileText, Link2, MessageSquare } from "lucide-react";

const caseEvents = [
  { label: "Amazon response", detail: "Partial approval · 11:16", tone: "blue", icon: MessageSquare },
  { label: "Evidence requirement", detail: "Residual position · 13:08", tone: "orange", icon: FileText },
  { label: "Margin response", detail: "Prepared · 13:24", tone: "violet", icon: ArrowRight },
];

export function ConnectedCasePositionVisual() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[58%] overflow-hidden bg-[linear-gradient(135deg,#F7FAFC_0%,#EEF4F6_56%,#F9FBFA_100%)]">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#DDE9FF]/60 blur-3xl" />
      <div className="absolute -left-12 top-20 h-40 w-40 rounded-full bg-[#F9DFF4]/45 blur-3xl" />
      <div className="relative mx-4 mt-4 rounded-[10px] border border-white/90 bg-white/80 p-3 shadow-[0_12px_34px_rgba(44,80,96,0.08)] backdrop-blur-md sm:mx-8 sm:mt-7 sm:p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#81919A] sm:text-[10px]">
              <Link2 className="h-3 w-3 text-[#526AB1]" strokeWidth={2} />
              Connected case position
            </div>
            <p className="mt-1 truncate text-[13px] font-semibold tracking-tight text-[#263438] sm:text-[15px]">Amazon case · 19822888381</p>
          </div>
          <span className="shrink-0 rounded-full border border-[#F3C98A] bg-[#FFF7E8] px-2 py-1 text-[9px] font-semibold text-[#9A620E]">Residual open</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-[7px] bg-[#F5F8FA] px-2 py-2">
            <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#8A9AA2]">Supported</p>
            <p className="mt-0.5 text-[12px] font-semibold tracking-tight text-[#263438] sm:text-[13px]">$26,000</p>
          </div>
          <div className="rounded-[7px] bg-[#FFF8ED] px-2 py-2">
            <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#A27B3D]">Residual</p>
            <p className="mt-0.5 text-[12px] font-semibold tracking-tight text-[#9A620E] sm:text-[13px]">$18,650</p>
          </div>
          <div className="rounded-[7px] bg-[#F3F0FF] px-2 py-2">
            <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[#7D73A9]">Next action</p>
            <p className="mt-0.5 truncate text-[12px] font-semibold tracking-tight text-[#51489A] sm:text-[13px]">Evidence review</p>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-3 gap-2">
          <span className="absolute left-[14%] right-[14%] top-[13px] border-t border-dashed border-[#CBD8DE]" />
          {caseEvents.map(({ label, detail, tone, icon: Icon }) => {
            const toneClass = tone === "orange" ? "bg-[#FFF0D4] text-[#A36812]" : tone === "violet" ? "bg-[#EAE5FF] text-[#635BFF]" : "bg-[#DFEBFF] text-[#3D63B5]";
            return (
              <div key={label} className="relative z-10 min-w-0 text-center">
                <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full ${toneClass}`}><Icon className="h-3.5 w-3.5" strokeWidth={2} /></span>
                <p className="mt-1 truncate text-[9px] font-semibold text-[#45555D]">{label}</p>
                <p className="truncate text-[8px] text-[#87969D]">{detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-4 right-4 flex items-center gap-2 text-[9px] text-[#71838C] sm:left-8 sm:right-8 sm:text-[10px]">
        <CircleAlert className="h-3 w-3 shrink-0 text-[#C58A28]" strokeWidth={2} />
        <span className="truncate">The decision, evidence requirement and outstanding action remain attached to the same financial event.</span>
        <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-[#4F9A72]" strokeWidth={2.2} />
      </div>
    </div>
  );
}

export default ConnectedCasePositionVisual;
