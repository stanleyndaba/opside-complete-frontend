import {
  Archive,
  ChevronDown,
  CircleHelp,
  Clock3,
  DraftingCompass,
  FileText,
  Flag,
  Folder,
  Inbox,
  Mail,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  Settings,
  Star,
  Trash2,
  Video,
  X,
  SlidersHorizontal,
} from "lucide-react";

const messages = [
  { sender: "seller.service05@am.", subject: "[Case ID:19823932021]*Your Help Needed* Inventory lost in FBA warehouse -", bold: false, highlightSeller: true },
  { sender: "Amazon Seller Suppo.", subject: "RE:[CASE 19823788511] Inventory lost in FBA warehouse - To contact us again", bold: false, highlightSeller: true },
  { sender: "seller.service05@am.", subject: "[Case ID:19823932021]*Your Help Needed* Inventory lost in FBA warehouse -", bold: false, highlightSeller: true },
  { sender: "Amazon Seller Suppo.", subject: "RE:[CASE 19822888381] Inventory lost in FBA warehouse - To contact us again", bold: false, highlightSeller: true },
  { sender: "Amazon Seller Suppo.", subject: "[Case ID:19823932021] Inventory lost in FBA warehouse - To contact us again", bold: false, highlightSeller: true },
  { sender: "seller.service05@am.", subject: "[Case ID:19822888381]*Your Help Needed* Inventory lost in FBA warehouse -", bold: false, highlightSeller: true },
  { sender: "seller.service05@am.", subject: "[Case ID:19823788511]*Your Case Resolved* Inventory lost in FBA warehouse", bold: true, highlightSeller: true },
  { sender: "seller.service05@am.", subject: "[Case ID:19823788511]*Your Help Needed* Inventory lost in FBA warehouse", bold: true, highlightSeller: true },
  { sender: "seller.service05@am.", subject: "[Case ID:19823932021]*Your Help Needed* Inventory lost in FBA warehouse", bold: false, highlightSeller: true },
  { sender: "seller.service05@am.", subject: "[Case ID:19822888381]*Your Help Needed* Inventory lost in FBA warehouse", bold: false, highlightSeller: true },
  { sender: "Amazon Seller Suppo.", subject: "RE:[CASE 19824203951] Inventory lost in FBA warehouse - To contact us again", bold: false, highlightSeller: true },
];

function HighlightedSender({ sender, highlightSeller }: { sender: string; highlightSeller: boolean }) {
  if (!highlightSeller) return <>{sender}</>;
  const parts = sender.split(/(seller|Seller)/g);
  return (
    <>
      {parts.map((part, index) => /seller/i.test(part) ? <mark key={`${part}-${index}`} className="bg-[#FCEB9B] text-inherit">{part}</mark> : part)}
    </>
  );
}

function NavItem({ icon: Icon, label, count, active = false }: { icon: typeof Inbox; label: string; count?: string; active?: boolean }) {
  return (
    <div className={`flex h-[34px] items-center gap-3 rounded-r-full px-3 text-[14px] tracking-tight ${active ? "bg-[#DCEBFF] font-bold text-[#202124]" : "text-[#3C4043]"}`}>
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count ? <span className="pr-2 text-[12px] text-[#5F6368]">{count}</span> : null}
    </div>
  );
}

