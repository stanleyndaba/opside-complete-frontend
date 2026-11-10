import { useMemo, useState } from "react";
import {
  Check,
  List,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Search,
  Star,
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
  { label: "Favorites", count: 20, icon: "favorites" },
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
  if (icon === "all") return <Menu className="h-[25px] w-[25px] stroke-[1.8]" />;
  if (icon === "prompts") return <MessageSquare className="h-[25px] w-[25px] stroke-[1.8]" />;
  if (icon === "workflows") return <List className="h-[25px] w-[25px] stroke-[1.8]" />;
  if (icon === "favorites") return <Star className="h-[25px] w-[25px] stroke-[1.8]" />;
  return <UserRound className="h-[25px] w-[25px] stroke-[1.8]" />;
}

function CountedItem({ item, active, onClick }: { item: LibraryItem; active?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-[17px] px-4 py-3 text-left transition-colors sm:px-5 sm:py-3.5 ${
        active ? "bg-[#efefef]" : "hover:bg-[#f5f5f5]"
      }`}
    >
      <span className="shrink-0 text-[#1c1d1e]"><ItemIcon icon={item.icon} /></span>
      <span className="min-w-0 flex-1 truncate text-[18px] font-medium tracking-[-0.02em] text-[#18191a] sm:text-[21px]">{item.label}</span>
      <span className="text-[18px] font-normal text-[#969797] sm:text-[20px]">{item.count}</span>
    </button>
  );
}

function PromptCard({ prompt }: { prompt: Prompt }) {
  return (
    <article className="rounded-[22px] border border-[#dedede] bg-white px-5 py-5 shadow-[0_1px_1px_rgba(0,0,0,0.02)] sm:px-7 sm:py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[23px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#171819] sm:text-[27px]">{prompt.title}</h3>
          <p className="mt-4 max-w-[560px] text-[17px] leading-[1.45] tracking-[-0.02em] text-[#77797a] sm:text-[19px]">{prompt.description}</p>
        </div>
        <button type="button" aria-label={`More options for ${prompt.title}`} className="mt-1 shrink-0 rounded-full p-1 text-[#77797a] hover:bg-[#f1f1f1]">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-6 flex items-center gap-3 text-[#77797a]">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-semibold text-white ${prompt.tone}`}>{prompt.initials}</span>
        <span className="text-[16px] font-medium sm:text-[18px]">{prompt.time}</span>
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
    <main className="min-h-screen overflow-x-hidden bg-[#5d7880] px-3 py-3 text-[#18191a] sm:px-6 sm:py-6 lg:px-10 lg:py-10">
      <section className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1420px] overflow-hidden rounded-[34px] bg-[#fafafa] shadow-[0_30px_80px_rgba(15,34,39,0.22)] sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-5rem)]">
        <aside className="flex w-[37%] min-w-[285px] shrink-0 flex-col border-r border-[#e1e1e1] px-5 py-9 sm:px-9 sm:py-12 lg:w-[40%] lg:px-12 xl:w-[39%] xl:px-16">
          <div className="flex items-center justify-between">
            <h1 className="text-[29px] font-semibold tracking-[-0.055em] sm:text-[36px] lg:text-[39px]">Library</h1>
            <button type="button" className="rounded-full p-2 text-[#8b8c8c] hover:bg-[#f0f0f0] lg:hidden" aria-label="Open library menu"><Menu className="h-5 w-5" /></button>
          </div>

          <button type="button" className="mt-9 flex h-[66px] items-center gap-5 rounded-[20px] border border-[#d8d8d8] bg-white px-6 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:bg-[#f7f7f7] sm:mt-11">
            <Plus className="h-8 w-8 stroke-[1.5] text-[#3f4141]" />
            <span className="text-[22px] font-medium tracking-[-0.035em] sm:text-[27px]">Create new</span>
          </button>

          <div className="mt-10 sm:mt-12">
            <p className="mb-5 px-4 text-[18px] font-medium text-[#888989] sm:px-5 sm:text-[22px]">Type</p>
            <div className="space-y-1.5">
              {navigation.map((item) => <CountedItem key={item.label} item={item} active={active === item.label} onClick={() => setActive(item.label)} />)}
            </div>
          </div>

          <div className="mt-11 sm:mt-14">
            <p className="mb-5 px-4 text-[18px] font-medium text-[#888989] sm:px-5 sm:text-[22px]">Filters</p>
            <div className="space-y-1.5">
              {filters.map((item) => <CountedItem key={item.label} item={item} active={active === item.label} onClick={() => setActive(item.label)} />)}
            </div>
          </div>

          <div className="mt-auto hidden items-center gap-4 border-t border-[#e6e6e6] pt-7 text-[#242626] sm:flex">
            <UsersRound className="h-6 w-6 stroke-[1.7]" />
            <span className="min-w-0 flex-1 truncate text-[18px] font-medium">Junestrand &amp; Labor</span>
            <span className="text-[18px] text-[#969797]">180</span>
          </div>
        </aside>

        <section className="min-w-0 flex-1 overflow-y-auto bg-[#fbfbfb] px-5 py-8 sm:px-10 sm:py-12 lg:px-14 xl:px-20">
          <div className="flex items-center justify-between gap-5">
            <div className="relative min-w-0 flex-1 max-w-[610px]">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-7 w-7 -translate-y-1/2 stroke-[1.7] text-[#656767]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search prompts" className="h-[70px] w-full rounded-[20px] border-0 bg-[#f0f0f0] pl-16 pr-5 text-[20px] text-[#1e2021] outline-none placeholder:text-[#7d7e7f] focus:ring-2 focus:ring-[#ccd0d0] sm:text-[26px]" />
            </div>
            <button type="button" aria-label="Account" className="hidden h-12 w-12 items-center justify-center rounded-full bg-[#25292a] text-white sm:flex"><UserRound className="h-5 w-5" /></button>
          </div>

          <div className="mt-12 max-w-[760px] sm:mt-16">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="mb-3 text-[14px] font-semibold uppercase tracking-[0.18em] text-[#929393]">{active}</p>
                <h2 className="text-[31px] font-semibold leading-[1.05] tracking-[-0.06em] text-[#171819] sm:text-[42px]">Witness Interview</h2>
              </div>
              <button type="button" aria-label="More library options" className="rounded-full p-2 text-[#8b8c8c] hover:bg-[#f0f0f0]"><MoreHorizontal className="h-6 w-6" /></button>
            </div>
            <p className="mt-5 max-w-[690px] text-[20px] leading-[1.4] tracking-[-0.035em] text-[#77797a] sm:text-[28px]">Convert an interview into a structured account of what happened, what is supported, and what remains open.</p>
            <div className="mt-6 flex items-center gap-3 text-[#7c7d7e]"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#171a1b] text-[12px] font-semibold text-white">M</span><span className="text-[17px] sm:text-[19px]">2d ago</span></div>
          </div>

          <div className="mt-9 grid max-w-[760px] gap-5 pb-12 sm:mt-11 sm:gap-6">
            {visibleCards.length > 0 ? visibleCards.map((prompt) => <PromptCard key={prompt.title} prompt={prompt} />) : (
              <div className="rounded-[22px] border border-dashed border-[#d2d2d2] px-6 py-12 text-center text-[17px] text-[#77797a]">No prompts match “{search}”.</div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
