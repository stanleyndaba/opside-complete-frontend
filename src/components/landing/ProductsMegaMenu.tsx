import React from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger
} from '@/components/ui/navigation-menu';
import {
    CircleDollarSign,
    ShieldAlert,
    FileText,
    Search,
    Briefcase,
    TrendingUp,
    ArrowRight,
    BoxSelect,
    BadgePercent,
    Truck,
    Sparkles,
    Zap,
    ShieldCheck,
    ArrowLeft,
    Layers,
    BarChart3,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function ProductsMegaMenu() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-white/5 text-white/60 hover:text-white data-[state=open]:!bg-white/5 data-[state=open]:!text-white h-auto py-2 px-3 text-[10px] font-mono font-bold uppercase tracking-widest outline-none transition-all">
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="flex flex-col lg:flex-row w-[calc(100vw-2rem)] md:w-[900px] lg:w-[1300px] xl:w-[1440px] bg-[#050505] rounded-xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,1)] border border-white/10 lg:-translate-x-[450px] relative z-[100]">

                            {/* Column 1: Audit Vectors */}
                            <div className="flex-[1.4] p-6 lg:p-7 border-r border-white/5">
                                <div className="mb-5 flex items-center justify-between">
                                    <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em]">
                                        Audit Vectors
                                    </h4>
                                    <span className="text-[8px] font-bold text-emerald-500/50 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 uppercase tracking-tighter rounded">
                                        Core Engine
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    <NavItem
                                        icon={Search}
                                        title="Inbound Variance"
                                        description="Reconcile shipping plan vs. ledger receipts"
                                        href="/products/inbound-variance-monitor"
                                    />
                                    <NavItem
                                        icon={ShieldCheck}
                                        title="Inventory Reconciliation"
                                        description="Lost, damaged, and destroyed unit recovery"
                                        href="/products/fba-reimbursements"
                                    />
                                    <NavItem
                                        icon={BoxSelect}
                                        title="Dimensional Weight Audit"
                                        description="Correct Cubiscan errors & fee overcharges"
                                        href="/products/fee-forensics"
                                    />
                                    <NavItem
                                        icon={ArrowLeft}
                                        title="Return Logistics"
                                        description="Unreturned inventory & customer concession"
                                        href="/products/return-audits"
                                    />
                                    <NavItem
                                        icon={Truck}
                                        title="Transfer & Operations"
                                        description="Inter-fulfillment center loss tracking"
                                        href="/products/transfer-audits"
                                    />
                                    <NavItem
                                        icon={Sparkles}
                                        title="Full Forensic Audit"
                                        description="Deploy all 26 agents for total recovery"
                                        href="/ultra-beta"
                                        highlight
                                    />
                                </div>
                            </div>

                            {/* Column 2: Governance & Scale */}
                            <div className="flex-1 p-6 lg:p-7 border-r border-white/5 bg-white/[0.01]">
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em] mb-5">
                                    Governance & Scale
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <NavItem
                                        icon={Layers}
                                        title="Inbound Fee Governance"
                                        description="Line-by-line proof for every claim filed"
                                        href="/products/inbound-fee-governance"
                                    />
                                    <NavItem
                                        icon={Briefcase}
                                        title="Agency Portfolio Manager"
                                        description="Multi-account reconciliation for agencies"
                                        href="/products/agency-manager"
                                    />
                                    <NavItem
                                        icon={BadgePercent}
                                        title="Commission Rate Audit"
                                        description="Detect referral fee overcharges & errors"
                                        href="/products/commission-rate-governance"
                                    />
                                    <NavItem
                                        icon={FileText}
                                        title="Auto-Invoice Sync"
                                        description="Zero-touch Gmail integration for evidence"
                                        href="/products/evidence-vault"
                                    />
                                </div>
                            </div>

                            {/* Column 3: By Profile */}
                            <div className="flex-[0.9] p-6 lg:p-7 bg-white/[0.02]">
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.25em] mb-5">
                                    By Profile
                                </h4>
                                <div className="flex flex-col gap-2">
                                    <NavItem
                                        icon={Activity}
                                        title="Growth ($0 - $1M)"
                                        description="Automated recovery for emerging brands"
                                        href="/contact"
                                    />
                                    <NavItem
                                        icon={TrendingUp}
                                        title="High Volume ($1M - $10M)"
                                        description="Deep-dive forensic audit for scale"
                                        href="/sales"
                                    />
                                    <NavItem
                                        icon={Layers}
                                        title="Institutional ($10M+)"
                                        description="Aggregator & PE Infrastructure"
                                        href="/sales"
                                    />
                                </div>

                                <div className="mt-8 p-5 rounded-xl border border-white/10 bg-emerald-500/[0.02] group/banner relative overflow-hidden transition-all hover:border-emerald-500/20">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/banner:opacity-40 transition-opacity">
                                        <Sparkles className="h-10 w-10 text-emerald-500" />
                                    </div>
                                    <h5 className="text-[11px] font-bold text-white mb-1.5">Custom Solutions</h5>
                                    <p className="text-[9px] text-white/40 leading-relaxed mb-4 line-clamp-2">
                                        Our engineering team can build custom API integrations for multi-channel recovery.
                                    </p>
                                    <Link
                                        to="/contact"
                                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 uppercase tracking-[0.15em]"
                                    >
                                        Talk to Engineering <ArrowRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

function NavItem({
    icon: Icon,
    title,
    description,
    href,
    highlight = false
}: {
    icon: any,
    title: string,
    description: string,
    href: string,
    highlight?: boolean
}) {
    return (
        <Link
            to={href}
            className={cn(
                "group block p-3.5 rounded-xl transition-all duration-300 border border-transparent",
                highlight
                    ? "bg-emerald-500/[0.03] border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                    : "hover:bg-white/[0.05] hover:border-white/5 active:scale-[0.98]"
            )}
        >
            <div className="flex items-start gap-3.5">
                <div className={cn(
                    "p-2.5 rounded-xl border transition-all shrink-0",
                    highlight
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                        : "bg-white/5 text-white/40 border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white"
                )}>
                    <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                    <span className={cn(
                        "text-[11px] font-bold tracking-tight block truncate",
                        highlight ? "text-emerald-400 group-hover:text-emerald-300" : "text-white/90 group-hover:text-white"
                    )}>
                        {title}
                    </span>
                    <p className="text-[9px] text-white/30 mt-1 leading-normal group-hover:text-white/50 transition-colors line-clamp-2">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}