export function HeroInboxVisual() {
  return (
    <div aria-hidden="true" className="hero-inbox-frame absolute overflow-hidden bg-[#F8F9FA] text-[#202124] shadow-[0_28px_80px_rgba(24,32,38,0.16)]">
      <div className="flex h-full min-w-0">
        <aside className="flex h-full w-[66px] shrink-0 flex-col items-center border-r border-[#E0E3E7] bg-[#F7F8FC] pt-4 text-[#4B5358]">
          <Menu className="mb-5 h-5 w-5" strokeWidth={1.8} />
          <div className="relative mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#D6E8FF] text-[#1A73E8]">
            <Mail className="h-[19px] w-[19px]" strokeWidth={1.8} />
            <span className="absolute -right-1 -top-1 rounded-full bg-[#B3261E] px-1 text-[9px] font-bold leading-4 text-white">99+</span>
          </div>
          <div className="flex flex-col items-center gap-7 text-[10px]">
            <div className="flex flex-col items-center gap-1"><MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.6} /><span>Chat</span></div>
            <div className="flex flex-col items-center gap-1"><Video className="h-[18px] w-[18px]" strokeWidth={1.6} /><span>Meet</span></div>
          </div>
        </aside>

        <aside className="h-full w-[256px] shrink-0 border-r border-[#E0E3E7] bg-[#F8F9FC] pt-5">
          <button type="button" className="ml-3 flex h-[56px] w-[138px] items-center gap-3 rounded-[18px] bg-[#BFE5FF] px-5 text-[14px] font-medium text-[#202124] shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
            <DraftingCompass className="h-5 w-5" strokeWidth={2} />
            Compose
          </button>
          <div className="mt-5 pr-3">
            <NavItem icon={Inbox} label="Inbox" count="4,466" active />
            <NavItem icon={Star} label="Starred" />
            <NavItem icon={Clock3} label="Snoozed" />
            <NavItem icon={Flag} label="Sent" />
            <NavItem icon={FileText} label="Drafts" count="5" />
            <NavItem icon={Package} label="Purchases" count="34" />
            <NavItem icon={ChevronDown} label="More" />
          </div>
          <div className="mt-7 border-t border-[#E3E6E9] px-5 pt-5">
            <div className="flex items-center justify-between text-[14px] font-medium text-[#3C4043]">
              <span>Labels</span>
              <span className="text-[22px] font-light leading-none">+</span>
            </div>
            <div className="mt-5 flex items-center gap-3 text-[14px] text-[#3C4043]"><ChevronDown className="h-4 w-4" /><span>More</span></div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-white">
          <div className="flex h-[62px] items-center gap-6 border-b border-[#E5E7EA] px-5">
            <div className="flex h-[44px] w-[520px] items-center gap-4 rounded-full bg-[#E9EEF6] px-5 text-[#3C4043] shadow-[inset_0_1px_1px_rgba(60,64,67,0.05)]">
              <Search className="h-5 w-5 shrink-0" strokeWidth={2} />
              <span className="flex-1 text-[14px] tracking-tight">seller central</span>
              <X className="h-5 w-5" strokeWidth={2} />
              <SlidersHorizontal className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="flex h-11 items-center gap-2 rounded-full bg-[#EEF2F8] px-4 text-[13px] text-[#3C4043]"><span className="h-3 w-3 rounded-full bg-[#1E8E3E]" />Active<ChevronDown className="h-4 w-4" /></div>
            <CircleHelp className="h-5 w-5 shrink-0 text-[#4B5358]" strokeWidth={1.8} />
            <Settings className="h-5 w-5 shrink-0 text-[#4B5358]" strokeWidth={1.8} />
            <div className="h-11 w-[100px] shrink-0 rounded-full bg-[#DCE9FF]" />
          </div>

          <div className="flex h-[58px] items-center gap-5 border-b border-[#E5E7EA] px-4">
            <div className="flex h-[34px] items-center rounded-[6px] border border-[#9AA7B5] bg-white text-[13px]"><span className="bg-[#D8E7FF] px-4 py-2 font-medium">Mail</span><span className="border-l border-[#B8BEC5] px-4 py-2">Conversations</span><span className="border-l border-[#B8BEC5] px-4 py-2">Spaces</span></div>
            {[
              "From",
              "Any time",
              "Has attachment",
              "To",
              "Is unread",
            ].map((filter) => <div key={filter} className="flex h-[34px] shrink-0 items-center gap-2 rounded-[7px] border border-[#AAB2BA] bg-white px-3 text-[13px] text-[#3C4043]">{filter}<ChevronDown className="h-3.5 w-3.5" /></div>)}
          </div>

          <div className="flex h-[50px] items-center gap-7 border-b border-[#E5E7EA] px-5 text-[#4B5358]">
            <div className="flex items-center gap-2"><span className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-[#7C858A]"><span className="h-px w-2 bg-[#7C858A]" /></span><ChevronDown className="h-3 w-3" /></div>
            <Archive className="h-[17px] w-[17px]" strokeWidth={1.8} />
            <CircleHelp className="h-[17px] w-[17px]" strokeWidth={1.8} />
            <Trash2 className="h-[17px] w-[17px]" strokeWidth={1.8} />
            <Mail className="h-[17px] w-[17px]" strokeWidth={1.8} />
            <Archive className="h-[17px] w-[17px]" strokeWidth={1.8} />
            <MoreHorizontal className="h-[18px] w-[18px]" strokeWidth={1.8} />
            <div className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-[#F1F3F4] px-3 py-1 text-[12px] text-[#5F6368]">Showing most relevant<ChevronDown className="h-3 w-3" /></div>
          </div>

          <div className="divide-y divide-[#DDE2E7]">
            {messages.map((message, index) => (
              <div key={`${message.sender}-${message.subject}-${index}`} className={`flex h-[40px] items-center gap-4 border-b border-[#E4E7EA] px-5 text-[13px] tracking-tight ${message.bold ? "font-semibold text-[#202124]" : "text-[#4A5359]"}`}>
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[2px] border border-[#A7AFB5]" />
                <Star className="h-[17px] w-[17px] shrink-0 text-[#9AA2A7]" strokeWidth={1.6} />
                <span className="w-[190px] shrink-0 truncate"><HighlightedSender sender={message.sender} highlightSeller={message.highlightSeller} /></span>
                <span className="shrink-0 rounded-[4px] bg-[#E8EAED] px-2 py-0.5 text-[11px] font-normal text-[#59636A]">Inbox</span>
                <span className="min-w-0 truncate">{message.subject}</span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default HeroInboxVisual;
