import {
  Archive,
  Check,
  ChevronDown,
  Menu,
  MoreHorizontal,
  RefreshCw,
  Search,
  Star,
  Trash2,
} from "lucide-react";

const inboxMessages = [
  {
    sender: "Amazon correspondence",
    subject: "Amazon decision · partial approval",
    preview: "[Case ID: 19822888381] Partial approval issued — $26,000 | $18,650 residual",
    time: "11:16",
    unread: true,
    tone: "amazon",
  },
  {
    sender: "Margin",
    subject: "Residual evidence response prepared",
    preview: "[Case ID: 19822888381] Residual evidence response prepared | $2,850",
    time: "13:24",
    unread: true,
    tone: "margin",
  },
  {
    sender: "Margin",
    subject: "Recovery review · residual exposure",
    preview: "Amazon approved $26,000 — $19,240 remains open",
    time: "11:28",
    unread: false,
    tone: "margin",
  },
  {
    sender: "seller.service05@amazon.com",
    subject: "Your Help Needed - Inventory lost in FBA warehouse",
    preview: "This is a reminder to let you know that we need more information to resolve your case.",
    time: "Mar 31",
    unread: false,
    tone: "amazon",
  },
  {
    sender: "Amazon Seller Support",
    subject: "Case ID:19822888381 · evidence requested",
    preview: "Please provide the supporting records requested below to continue reviewing your case.",
    time: "Mar 29",
    unread: false,
    tone: "amazon",
  },
];

function SenderMark({ tone }: { tone: string }) {
  if (tone === "amazon") {
    return <img src="/amazon-logo-transparent-circle.png" alt="" className="h-7 w-7 shrink-0 object-contain" />;
  }

  return <img src="/favicon-margin.svg" alt="" className="h-7 w-7 shrink-0 object-contain" />;
}

export function HeroInboxVisual() {
  return (
    <div aria-hidden="true" className="hero-inbox-frame absolute overflow-hidden rounded-[14px] border border-white/70 bg-white/90 shadow-[0_28px_80px_rgba(24,32,38,0.16)] backdrop-blur-xl">
      <div className="flex h-[44px] items-center gap-3 border-b border-[#E8ECEF] bg-white/95 px-3 text-[#5F6368] sm:h-[52px] sm:px-4">
        <Menu className="h-4 w-4 shrink-0 text-[#687278] sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
        <div className="flex items-center gap-2 text-[11px] font-semibold tracking-tight text-[#273238] sm:text-[13px]">
          <img src="/gmailicon.png" alt="" className="h-5 w-5 object-contain sm:h-6 sm:w-6" />
          <span>Inbox</span>
          <ChevronDown className="h-3 w-3 text-[#8A9499]" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Search className="h-4 w-4 text-[#7B858A] sm:h-[18px] sm:w-[18px]" strokeWidth={1.8} />
          <MoreHorizontal className="h-4 w-4 text-[#7B858A] sm:h-[18px] sm:w-[18px]" />
        </div>
      </div>

      <div className="flex h-[38px] items-center gap-3 border-b border-[#EDF0F1] bg-[#FAFBFC] px-3 text-[#849096] sm:h-[44px] sm:px-4">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-[#9AA4A9]" />
        <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
        <Archive className="hidden h-3.5 w-3.5 sm:block" strokeWidth={1.8} />
        <Trash2 className="hidden h-3.5 w-3.5 sm:block" strokeWidth={1.8} />
        <span className="ml-auto text-[9px] text-[#8B959A] sm:text-[10px]">1–5 of 5</span>
      </div>

      <div className="divide-y divide-[#EEF1F2] bg-white">
        {inboxMessages.map((message) => (
          <div key={`${message.sender}-${message.subject}`} className={`flex min-h-[60px] items-start gap-2.5 px-3 py-2.5 sm:min-h-[72px] sm:gap-3 sm:px-4 sm:py-3 ${message.unread ? "bg-[#FBFCFF]" : "bg-white"}`}>
            <span className="mt-1 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-[#BAC3C8]" />
            <Star className="mt-1 h-3.5 w-3.5 shrink-0 text-[#B6BEC2]" strokeWidth={1.6} />
            <SenderMark tone={message.tone} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className={`truncate text-[10px] tracking-tight sm:text-[11px] ${message.unread ? "font-semibold text-[#263238]" : "font-medium text-[#4B575D]"}`}>{message.sender}</span>
                <span className="ml-auto shrink-0 text-[8px] text-[#8A9499] sm:text-[9px]">{message.time}</span>
              </div>
              <div className={`truncate text-[9px] leading-4 tracking-tight sm:text-[10px] ${message.unread ? "font-semibold text-[#344047]" : "font-medium text-[#56636A]"}`}>{message.subject}</div>
              <div className="truncate text-[8px] leading-3.5 text-[#8A959A] sm:text-[9px]">{message.preview}</div>
            </div>
            {message.unread ? <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#635BFF]" /> : <Check className="mt-1 h-3 w-3 shrink-0 text-[#B1BDC2]" strokeWidth={2} />}
          </div>
        ))}
      </div>

      <div className="flex h-7 items-center justify-between border-t border-[#EDF0F1] bg-[#FAFBFC] px-3 text-[8px] text-[#89949A] sm:px-4 sm:text-[9px]">
        <span>Amazon correspondence</span>
        <span>Margin · read-only analysis</span>
      </div>
    </div>
  );
}

export default HeroInboxVisual;
