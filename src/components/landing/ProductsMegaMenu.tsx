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
                    <NavigationMenuTrigger className="h-9 rounded-[6px] border border-transparent bg-transparent px-3 text-[10px] font-sans font-bold uppercase tracking-tight text-white/76 outline-none transition-all hover:border-white/8 hover:bg-white/[0.04] hover:text-white data-[state=open]:!border-white/8 data-[state=open]:!bg-white/[0.04] data-[state=open]:!text-white">
                        Products
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="lg:fixed lg:left-1/2 lg:-translate-x-1/2 lg:top-[85px] flex flex-col lg:flex-row w-[calc(100vw-2rem)] lg:w-[95vw] lg:max-w-[1440px] bg-[#050505] rounded-xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,1)] border border-white/10 relative z-[100]">

                            {/* Column 1: Recovery Coverage */}
                            <div className="flex-[1.6] p-6 lg:p-7 border-r border-white/5">
                                <div className="mb-5 flex items-center justify-between">
                                    <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-tight">
                                        Recovery Coverage
                                    </h4>
                                    <span className="text-[7px] font-bold text-emerald-500/50 bg-emerald-500/5 px-2 py-0.5 border border-emerald-500/10 uppercase tracking-tighter rounded">
                                        Core Coverage
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    <NavItem
                                        icon={Search}
                                        title="Inbound Shipments"
                                        description="Short receives and receiving drift"
                                    />
                                    <NavItem
                                        icon={ShieldCheck}
                                        title="Lost or Damaged Inventory"
                                        description="Recovery across FBA states"
                                    />
                                    <NavItem
                                        icon={BoxSelect}
                                        title="Fee Discrepancies"
                                        description="Overcharges, reversals, and gaps"
                                    />
                                    <NavItem
                                        icon={ArrowLeft}
                                        title="Refund Without Return"
                                        description="Refunds not matched to real return outcome"
                                    />
                                    <NavItem
                                        icon={Truck}
                                        title="Transfer & Operations"
                                        description="Inter-fulfillment discrepancies"
                                    />
                                    <NavItem
                                        icon={BarChart3}
                                        title="Recovery Workflow"
                                        description="Valid cases, evidence, filing, payout"
                                        highlight
                                    />
                                </div>
                            </div>

                            {/* Column 2: Evidence & Control */}
                            <div className="flex-1 p-6 lg:p-7 border-r border-white/5 bg-white/[0.01]">
                                <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-tight mb-5">
                                    Evidence & Control
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    <NavItem
                                        icon={Layers}
                                        title="Evidence Matching"
                                        description="Connect support to the right case"
                                    />
                                    <NavItem
                                        icon={Briefcase}
                                        title="Filing Readiness"
                                        description="Hold weak or duplicate issues back"
                                    />
                                    <NavItem
                                        icon={BadgePercent}
                                        title="Recovery Tracking"
                                        description="Approval and payout visibility"
                                    />
                                    <NavItem
                                        icon={FileText}
                                        title="Connected Sources"
                                        description="Email, storage, and uploaded proof"
                                    />
                                </div>
                            </div>

                            {/* Column 3: By Seller Type */}
                            <div className="flex-[0.8] p-6 lg:p-7 bg-white/[0.02]">
                                <h4 className="text-[9px] font-bold text-white/30 uppercase tracking-tight mb-5">
                                    By Seller Type
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                    <NavItem
                                        icon={Activity}
                                        title="Emerging Sellers"
                                        description="Read-only audit and guided recovery"
                                    />
                                    <NavItem
                                        icon={TrendingUp}
                                        title="Growth Sellers"
                                        description="Ongoing recovery coverage at scale"
                                    />
                                    <NavItem
                                        icon={Layers}
                                        title="Enterprise Teams"
                                        description="Multi-workspace recovery operations"
                                    />
                                </div>

                                <div className="mt-6 p-5 rounded-xl border border-transparent bg-emerald-500/[0.02] relative overflow-hidden">
                                    <h5 className="text-[9px] font-bold text-white mb-1">Enterprise Support</h5>
                                    <p className="text-[8px] text-white/40 leading-relaxed mb-3 line-clamp-1">
                                        Recovery coverage for larger and more complex operations.
                                    </p>
                                    <div className="text-[8px] font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-tight cursor-default">
                                        Recovery Coverage <ArrowRight className="h-2.5 w-2.5" />
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
                "group block p-3.5 rounded-lg border border-transparent cursor-default",
                highlight
                    ? "bg-emerald-500/[0.03] border-emerald-500/10"
                    : "bg-transparent"
            )}
        >
            <div className="flex items-center gap-3.5">
                <div className={cn(
                    "p-2 rounded-lg border border-transparent transition-all shrink-0",
                    highlight
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-white/5 text-white/40"
                )}>
                    <Icon className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                    <span className={cn(
                        "text-[9.5px] font-bold tracking-tight block whitespace-nowrap",
                        highlight ? "text-emerald-400" : "text-white/90"
                    )}>
                        {title}
                    </span>
                    <p className="text-[8px] text-white/20 mt-1 leading-none">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
}
