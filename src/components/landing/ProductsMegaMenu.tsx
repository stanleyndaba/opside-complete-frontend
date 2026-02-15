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
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export function ProductsMegaMenu() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-white/5 text-white/60 hover:text-white data-[state=open]:!bg-white/5 data-[state=open]:!text-white h-auto py-2 px-3 text-[10px] font-mono font-bold uppercase tracking-widest outline-none">
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="flex flex-col lg:flex-row w-[calc(100vw-2rem)] md:w-[700px] lg:w-[940px] bg-[#050505]/95 [backdrop-filter:blur(32px)_saturate(180%)] rounded-xl overflow-hidden shadow-2xl shadow-black/80 max-h-[85vh] overflow-y-auto scrollbar-hide border border-white/10">

                            {/* Section 1: Audit Vectors (Core Recovery) */}
                            <div className="flex-[1.5] p-6 lg:p-8 border-r border-white/5">
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2 mb-6">
                                    Audit Vectors
                                </h4>
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

                                <div className="h-px bg-white/5 my-8 w-full" />

                                {/* Section 2: Governance & Scale */}
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2 mb-6">
                                    Governance & Scale
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    <NavItem
                                        icon={ShieldAlert}
                                        title="Inbound Fee Governance"
                                        description="Line-by-line proof for every claim filed"
                                        href="/products/inbound-fee-governance"
                                    />
                                    <NavItem
                                        icon={Briefcase}
                                        title="Agency Portfolio Manager"
                                        description="Multi-account reconciliation for high-volume"
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

                            {/* Section 3: By Profile (Updated) */}
                            <div className="flex-1 p-6 lg:p-8 bg-white/[0.02]">
                                <h4 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] px-2 mb-6">
                                    By Profile
                                </h4>
                                <div className="flex flex-col gap-2">
                                    <NavItem
                                        icon={TrendingUp}
                                        title="Growth ($0 - $1M)"
                                        description="Automated recovery for emerging brands"
                                        href="/contact"
                                    />
                                    <NavItem
                                        icon={Zap}
                                        title="High Volume ($1M - $10M)"
                                        description="Deep-dive forensic audit for scale"
                                        href="/sales"
                                    />
                                    <NavItem
                                        icon={ShieldAlert}
                                        title="Institutional ($10M+)"
                                        description="Aggregator & Private Equity Infrastructure"
                                        href="/sales"
                                    />
                                </div>

                                <div className="mt-12 p-6 rounded-xl border border-white/5 bg-white/[0.02] group/banner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover/banner:opacity-20 transition-opacity">
                                        <Sparkles className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <h5 className="text-[11px] font-bold text-white mb-2">Need a Custom Solution?</h5>
                                    <p className="text-[10px] text-white/40 leading-relaxed mb-4">
                                        Our engineering team can build custom API integrations for multi-channel recovery.
                                    </p>
                                    <Link
                                        to="/contact"
                                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 uppercase tracking-wider"
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
                "group block p-3 rounded-lg transition-all duration-300",
                highlight ? "bg-emerald-500/[0.03] border border-emerald-500/10 hover:bg-emerald-500/10 hover:border-emerald-500/20" : "hover:bg-white/5"
            )}
        >
            <div className="flex items-start gap-3">
                <div className={cn(
                    "p-2 rounded-lg border transition-all shrink-0",
                    highlight
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        : "bg-white/5 text-white/40 border-white/10 group-hover:border-white/20 group-hover:bg-white/10 group-hover:text-white"
                )}>
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <span className={cn(
                        "text-[11px] font-bold tracking-tight block",
                        highlight ? "text-emerald-400 group-hover:text-emerald-300" : "text-white/90 group-hover:text-white"
                    )}>
                        {title}
                    </span>
                    <p className="text-[9px] text-white/30 mt-0.5 leading-tight group-hover:text-white/50 transition-colors">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}
