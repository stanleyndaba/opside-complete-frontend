import { useState } from "react";
import { ChevronRight, Store, Briefcase, Building2, Layers, WalletCards, Crown, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

const teamDestinations: Array<{ title: string; description: string; icon: LucideIcon; href: string }> = [
  {
    title: "Established FBA Brands",
    description: "Continuous recovery control for brands with recurring shipment volume, meaningful inventory exposure and growing operational complexity.",
    icon: Store,
    href: "/established-fba-brands",
  },
  {
    title: "Agencies & Amazon Operators",
    description: "Manage recoveries across client accounts while keeping evidence, ownership and seller approvals clear.",
    icon: Briefcase,
    href: "/agencies-amazon-operators",
  },
  {
    title: "Aggregators & Multi-Brand Portfolios",
    description: "Standardize recovery monitoring, case handling and financial reconciliation across multiple brands and entities.",
    icon: Building2,
    href: "/aggregators-multi-brand",
  },
  {
    title: "Enterprise & Multi-Marketplace",
    description: "Coordinate recovery control across marketplaces, entities, operating teams and higher-volume financial populations.",
    icon: Building2,
    href: "/enterprise-multi-marketplace",
  },
  {
    title: "Operations Teams",
    description: "See evidence readiness, deadlines, ownership, Amazon responses and the next required action.",
    icon: Layers,
    href: "/marketplace-operations",
  },
  {
    title: "Finance Teams",
    description: "Compare expected, approved, paid, underpaid, reversed and unreconciled values from one recovery record.",
    icon: WalletCards,
    href: "/finance-teams",
  },
  {
    title: "Founders & Leadership",
    description: "Understand current recovery exposure, unresolved financial risk and the value reaching the business.",
    icon: Crown,
    href: "/founder-led",
  },
];

export function ExploreMoreTeams() {
  const [expanded, setExpanded] = useState(false);
  const visibleDestinations = expanded ? teamDestinations : teamDestinations.slice(0, 4);

  return (
    <section aria-labelledby="explore-more-teams-title" className="relative overflow-hidden bg-[#F5F6F4] py-12 sm:py-16 md:py-20">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <div className="max-w-[760px]">
          <p className="font-mono text-[9px] font-normal uppercase tracking-tight text-[#F05A3C] sm:text-[10px]">For Teams</p>
          <h2 id="explore-more-teams-title" className="mt-3 font-lora text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]">Explore more for Teams</h2>
          <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">See how Margin fits different operating responsibilities, from Amazon operations and finance to founder-led businesses and enterprise oversight.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visibleDestinations.map(({ title, description, icon: Icon, href }) => (
            <article key={href} className="group flex min-h-[238px] flex-col rounded-[8px] bg-white p-5 shadow-[0_8px_24px_rgba(24,32,38,0.04)] transition-transform duration-200 hover:-translate-y-0.5 sm:p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#F1F5F6] text-[#52616A] transition-colors group-hover:bg-[#FDE9E4] group-hover:text-[#F05A3C]"><Icon className="h-[18px] w-[18px]" strokeWidth={1.6} /></div>
              <h3 className="mt-6 text-[15px] font-semibold leading-5 tracking-tight text-[#182026]">{title}</h3>
              <p className="mt-3 flex-1 text-[13px] leading-6 text-[#667177]">{description}</p>
              <Link to={href} className="mt-5 inline-flex w-fit items-center gap-1 text-[12px] font-semibold text-[#F05A3C] transition-colors hover:text-[#D9472D]">Learn more <ChevronRight className="h-3.5 w-3.5" /></Link>
            </article>
          ))}
        </div>
        {!expanded && teamDestinations.length > 4 ? <button type="button" onClick={() => setExpanded(true)} className="mx-auto mt-8 inline-flex items-center gap-1 text-[13px] font-semibold text-[#F05A3C] transition-colors hover:text-[#D9472D]">See More <ChevronRight className="h-4 w-4" /></button> : null}
      </div>
    </section>
  );
}
