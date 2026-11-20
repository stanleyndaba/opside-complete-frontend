import { useState, type ReactNode } from "react";
import {
  Files,
  Layers3,
  List,
  ListChecks,
  MessageSquare,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  UserRound,
  UsersRound,
} from "lucide-react";

type LibraryItem = {
  label: string;
  count: number;
  icon: "all" | "prompts" | "workflows" | "favorites" | "mine";
};

const navigation: LibraryItem[] = [
  { label: "All", count: 220, icon: "all" },
  { label: "Prompts", count: 200, icon: "prompts" },
  { label: "Workflows", count: 20, icon: "workflows" },
];

const filters: LibraryItem[] = [
  { label: "Favourites", count: 20, icon: "favorites" },
  { label: "My workflows", count: 13, icon: "mine" },
];

const assessmentItems = [
  { label: "Control record", icon: ListChecks },
  { label: "Source register", icon: Layers3 },
  { label: "Evidence position", icon: Files },
  { label: "Authority boundary", icon: SlidersHorizontal },
] as const;

function ItemIcon({ icon }: { icon: LibraryItem["icon"] }) {
  if (icon === "all") return <List className="h-[18px] w-[18px] stroke-[1.8]" />;
  if (icon === "prompts") return <MessageSquare className="h-[18px] w-[18px] stroke-[1.8]" />;
  if (icon === "workflows") return <UsersRound className="h-[18px] w-[18px] stroke-[1.8]" />;
  if (icon === "favorites") return <Star className="h-[18px] w-[18px] stroke-[1.8]" />;
  return <UserRound className="h-[18px] w-[18px] stroke-[1.8]" />;
}

function CountedItem({ item, active, onClick }: { item: LibraryItem; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left transition-colors sm:py-2.5 ${active ? "bg-[#efefef]" : "hover:bg-[#f5f5f5]"}`}
    >
      <span className="shrink-0 text-[#1c1d1e]"><ItemIcon icon={item.icon} /></span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium tracking-[-0.02em] text-[#18191a] sm:text-[14px]">{item.label}</span>
      <span className="text-[12px] font-normal text-[#969797] sm:text-[14px]">{item.count}</span>
    </button>
  );
}

export function DemoTestsShell({ children, embedded = false }: { children?: ReactNode; embedded?: boolean }) {
  const [active, setActive] = useState("Workflows");

  return (
    <main className={`${embedded ? "min-h-0 w-full p-0" : "min-h-screen px-3 py-3 sm:px-6 sm:py-6 lg:px-10 lg:py-10"} overflow-x-hidden bg-white text-[#18191a]`}>
      <section className={`${embedded ? "min-h-0 max-w-none rounded-none shadow-none" : "min-h-[calc(100vh-0.75rem)] max-w-[1420px] rounded-[16px] shadow-[0_30px_80px_rgba(15,34,39,0.22)] sm:min-h-[calc(100vh-1.5rem)] lg:min-h-[calc(100vh-2.5rem)]"} mx-auto flex w-full overflow-hidden bg-[#fafafa]`}>
        <aside className={`${embedded ? "hidden md:flex md:w-[184px] md:min-w-[184px] md:px-3 md:py-4" : "flex w-[210px] min-w-[210px] px-3 py-5 sm:w-[240px] sm:min-w-[240px] sm:px-4 sm:py-6"} shrink-0 flex-col border-r border-[#e1e1e1] bg-white`}>
          <div className="mb-8 flex items-center justify-between px-2">
            <div>
              <p className="text-[13px] font-semibold tracking-[-0.03em] text-[#18191a]">Margin Library</p>
              <p className="mt-1 text-[10px] text-[#969797]">Prompts and workflows</p>
            </div>
            <button type="button" className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#25292a] text-white transition hover:bg-[#3b4142]" aria-label="Create a new prompt">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <nav aria-label="Library navigation" className="space-y-1">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a0a1a1]">Library</p>
            {navigation.map((item) => <CountedItem key={item.label} item={item} active={active === item.label} onClick={() => setActive(item.label)} />)}
          </nav>

          <nav aria-label="Saved filters" className="mt-8 space-y-1">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a0a1a1]">Your space</p>
            {filters.map((item) => <CountedItem key={item.label} item={item} active={active === item.label} onClick={() => setActive(item.label)} />)}
          </nav>

          <nav aria-label="Assessment navigation" className="mt-8 border-t border-[#ececec] pt-5">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a0a1a1]">Assessment</p>
            <div className="space-y-1">
              {assessmentItems.map(({ label, icon: Icon }) => (
                <button key={label} type="button" className="flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-[12px] font-medium tracking-[-0.02em] text-[#525455] transition-colors hover:bg-[#f5f5f5] sm:py-2.5 sm:text-[14px]">
                  <Icon className="h-[18px] w-[18px] shrink-0 stroke-[1.8] text-[#1c1d1e]" />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="mt-auto border-t border-[#ececec] px-3 pt-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25292a] text-[10px] font-semibold text-white">M</span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-[#25292a]">Margin team</p>
                <p className="truncate text-[10px] text-[#969797]">Shared workspace</p>
              </div>
            </div>
          </div>
        </aside>

        <section className={`${embedded ? "px-3 py-3 md:px-5 md:py-4" : "px-3 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10"} min-w-0 flex-1 overflow-y-auto bg-[#fbfbfb]`}>
          <div className="flex items-center justify-between gap-3">
            <div className="relative min-w-0 max-w-[610px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.7] text-[#656767]" />
              <input placeholder="Search Margin" className="h-[42px] w-full rounded-[20px] border-0 bg-[#f0f0f0] pl-10 pr-3 text-[12px] text-[#1e2021] outline-none placeholder:text-[#7d7e7f] focus:ring-2 focus:ring-[#ccd0d0] sm:text-[15px]" />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Open store" className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#dedede] bg-white text-[#25292a] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#f4f4f4]"><Store className="h-4 w-4" strokeWidth={1.9} /></button>
              <button type="button" aria-label="Account" className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#25292a] text-white sm:flex"><UserRound className="h-4 w-4" /></button>
            </div>
          </div>

          <div className={`${embedded ? "mt-3 min-h-0" : "mt-7 min-h-[calc(100vh-150px)] sm:mt-9"} overflow-hidden`}>
            {children}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function DemoTests() {
  return <DemoTestsShell />;
}
