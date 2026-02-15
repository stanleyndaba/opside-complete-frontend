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
                        <div className="lg:fixed lg:left-1/2 lg:-translate-x-1/2 lg:top-[85px] flex flex-col lg:flex-row w-[calc(100vw-2rem)] lg:w-[95vw] lg:max-w-[1440px] bg-[#050505] rounded-xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,1)] border border-white/10 relative z-[100]">

                            {/* Column 1: Audit Vectors */}
                            <div className="flex-[1.4] p-4 lg:p-5 border-r border-white/5">
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em]">
                                        Audit Vectors
                                    </h4>
                                    <span className="text-[7px] font-bold text-emerald-500/50 bg-emerald-500/5 px-1.5 py-0.5 border border-emerald-500/10 uppercase tracking-tighter rounded">
                                        Core Engine
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
                                    <NavItem
                                        icon={Search}
                                        title="Inbound Variance"
                                        description="Reconcile shipping plan/ledger"
                                    />
                                    <NavItem
                                        icon={ShieldCheck}
                                        title="Inventory"
                                        description="Lost & destroyed unit recovery"
                                    />
                                    <NavItem
                                        icon={BoxSelect}
                                        title="Dim Weight"
                                        description="Correct Cubiscan errors"
                                    />
                                    <NavItem
                                        icon={ArrowLeft}
                                        title="Return Logistics"
                                        description="Unreturned inventory tracking"
                                    />
                                    <NavItem
                                        icon={Truck}
                                        title="Operations"
                                        description="Inter-fulfillment center loss"
                                    />
                                    <NavItem
                                        icon={Sparkles}
                                        title="Full Forensic Audit"
                                        description="Deploy all 26 agents"
                                        highlight
                                    />
                                </div>
                            </div>

                            {/* Column 2: Governance & Scale */}
                            <div className="flex-1 p-4 lg:p-5 border-r border-white/5 bg-white/[0.01]">
                                <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em] mb-3">
                                    Governance & Scale
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                    <NavItem
                                        icon={Layers}
                                        title="Fee Governance"
                                        description="Line-by-line proof"
                                    />
                                    <NavItem
                                        icon={Briefcase}
                                        title="Agency Portfolio"
                                        description="Multi-account reconciliation"
                                    />
                                    <NavItem
                                        icon={BadgePercent}
                                        title="Commission Rate"
                                        description="Detect overcharges & errors"
                                    />
                                    <NavItem
                                        icon={FileText}
                                        title="Auto-Invoice"
                                        description="Gmail integration for evidence"
                                    />
                                </div>
                            </div>

                            {/* Column 3: By Profile */}
                            <div className="flex-[0.8] p-4 lg:p-5 bg-white/[0.02]">
                                <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em] mb-3">
                                    By Profile
                                </h4>
                                <div className="grid grid-cols-1 gap-1">
                                    <NavItem
                                        icon={Activity}
                                        title="Growth ($0 - $1M)"
                                        description="Automated recovery for emerging brands"
                                    />
                                    <NavItem
                                        icon={TrendingUp}
                                        title="High Volume ($1M - $10M)"
                                        description="Deep-dive forensic audit for scale"
                                    />
                                    <NavItem
                                        icon={Layers}
                                        title="Institutional ($10M+)"
                                        description="Aggregator & Private Equity Infrastructure"
                                    />
                                </div>

                                <div className="mt-4 p-3.5 rounded-xl border border-white/10 bg-emerald-500/[0.02] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                        <Sparkles className="h-6 w-6 text-emerald-500" />
                                    </div>
                                    <h5 className="text-[10px] font-bold text-white mb-0.5">Custom Solutions</h5>
                                    <p className="text-[8px] text-white/40 leading-relaxed mb-2 line-clamp-1">
                                        Engineering for multi-channel recovery.
                                    </p>
                                    <div className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-[0.15em] cursor-default">
                                        Proprietary Architecture <ArrowRight className="h-2 w-2" />
                                    </div>
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
    highlight = false
}: {
    icon: any,
    title: string,
    description: string,
    highlight?: boolean
}) {
    return (
        <div
            className={cn(
                "group block p-2 rounded-lg border border-transparent cursor-default",
                highlight
                    ? "bg-emerald-500/[0.03] border-emerald-500/10"
                    : "bg-transparent"
            )}
        >
            <div className="flex items-center gap-2.5">
                <div className={cn(
                    "p-1.5 rounded-lg border transition-all shrink-0",
                    highlight
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-white/5 text-white/40 border-white/10"
                )}>
                    <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                    <span className={cn(
                        "text-[10px] font-bold tracking-tight block truncate",
                        highlight ? "text-emerald-400" : "text-white/90"
                    )}>
                        {title}
                    </span>
                    <p className="text-[8px] text-white/20 mt-0.5 leading-none truncate">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}
