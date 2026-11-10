import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  List,
  Menu,
  MessageSquare,
  MousePointer2,
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

function AmazonThreadPeek() {
  return (
    <motion.div key="amazon-thread-peek" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="max-w-[900px] pb-12">
      <div className="border-b border-[#e5e5e5] pb-7"><p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#929393]">Governed Amazon response record</p><h2 className="mt-3 text-[32px] font-semibold leading-[1.02] tracking-[-0.06em] text-[#171819] sm:text-[48px]">What Amazon changed in the financial position</h2><p className="mt-5 max-w-[760px] text-[16px] leading-[1.5] tracking-[-0.02em] text-[#77797a] sm:text-[19px]">EVT-FBA-2026-0001847 · Case 19822888381. Amazon correspondence remains attached to the governed event; communication alone does not establish settlement or financial closure.</p></div>
      <div className="mt-7 flex flex-wrap items-center gap-3"><img src="/gmailicon.png" alt="Amazon thread" className="h-6 w-6 object-contain" /><h3 className="text-[19px] font-semibold tracking-[-0.03em]">Amazon Thread</h3><span className="rounded-full bg-[#efefef] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#555757]">Partial approval · residual open</span></div>
      <p className="mt-4 text-[13px] leading-6 text-[#77797a]">Supported exposure <strong className="font-semibold text-[#252727]">$38,850</strong> · Amazon approved <strong className="font-semibold text-[#252727]">$26,000</strong> · Residual position <strong className="font-semibold text-[#252727]">$12,850</strong> · Settlement verification pending.</p>
      <div className="mt-7 space-y-4"><article className="rounded-[16px] border border-[#dbe7ee] bg-[#f5f8fc] p-5 sm:p-7"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7c88]"><span className="rounded-full bg-white px-2.5 py-1">Inbound</span><span>05/09/26, 11:16</span><span className="rounded-full bg-white px-2.5 py-1">Amazon decision · partial approval</span></div><h4 className="mt-4 text-[16px] font-semibold leading-6 tracking-[-0.02em] text-[#07111a] sm:text-[19px]">Partial approval issued — $26,000 | $12,850 residual</h4><p className="mt-3 text-[13px] leading-6 text-[#4d5b66]">Amazon approved and issued $26,000 against the supported $38,850 exposure. The remaining $12,850 remains unresolved and subject to settlement verification.</p><div className="mt-4 flex flex-wrap gap-2 text-[10px] font-semibold text-[#4d5b66]"><span className="border border-[#d8e3e8] bg-white px-2.5 py-2">AmazonResponse-19822888381.html</span><span className="border border-[#d8e3e8] bg-white px-2.5 py-2">Settlement-Partial-Reimbursement.csv</span></div></article><article className="rounded-[16px] border border-[#dcefe3] bg-[#f4faf6] p-5 sm:p-7"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#4b946f]"><span className="rounded-full bg-white px-2.5 py-1">Outbound</span><span className="text-[#6b7c88]">13:24:17</span><span className="rounded-full bg-white px-2.5 py-1">Targeted residual response</span></div><h4 className="mt-4 text-[16px] font-semibold leading-6 tracking-[-0.02em] text-[#07111a] sm:text-[19px]">Residual evidence response prepared | $12,850</h4><p className="mt-3 text-[13px] leading-6 text-[#4d5b66]">Margin mapped Amazon’s request to the existing governed event record rather than restarting the case. Accepted evidence and settled value remain attached; only the residual position requires action.</p><div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#4b946f]"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4b946f] text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>Seller approval required before the next controlled action</div></article></div>
    </motion.div>
  );
}

export default function DemoTests() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState("Workflows");
  const [search, setSearch] = useState("");
  const [demoPhase, setDemoPhase] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setActive("Favourites");
      setDemoPhase(3);
      return;
    }
    const timer = window.setInterval(() => {
      setDemoPhase((current) => {
        const next = current >= 6 ? 0 : current + 1;
        if (next >= 2 && next <= 5) setActive("Favourites");
        if (next === 0) setActive("Workflows");
        return next;
      });
    }, 1350);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const visibleCards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return promptCards;
    return promptCards.filter((card) => `${card.title} ${card.description} ${card.author}`.toLowerCase().includes(query));
  }, [search]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#5d7880] px-3 py-3 text-[#18191a] sm:px-6 sm:py-6 lg:px-10 lg:py-10">
      <section className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1420px] overflow-hidden rounded-[34px] bg-[#fafafa] shadow-[0_30px_80px_rgba(15,34,39,0.22)] sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-5rem)]">
        <aside className="relative flex w-[37%] min-w-[285px] shrink-0 flex-col border-r border-[#e1e1e1] px-5 py-9 sm:px-9 sm:py-12 lg:w-[40%] lg:px-12 xl:w-[39%] xl:px-16">
          {!reduceMotion ? <motion.div aria-hidden="true" className="pointer-events-none absolute z-30 text-[#182026] drop-shadow-[0_3px_4px_rgba(24,32,38,0.22)]" initial={{ left: "42px", top: "150px", opacity: 0 }} animate={{ left: demoPhase >= 1 ? "92px" : "42px", top: demoPhase >= 1 ? "548px" : "150px", opacity: demoPhase === 6 ? 0 : 1 }} transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}><MousePointer2 className="h-8 w-8 fill-white stroke-[2]" />{demoPhase === 2 ? <motion.span initial={{ opacity: 0.9, scale: 0.45 }} animate={{ opacity: 0, scale: 1.9 }} transition={{ duration: 0.75 }} className="absolute -left-3 -top-3 h-10 w-10 rounded-full border-2 border-[#0B74DE]" /> : null}</motion.div> : null}
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

          <AnimatePresence mode="wait">
          {active === "Favourites" ? <AmazonThreadPeek /> : <motion.div key="library-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
          </motion.div>}
          </AnimatePresence>
        </section>
      </section>
    </main>
  );
}
