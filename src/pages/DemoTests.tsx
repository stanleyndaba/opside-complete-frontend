import { useMemo, useState } from "react";
import {
  List,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
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

type Prompt = {
  title: string;
  description: string;
  author: string;
  time: string;
  initials?: string;
  tone: string;
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

const promptCards: Prompt[] = [
  {
    title: "Customer Contract Review",
    description: "Identifies change of control, renewal terms, and unusual obligations, then summarises them in plain language.",
    author: "Junestrand & Labor",
    time: "2d ago",
    initials: "JL",
    tone: "bg-[#202528]",
  },
  {
    title: "Document Review",
    description: "Review a set of business documents and surface the clauses, dates, and relationships that need attention.",
    author: "Junestrand & Labor",
    time: "3d ago",
    initials: "JL",
    tone: "bg-[#c37f66]",
  },
  {
    title: "Witness Interview",
    description: "Convert an interview into a structured account of what happened, what is supported, and what remains open.",
    author: "Margin Library",
    time: "2d ago",
    initials: "M",
    tone: "bg-[#111719]",
  },
];

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
      className={`group flex w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left transition-colors sm:py-2.5 ${
        active ? "bg-[#efefef]" : "hover:bg-[#f5f5f5]"
      }`}
    >
      <span className="shrink-0 text-[#1c1d1e]"><ItemIcon icon={item.icon} /></span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium tracking-[-0.02em] text-[#18191a] sm:text-[14px]">{item.label}</span>
      <span className="text-[12px] font-normal text-[#969797] sm:text-[14px]">{item.count}</span>
    </button>
  );
}

function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <article className="rounded-[8px] border border-[#dedede] bg-white px-3.5 py-3 shadow-[0_1px_1px_rgba(0,0,0,0.02)] sm:px-4 sm:py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#171819] sm:text-[17px]">{prompt.title}</h3>
          <p className="mt-4 max-w-[560px] text-[11px] leading-[1.45] tracking-[-0.02em] text-[#77797a] sm:text-[12px]">{prompt.description}</p>
        </div>
        <button type="button" aria-label={`More options for ${prompt.title}`} className="mt-1 shrink-0 rounded-full p-1 text-[#77797a] hover:bg-[#f1f1f1]">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[#77797a]">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white ${prompt.tone}`}>{prompt.initials}</span>
        <span className="text-[11px] font-medium sm:text-[12px]">{prompt.author}</span>
        <span className="text-[11px] sm:text-[12px]">·</span>
        <span className="text-[11px] sm:text-[12px]">{prompt.time}</span>
      </div>
    </article>
  );
}

export default function DemoTests() {
  const [active, setActive] = useState("Workflows");
  const [search, setSearch] = useState("");

  const visibleCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return promptCards;
    return promptCards.filter((card) => `${card.title} ${card.description} ${card.author}`.toLowerCase().includes(query));
  }, [search]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white px-3 py-3 text-[#18191a] sm:px-6 sm:py-6 lg:px-10 lg:py-10">
      <section className="mx-auto flex min-h-[calc(100vh-0.75rem)] w-full max-w-[1420px] overflow-hidden rounded-[16px] bg-[#fafafa] shadow-[0_30px_80px_rgba(15,34,39,0.22)] sm:min-h-[calc(100vh-1.5rem)] lg:min-h-[calc(100vh-2.5rem)]">
        <aside className="flex w-[210px] min-w-[210px] shrink-0 flex-col border-r border-[#e1e1e1] bg-white px-3 py-5 sm:w-[240px] sm:min-w-[240px] sm:px-4 sm:py-6">
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

        <section className="min-w-0 flex-1 overflow-y-auto bg-[#fbfbfb] px-3 py-5 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between gap-3">
            <div className="relative min-w-0 max-w-[610px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-[1.7] text-[#656767]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search prompts" className="h-[42px] w-full rounded-[20px] border-0 bg-[#f0f0f0] pl-10 pr-3 text-[12px] text-[#1e2021] outline-none placeholder:text-[#7d7e7f] focus:ring-2 focus:ring-[#ccd0d0] sm:text-[15px]" />
            </div>
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Open store" className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#dedede] bg-white text-[#25292a] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors hover:bg-[#f4f4f4]"><Store className="h-4 w-4" strokeWidth={1.9} /></button>
              <button type="button" aria-label="Account" className="hidden h-8 w-8 items-center justify-center rounded-full bg-[#25292a] text-white sm:flex"><UserRound className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mt-7 max-w-[760px] sm:mt-9">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#929393]">{active}</p>
                <h1 className="text-[21px] font-semibold leading-[1.05] tracking-[-0.06em] text-[#171819] sm:text-[28px]">Witness Interview</h1>
              </div>
              <button type="button" aria-label="More library options" className="rounded-full p-2 text-[#8b8c8c] hover:bg-[#f0f0f0]"><MoreHorizontal className="h-6 w-6" /></button>
            </div>
            <p className="mt-5 max-w-[690px] text-[12px] leading-[1.4] tracking-[-0.035em] text-[#77797a] sm:text-[15px]">Convert an interview into a structured account of what happened, what is supported, and what remains open.</p>
            <div className="mt-3 flex items-center gap-2 text-[#7c7d7e]"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#171a1b] text-[12px] font-semibold text-white">M</span><span className="text-[11px] sm:text-[12px]">Margin Library · 2d ago</span></div>
          </div>

          <div className="mt-9 grid max-w-[760px] gap-3 pb-12 sm:mt-11 sm:gap-6">
            {visibleCards.length > 0 ? visibleCards.map((prompt) => <PromptCard key={prompt.title} prompt={prompt} />) : (
              <div className="rounded-[8px] border border-dashed border-[#d2d2d2] px-6 py-12 text-center text-[17px] text-[#77797a]">No prompts match “{search}”.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
